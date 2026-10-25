// RAG retrieval tests
import { buildDocuments, createIndex, search, retrieveContext, composeAnswer, formatContext, locationAwareQuery, stem, tokenize } from '../rag';

// Wednesday 21 October 2026, 9:00 AM UTC
const NOW = new Date('2026-10-21T09:00:00Z');
const OPTIONS = { now: NOW, timeZone: 'UTC' };

const data = {
  locations: [
    { id: 'loc_1', zone_name: 'Greenhouses', zone_type: 'greenhouse', description: 'Organic vegetables and herbs.', map_x: 20, map_y: 25, is_closed: false },
    { id: 'loc_2', zone_name: 'Animal Yard', zone_type: 'animal_yard', description: 'Goats, sheep and rabbits.', map_x: 70, map_y: 30, is_closed: true, closure_reason: 'Veterinary checkup', closure_end_time: '2026-10-22T17:00:00Z' },
    { id: 'loc_5', zone_name: 'Farm Shop & Café', zone_type: 'shops', description: 'Fresh produce and meals.', map_x: 55, map_y: 45, is_closed: false },
  ],
  events: [
    { id: 'evt_today', title: 'Morning Farm Walk', description: 'Guided walk.', start_time: '2026-10-21T10:00:00Z', end_time: '2026-10-21T11:30:00Z', category: 'families', location_id: 'loc_1' },
    { id: 'evt_sat', title: 'Cooking Class', description: 'Cook with farm produce.', start_time: '2026-10-24T15:00:00Z', end_time: '2026-10-24T18:00:00Z', category: 'families', location_id: 'loc_5' },
    { id: 'evt_old', title: 'Last Month Harvest', description: 'Old event.', start_time: '2026-09-01T10:00:00Z', end_time: '2026-09-01T12:00:00Z', category: 'general', location_id: 'loc_1' },
  ],
  activities: [
    { id: 'act_2', name: 'Animal Feeding Experience', description: 'Feed the goats and sheep.', typical_time: 'Daily at 11:00 AM & 3:00 PM', location_id: 'loc_2', type: 'feeding' },
  ],
  shops: [
    { id: 'shop_1', name: 'Gracia Farm Café', description: 'Farm-to-table meals and specialty coffee.', opening_hours: '8:00 AM - 6:00 PM', location_id: 'loc_5', shop_type: 'cafe', open_now: true },
  ],
  announcements: [
    { id: 'ann_on', title: 'Weekend Family Fun Days', message: 'Games every weekend.', type: 'promotion', priority: 'normal', is_active: true, start_date: '2026-10-01T00:00:00Z', end_date: null },
    { id: 'ann_off', title: 'Expired Notice', message: 'Gone.', is_active: true, start_date: '2026-09-01T00:00:00Z', end_date: '2026-09-02T00:00:00Z' },
  ],
  faqs: [
    { id: 'faq_dogs', category: 'accessibility', question: 'Are dogs allowed?', answer: 'Pet dogs are allowed outdoors on a leash.', keywords: ['dog', 'pet'] },
  ],
  policies: {
    emergencyInfo: { title: 'Emergency Information', content: '**Emergency Contacts**\n- Call 999\n\n**Meeting Point**\nMain Parking Area' },
  },
  info: { name: 'Gracia Farm', description: 'A sustainable farm.', openingHours: { general: '8:00 AM - 6:00 PM', lastEntry: '5:00 PM' } },
};

const docs = buildDocuments(data, OPTIONS);
const ids = (results) => results.map((r) => r.doc.id);

describe('text processing', () => {
  it('stems related word forms to the same token', () => {
    expect(stem('feeding')).toBe(stem('feed'));
    expect(stem('events')).toBe(stem('event'));
    expect(stem('closed')).toBe(stem('close'));
    expect(stem('activities')).toBe(stem('activity'));
    expect(stem('shopping')).toBe(stem('shop'));
  });

  it('drops stopwords and accents', () => {
    expect(tokenize('Where is the Café?')).toEqual([stem('where'), stem('cafe')]);
  });
});

describe('buildDocuments', () => {
  it('skips events that ended before today', () => {
    expect(docs.some((d) => d.id === 'event:evt_old')).toBe(false);
    expect(docs.some((d) => d.id === 'event:evt_today')).toBe(true);
  });

  it('describes event timing relative to the visitor\'s today', () => {
    const today = docs.find((d) => d.id === 'event:evt_today');
    expect(today.text).toContain('Today (Wednesday, October 21)');
    expect(today.text).toContain('upcoming');

    const saturday = docs.find((d) => d.id === 'event:evt_sat');
    expect(saturday.keywords).toContain('this weekend');
  });

  it('includes only active announcements, treating a missing end date as open-ended', () => {
    expect(docs.some((d) => d.id === 'announcement:ann_on')).toBe(true);
    expect(docs.some((d) => d.id === 'announcement:ann_off')).toBe(false);
  });

  it('flags closed zones and mentions the closure on things inside them', () => {
    const yard = docs.find((d) => d.id === 'zone:loc_2');
    expect(yard.closed).toBe(true);
    expect(yard.text).toContain('CLOSED: Veterinary checkup');

    const feeding = docs.find((d) => d.id === 'activity:act_2');
    expect(feeding.text).toContain('currently CLOSED');
  });

  it('splits policies into one document per section', () => {
    expect(docs.filter((d) => d.type === 'Policy').map((d) => d.title)).toEqual([
      'Emergency Information – Emergency Contacts',
      'Emergency Information – Meeting Point',
    ]);
  });

  it('ignores malformed input instead of throwing', () => {
    expect(() => buildDocuments({ events: 'nope', shops: [null, 42], policies: null }, OPTIONS)).not.toThrow();
  });
});

describe('search', () => {
  const index = createIndex(docs);

  it('finds today\'s events for "what\'s happening today"', () => {
    expect(ids(search(index, "What's happening today?"))[0]).toBe('event:evt_today');
  });

  it('finds weekend events', () => {
    expect(ids(search(index, 'anything on this weekend?'))).toContain('event:evt_sat');
  });

  it('matches synonyms (coffee -> café)', () => {
    expect(ids(search(index, 'where can I get coffee'))).toContain('shop:shop_1');
  });

  it('ranks the zone first for directions questions', () => {
    expect(ids(search(index, 'How do I get to the animal yard?'))[0]).toBe('zone:loc_2');
  });

  it('uses the previous question for follow-ups', () => {
    const history = [{ role: 'user', content: 'Tell me about the cooking class' }];
    expect(ids(search(index, 'what time does it start?', { history }))[0]).toBe('event:evt_sat');
  });

  it('returns nothing for unrelated questions', () => {
    expect(search(index, 'quantum chromodynamics')).toEqual([]);
  });
});

describe('locationAwareQuery', () => {
  it('adds the GPS zone to "near me" style questions', () => {
    const query = locationAwareQuery("what's near me?", 'Farm Shop & Café');
    expect(query).toContain('Farm Shop & Café');
    expect(ids(search(createIndex(docs), query))).toContain('shop:shop_1');
  });

  it('leaves other questions, or an unknown zone, unchanged', () => {
    expect(locationAwareQuery('are dogs allowed?', 'Greenhouses')).toBe('are dogs allowed?');
    expect(locationAwareQuery("what's near me?", undefined)).toBe("what's near me?");
  });
});

describe('retrieveContext and formatContext', () => {
  it('always includes farm info and closed zones', () => {
    const context = retrieveContext(docs, 'are dogs allowed');
    const pinnedIds = context.pinned.map((d) => d.id);
    expect(pinnedIds).toContain('info:general');
    expect(pinnedIds).toContain('zone:loc_2');

    const text = formatContext(context);
    expect(text).toContain('[1] FAQ: Are dogs allowed?');
    expect(text).toContain('ALWAYS-RELEVANT FACTS');
  });
});

describe('composeAnswer (offline mode)', () => {
  const answer = (q, history) => composeAnswer(q, retrieveContext(docs, q, { history }));

  it('answers FAQs directly', () => {
    expect(answer('can I bring my dog?')).toBe('Pet dogs are allowed outdoors on a leash.');
  });

  it('lists matching live items', () => {
    const text = answer("What's happening today?");
    expect(text).toContain('**Morning Farm Walk**');
    expect(text).toContain('Today (Wednesday, October 21)');
  });

  it('warns about closed zones the answer refers to', () => {
    expect(answer('when is animal feeding')).toContain('Animal Yard** is currently closed');
  });

  it('lists closures when asked', () => {
    expect(answer("what's closed?")).toContain('These areas are currently closed');
  });

  it('greets and handles no-match questions', () => {
    expect(answer('hi')).toMatch(/^Hello!/);
    expect(answer('quantum chromodynamics')).toMatch(/couldn't find anything/);
  });
});
