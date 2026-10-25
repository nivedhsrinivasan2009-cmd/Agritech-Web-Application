/**
 * Retrieval-Augmented Generation (RAG) helpers for the Gracia AI assistant.
 *
 * Turns the app's live data (events, activities, shops, zones, announcements) plus the
 * static knowledge base (FAQs, policies, farm info) into small documents, indexes them
 * with BM25, and retrieves the documents most relevant to a visitor's question.
 *
 * Shared by the browser (offline "Basic Mode" answers) and the AI backend (LLM context),
 * so it must stay plain JavaScript with no browser- or Vite-specific APIs.
 */

// ============ TEXT PROCESSING ============

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being", "am", "to", "of", "in",
  "on", "at", "for", "and", "or", "but", "if", "i", "me", "my", "we", "our", "us", "you", "your",
  "it", "its", "this", "that", "these", "those", "can", "could", "would", "should", "will",
  "shall", "do", "does", "did", "have", "has", "had", "there", "their", "they", "them", "what",
  "which", "who", "whom", "how", "please", "tell", "know", "about", "with", "any", "some", "get",
  "got", "want", "like", "just", "also", "so", "than", "then", "too", "very", "from", "into",
  "by", "as", "up", "out", "more", "most", "other", "such", "only", "same", "not", "no", "all",
  "each", "both", "here", "coming", "going", "go", "see", "let", "lets", "im", "id", "ill",
  "much", "many", "anything", "something", "is", "there", "s", "t",
]);

// Words a visitor might use interchangeably. Each word in a group expands to the others.
const SYNONYM_GROUPS = [
  ["food", "eat", "hungry", "meal", "lunch", "breakfast", "dinner", "snack", "restaurant", "cafe", "coffee", "drink", "bakery", "bread", "pastry"],
  ["kid", "child", "children", "family", "families", "toddler", "baby", "son", "daughter"],
  ["animal", "goat", "sheep", "rabbit", "bunny", "chicken", "petting", "feed"],
  ["shop", "store", "buy", "purchase", "gift", "souvenir", "market", "shopping"],
  ["toilet", "restroom", "bathroom", "washroom", "diaper", "nappy"],
  ["where", "direction", "map", "locate", "location", "way", "route", "navigate", "find", "zone", "area"],
  ["hour", "open", "opening", "close", "closing", "time", "when"],
  ["event", "happening", "schedule", "program", "show"],
  ["activity", "things", "experience", "fun"],
  ["workshop", "class", "course", "lesson", "training", "learn"],
  ["price", "cost", "fee", "ticket", "admission", "pay", "free"],
  ["parking", "car", "drive", "vehicle"],
  ["wheelchair", "accessible", "accessibility", "disability", "stroller", "pram"],
  ["emergency", "aid", "injured", "hurt", "accident", "doctor", "safety"],
  ["closed", "closure", "shut", "unavailable"],
  ["weekend", "saturday", "sunday"],
  ["today", "tonight", "now"],
  ["school", "student", "field", "trip", "education"],
  ["entrepreneur", "business", "networking", "corporate"],
  ["announcement", "news", "update", "alert"],
  ["rule", "guideline", "policy", "allowed"],
];

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Light suffix stripping so "feeding"/"feed", "events"/"event", "closed"/"close" match
export function stem(word) {
  let w = word;
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) w = w.slice(0, -3) + "y";
  else if (w.endsWith("ing") && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith("ed") && w.length > 4) w = w.slice(0, -2);
  else if (/(ches|shes|sses|xes)$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) w = w.slice(0, -1);

  // "shopping" -> "shopp" -> "shop"
  if (/([^aeiouls])\1$/.test(w)) w = w.slice(0, -1);
  // "close"/"closed"/"closing" -> "clos"
  if (w.length > 4 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

export function tokenize(text) {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOPWORDS.has(t))
    .map(stem);
}

const SYNONYMS = (() => {
  const map = new Map();
  SYNONYM_GROUPS.forEach((group) => {
    const stems = [...new Set(group.map(stem))];
    stems.forEach((s) => {
      if (!map.has(s)) map.set(s, new Set());
      stems.forEach((other) => other !== s && map.get(s).add(other));
    });
  });
  return map;
})();

// ============ DATE HELPERS (time-zone aware) ============

function safeTimeZone(timeZone) {
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return undefined;
  }
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayKey(date, timeZone) {
  // en-CA formats as yyyy-mm-dd
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function daysFromToday(date, now, timeZone) {
  return Math.round((Date.parse(dayKey(date, timeZone)) - Date.parse(dayKey(now, timeZone))) / 86400000);
}

function formatTime(date, timeZone) {
  return date.toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
}

function formatDay(date, timeZone) {
  return date.toLocaleDateString("en-US", { timeZone, weekday: "long", month: "long", day: "numeric" });
}

function weekdayName(date, timeZone) {
  return date.toLocaleDateString("en-US", { timeZone, weekday: "long" });
}

// Words describing when something happens relative to today, so questions like
// "what's on this weekend?" retrieve the right events
function relativeDayInfo(date, now, timeZone) {
  const diff = daysFromToday(date, now, timeZone);
  const weekday = weekdayName(date, timeZone);
  const keywords = [weekday.toLowerCase()];
  let label = formatDay(date, timeZone);

  if (diff === 0) {
    label = `Today (${label})`;
    keywords.push("today");
  } else if (diff === 1) {
    label = `Tomorrow (${label})`;
    keywords.push("tomorrow");
  } else if (diff === -1) {
    label = `Yesterday (${label})`;
  }

  if (diff >= 0 && diff <= 6) {
    keywords.push("this week");
    if (weekday === "Saturday" || weekday === "Sunday") keywords.push("this weekend");
  } else if (diff >= 7 && diff <= 13) {
    keywords.push("next week");
    if (weekday === "Saturday" || weekday === "Sunday") keywords.push("next weekend");
  }
  if (diff >= 0) keywords.push("upcoming");

  return { diff, label, keywords };
}

// ============ DOCUMENT BUILDING ============

const LABELS = {
  families: "Families", schools: "Schools", entrepreneurs: "Entrepreneurs", general: "Everyone",
  farm_walk: "farm walk tour", feeding: "animal feeding", kids_zone: "kids children play",
  workshop: "workshop class", exploration: "nature trail explore walk",
  cafe: "Café", farm_shop: "Farm Shop", gift_shop: "Gift Shop", partner_outlet: "Partner Outlet",
};

const EXTRA_KEYWORDS = {
  families: "family kids children",
  schools: "school students education field trip",
  entrepreneurs: "business entrepreneur networking",
  cafe: "food eat drink coffee",
  farm_shop: "buy produce groceries",
  gift_shop: "buy gift souvenir",
  partner_outlet: "buy eco sustainable",
};

const str = (value, max = 1200) => String(value ?? "").slice(0, max).trim();
const list = (value, max = 300) => (Array.isArray(value) ? value.slice(0, max).filter((v) => v && typeof v === "object") : []);

function describePosition(zone, zones) {
  const x = Number(zone.map_x);
  const y = Number(zone.map_y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return "";

  const vertical = y < 34 ? "north" : y > 66 ? "south" : "central";
  const horizontal = x < 34 ? "west" : x > 66 ? "east" : "";
  const area = vertical === "central" ? horizontal || "centre" : [vertical, horizontal].filter(Boolean).join("-");

  const nearest = zones
    .filter((z) => z.id !== zone.id && Number.isFinite(Number(z.map_x)) && Number.isFinite(Number(z.map_y)))
    .map((z) => ({ name: str(z.zone_name, 80), dist: Math.hypot(Number(z.map_x) - x, Number(z.map_y) - y) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 2)
    .map((z) => z.name);

  const placement = area === "centre" ? "In the centre of the farm" : `In the ${area} part of the farm`;
  return `${placement}${nearest.length ? `, nearest to ${nearest.join(" and ")}` : ""}.`;
}

function isAnnouncementActive(ann, now) {
  if (ann.is_active === false) return false;
  const start = toDate(ann.start_date);
  const end = toDate(ann.end_date) || toDate(ann.expires_at);
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

/**
 * Build retrievable documents from live app data and the static knowledge base.
 * @param {object} data - { events, activities, shops, locations, announcements, faqs, policies, info }
 * @param {object} options - { now: Date, timeZone: string }
 * @returns {Array<{id, type, title, text, summary, keywords}>}
 */
export function buildDocuments(data = {}, { now = new Date(), timeZone } = {}) {
  const tz = safeTimeZone(timeZone);
  const docs = [];
  const zones = list(data.locations);
  const zoneById = new Map(zones.map((z) => [z.id, z]));
  const zoneName = (id) => str(zoneById.get(id)?.zone_name, 80);
  const zoneClosedNote = (id) => {
    const zone = zoneById.get(id);
    return zone?.is_closed ? ` (this zone is currently CLOSED: ${str(zone.closure_reason, 200) || "temporarily unavailable"})` : "";
  };

  // Events: skip anything that ended before today, it's just noise
  list(data.events).forEach((event) => {
    const start = toDate(event.start_time);
    if (!start) return;
    const end = toDate(event.end_time);
    if (daysFromToday(end || start, now, tz) < 0) return;

    const when = relativeDayInfo(start, now, tz);
    const status = end && now > end ? "already finished" : now >= start ? "happening now" : "upcoming";
    const timeRange = `${formatTime(start, tz)}${end ? ` – ${formatTime(end, tz)}` : ""}`;
    const where = zoneName(event.location_id);
    const audience = LABELS[event.category] || str(event.category, 40);

    docs.push({
      id: `event:${event.id}`,
      type: "Event",
      title: str(event.title, 150),
      text: [
        `When: ${when.label}, ${timeRange} (${status})`,
        where && `Where: ${where}${zoneClosedNote(event.location_id)}`,
        audience && `Best for: ${audience}`,
        event.is_featured && "Featured event",
        event.price && `Price: ${str(event.price, 60)}`,
        `Details: ${str(event.description)}`,
      ].filter(Boolean).join("\n"),
      summary: `${when.label}, ${timeRange}${where ? ` at ${where}` : ""} (${status})`,
      keywords: ["event", status, ...when.keywords, EXTRA_KEYWORDS[event.category] || "", where].join(" "),
      sortKey: start.getTime(),
    });
  });

  list(data.activities).forEach((activity) => {
    const where = zoneName(activity.location_id);
    docs.push({
      id: `activity:${activity.id}`,
      type: "Activity",
      title: str(activity.name || activity.title, 150),
      text: [
        activity.typical_time && `When: ${str(activity.typical_time, 120)}`,
        where && `Where: ${where}${zoneClosedNote(activity.location_id)}`,
        activity.age_group && `Age group: ${str(activity.age_group, 60)}`,
        `Details: ${str(activity.description)}`,
      ].filter(Boolean).join("\n"),
      summary: `${str(activity.typical_time, 120) || "See schedule"}${where ? ` at ${where}` : ""}`,
      keywords: ["activity things to do", LABELS[activity.type] || "", where].join(" "),
    });
  });

  list(data.shops).forEach((shop) => {
    const where = zoneName(shop.location_id);
    const openNow = shop.open_now === true ? "open now" : shop.open_now === false ? "closed right now" : "";
    docs.push({
      id: `shop:${shop.id}`,
      type: "Shop",
      title: str(shop.name, 150),
      text: [
        `Type: ${LABELS[shop.shop_type] || str(shop.shop_type, 40)}`,
        shop.opening_hours && `Hours: ${str(shop.opening_hours, 80)}${openNow ? ` (${openNow})` : ""}`,
        where && `Where: ${where}${zoneClosedNote(shop.location_id)}`,
        `Details: ${str(shop.description)}`,
      ].filter(Boolean).join("\n"),
      summary: `${str(shop.opening_hours, 80)}${openNow ? ` (${openNow})` : ""}${where ? ` at ${where}` : ""}`,
      keywords: ["shop", EXTRA_KEYWORDS[shop.shop_type] || "", where].join(" "),
    });
  });

  zones.forEach((zone) => {
    const here = [
      ...list(data.activities).filter((a) => a.location_id === zone.id).map((a) => str(a.name, 80)),
      ...list(data.shops).filter((s) => s.location_id === zone.id).map((s) => str(s.name, 80)),
    ];
    const closureEnd = toDate(zone.closure_end_time);
    const status = zone.is_closed
      ? `CLOSED: ${str(zone.closure_reason, 200) || "temporarily unavailable"}${closureEnd ? ` (expected to reopen ${formatDay(closureEnd, tz)} at ${formatTime(closureEnd, tz)})` : ""}`
      : "Open";

    docs.push({
      id: `zone:${zone.id}`,
      type: "Zone",
      title: str(zone.zone_name, 120),
      text: [
        `Status: ${status}`,
        describePosition(zone, zones) && `Location: ${describePosition(zone, zones)}`,
        `Details: ${str(zone.description)}`,
        here.length && `Found here: ${here.join(", ")}`,
      ].filter(Boolean).join("\n"),
      summary: [
        zone.is_closed ? status : describePosition(zone, zones) || "Open",
        here.length && `Here: ${here.join(", ")}`,
      ].filter(Boolean).join(" "),
      keywords: ["zone area where location map directions", str(zone.zone_type, 40).replace(/_/g, " "), zone.is_closed ? "closed" : ""].join(" "),
      closed: !!zone.is_closed,
    });
  });

  list(data.announcements)
    .filter((ann) => isAnnouncementActive(ann, now))
    .forEach((ann) => {
      docs.push({
        id: `announcement:${ann.id}`,
        type: "Announcement",
        title: str(ann.title, 150),
        text: `${str(ann.message)}${ann.priority === "high" ? "\n(High priority)" : ""}`,
        summary: str(ann.message, 300),
        keywords: ["announcement news update", str(ann.type, 30)].join(" "),
        important: ann.priority === "high" || ann.type === "alert" || ann.type === "emergency",
      });
    });

  list(data.faqs).forEach((faq, i) => {
    docs.push({
      id: `faq:${faq.id || i}`,
      type: "FAQ",
      title: str(faq.question, 200),
      text: str(faq.answer, 2000),
      summary: str(faq.answer, 2000),
      keywords: [str(faq.category, 40), ...(Array.isArray(faq.keywords) ? faq.keywords : [])].join(" "),
    });
  });

  // Policies are long, so split them into one chunk per **Section** heading
  Object.entries(data.policies && typeof data.policies === "object" ? data.policies : {}).forEach(([key, policy]) => {
    const title = str(policy?.title || key, 120);
    const content = str(policy?.content ?? policy, 6000);
    const sections = content.split(/\n(?=\*\*[^*]+\*\*)/).map((s) => s.trim()).filter(Boolean);
    sections.forEach((section, i) => {
      const heading = section.match(/^\*\*([^*]+)\*\*/)?.[1];
      docs.push({
        id: `policy:${key}:${i}`,
        type: "Policy",
        title: heading ? `${title} – ${heading}` : title,
        text: section,
        summary: section,
        keywords: "rules policy guidelines",
      });
    });
  });

  const info = data.info;
  if (info && typeof info === "object") {
    const hours = info.openingHours || {};
    docs.push({
      id: "info:general",
      type: "Farm info",
      title: `About ${str(info.name, 80) || "the farm"}`,
      text: [
        str(info.description),
        hours.general && `Farm opening hours: ${hours.general} daily, last entry ${hours.lastEntry || "1 hour before closing"}`,
        Array.isArray(info.features) && `Facilities: ${info.features.join(", ")}`,
        info.contact && `Contact: ${[info.contact.phone, info.contact.email, info.contact.address].filter(Boolean).join(" | ")}`,
      ].filter(Boolean).join("\n"),
      summary: hours.general ? `Open ${hours.general} daily (last entry ${hours.lastEntry || "1 hour before closing"})` : str(info.description),
      keywords: "opening hours open close time contact phone email address facilities",
      pinned: true,
    });
  }

  return docs;
}

// ============ BM25 INDEX ============

const K1 = 1.2;
const B = 0.75;

export function createIndex(docs) {
  const termFreqs = docs.map((doc) => {
    // Titles are repeated so a match in the title outweighs a passing mention
    const tokens = tokenize(`${doc.title} ${doc.title} ${doc.text} ${doc.keywords || ""}`);
    const tf = new Map();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    return { tf, length: tokens.length };
  });

  const df = new Map();
  termFreqs.forEach(({ tf }) => tf.forEach((_, term) => df.set(term, (df.get(term) || 0) + 1)));
  const avgLength = termFreqs.reduce((sum, d) => sum + d.length, 0) / Math.max(docs.length, 1);

  return { docs, termFreqs, df, avgLength, size: docs.length };
}

function queryWeights(query, history) {
  const weights = new Map();
  const add = (term, weight) => weights.set(term, Math.max(weights.get(term) || 0, weight));

  tokenize(query).forEach((t) => {
    add(t, 1);
    SYNONYMS.get(t)?.forEach((s) => add(s, 0.35));
  });

  // Phrases whose words are all stopwords but still carry intent
  if (/\b(get|go|walk|way|route) to\b|\bhow (do|can) i (get|find)\b/i.test(query)) {
    ["where", "direction", "zone"].forEach((w) => add(stem(w), 1));
  }

  // Follow-up questions ("what time does it start?") borrow terms from the previous question,
  // strongly when the question points back at it ("it", "that", "they"...) or is very short
  const previous = [...history].reverse().find((m) => m?.role === "user" && typeof m.content === "string" && m.content !== query);
  if (previous) {
    const refersBack = /\b(it|its|that|this|they|them|those|there|he|she)\b/i.test(query) || tokenize(query).length <= 2;
    tokenize(previous.content).forEach((t) => add(t, refersBack ? 0.9 : 0.3));
  }

  return weights;
}

/**
 * Retrieve the documents most relevant to a question.
 * @returns {Array<{doc, score}>} best first
 */
export function search(index, query, { history = [], limit = 8, minRelativeScore = 0.3 } = {}) {
  const weights = queryWeights(query, history);
  if (weights.size === 0 || index.size === 0) return [];

  const scored = index.docs.map((doc, i) => {
    const { tf, length } = index.termFreqs[i];
    let score = 0;
    weights.forEach((weight, term) => {
      const freq = tf.get(term);
      if (!freq) return;
      const df = index.df.get(term);
      const idf = Math.log(1 + (index.size - df + 0.5) / (df + 0.5));
      score += weight * idf * ((freq * (K1 + 1)) / (freq + K1 * (1 - B + (B * length) / index.avgLength)));
    });
    return { doc, score };
  });

  const ranked = scored.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return [];
  const cutoff = ranked[0].score * minRelativeScore;
  return ranked.filter((r) => r.score >= cutoff).slice(0, limit);
}

// ============ CONTEXT FOR THE LLM ============

/**
 * Retrieve context for a question: the best-matching documents plus always-relevant
 * facts (farm hours, zone closures, high-priority announcements).
 */
export function retrieveContext(docs, query, { history = [], limit = 8 } = {}) {
  const index = createIndex(docs);
  const results = search(index, query, { history, limit });
  const retrievedIds = new Set(results.map((r) => r.doc.id));
  const pinned = docs.filter((d) => (d.pinned || d.closed || d.important) && !retrievedIds.has(d.id));
  return { results, pinned };
}

const REFERS_TO_LOCATION = /\b(here|near(by)?|near me|around( me| here)?|close( to me| by)?|this (zone|area|place|spot)|where am i|my (location|zone|area))\b/i;

/**
 * Questions like "what's near me?" or "what's on here?" carry no searchable words; when the
 * visitor's zone is known from GPS, search for that zone as well.
 */
export function locationAwareQuery(query, currentZoneName) {
  if (!currentZoneName || !REFERS_TO_LOCATION.test(query)) return query;
  // Replace the location words with the zone itself: "near" alone would match unrelated FAQs
  // ("free parking near the main entrance")
  const rest = query.replace(new RegExp(REFERS_TO_LOCATION.source, "gi"), " ");
  return `${rest} ${currentZoneName}`;
}

export function formatDocument(doc, n) {
  return `[${n}] ${doc.type}: ${doc.title}\n${doc.text}`;
}

export function formatContext({ results, pinned }) {
  const sections = [];
  if (results.length) {
    sections.push(`RELEVANT INFORMATION (most relevant first):\n\n${results.map((r, i) => formatDocument(r.doc, i + 1)).join("\n\n")}`);
  } else {
    sections.push("RELEVANT INFORMATION: nothing in the knowledge base matched this question.");
  }
  if (pinned.length) {
    sections.push(`ALWAYS-RELEVANT FACTS:\n\n${pinned.map((d, i) => formatDocument(d, results.length + i + 1)).join("\n\n")}`);
  }
  return sections.join("\n\n");
}

export function describeNow(now = new Date(), timeZone) {
  const tz = safeTimeZone(timeZone);
  return `${formatDay(now, tz)}, ${formatTime(now, tz)}`;
}

// ============ OFFLINE ANSWERS (no LLM available) ============

const GREETING = /^\s*(hi|hello|hey|good (morning|afternoon|evening)|salam|marhaba)\b[\s!.]*$/i;
const THANKS = /\b(thanks|thank you|cheers|appreciate)\b/i;

/**
 * Compose a readable answer straight from retrieved documents, for when the LLM is offline.
 */
export function composeAnswer(query, { results, pinned }) {
  if (GREETING.test(query)) {
    return "Hello! Welcome to Gracia Farm 🌱 Ask me about today's events, activities, food, shops, or how to find any zone.";
  }
  if (THANKS.test(query) && results.length === 0) {
    return "You're welcome! Enjoy your visit to Gracia 🌿";
  }
  const closedZones = [...results.map((r) => r.doc), ...pinned].filter((d) => d.closed);
  if (/\b(closed|closures?|shut)\b/i.test(query) && closedZones.length) {
    return `These areas are currently closed:\n\n${closedZones.map((z) => `- **${z.title}** — ${z.summary.replace(/^CLOSED: /, "")}`).join("\n")}`;
  }

  if (results.length === 0) {
    return "I couldn't find anything about that. Try asking about **events**, **activities**, **food & shops**, **opening hours** or **directions**, or ask any staff member at the Main Entrance.";
  }

  const [top] = results;
  const isStatic = (doc) => doc.type === "FAQ" || doc.type === "Policy";
  const strong = results.filter((r) => r.score >= top.score * 0.45);

  // A best-matching FAQ/policy answer leads; live items (events, shops, zones...) follow as bullets.
  // Otherwise list live items of the top result's kind, plus anything else that scored nearly as well.
  const lead = isStatic(top.doc) ? top.doc.summary : null;
  const items = strong
    .filter((r) => !isStatic(r.doc) && (lead || r.doc.type === top.doc.type || r.score >= top.score * 0.8))
    .slice(0, lead ? 3 : 5);
  const bullets = items.map(({ doc }) => `- **${doc.title}** — ${doc.summary}`).join("\n");

  const answer = lead
    ? `${lead}${bullets ? `\n\n**Related:**\n${bullets}` : ""}`
    : `Here's what I found:\n\n${bullets}`;

  // Warn about closed zones the answer is about (not ones only named as a "nearest" landmark),
  // unless a bullet already says so
  const aboutText = [lead, ...items.map(({ doc }) => (doc.type === "Zone" ? doc.title : `${doc.title} ${doc.summary}`))].join(" ");
  const notes = [...new Set(closedZones
    .filter((z) => aboutText.includes(z.title) && !answer.includes(`**${z.title}** — CLOSED`))
    .map((z) => `⚠️ **${z.title}** is currently closed — ${z.summary.replace(/^CLOSED: /, "")}`))];
  return notes.length ? `${answer}\n\n${notes.join("\n")}` : answer;
}
