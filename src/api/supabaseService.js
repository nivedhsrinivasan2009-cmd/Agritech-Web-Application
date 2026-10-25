/**
 * Supabase Data Service for Gracia Visitor App
 * Drop-in replacement for localDataService.js
 */
import { supabase, isSupabaseConfigured, useSupabase } from '../lib/supabase';
import { rolePermissions } from '../data/sampleData';
import { faqs, policies, graciaInfo } from '../data/knowledgeBase';

// Re-export rolePermissions for components that import it from api
export { rolePermissions };

// Helper to simulate delay (for consistency with local service UX)
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// =============================================
// GENERIC ENTITY SERVICE FACTORY
// =============================================
function createEntityService(tableName) {
  return {
    async list(orderBy = '', limit = 100) {
      if (!supabase) throw new Error('Supabase not configured');

      let query = supabase.from(tableName).select('*');

      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const field = desc ? orderBy.slice(1) : orderBy;
        query = query.order(field, { ascending: !desc });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error('Item not found');
      return data;
    },

    async create(itemData) {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase
        .from(tableName)
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id) {
      if (!supabase) throw new Error('Supabase not configured');

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },

    // Real-time subscription
    subscribe(callback) {
      if (!supabase) return () => {};

      const channel = supabase
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload) => callback(payload)
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    },
  };
}

// =============================================
// VISITOR AUTH SERVICE
// =============================================
const authService = {
  async login(email, password) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    // Fetch visitor profile
    const { data: profile } = await supabase
      .from('visitor_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return { ...data.user, ...profile };
  },

  async register(userData) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: { name: userData.name },
      },
    });

    if (error) throw new Error(error.message);

    // Create visitor profile
    if (data.user) {
      await supabase.from('visitor_profiles').insert({
        id: data.user.id,
        email: userData.email,
        name: userData.name,
      });
    }

    return data.user;
  },

  async logout() {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },

  async getCurrentUser() {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('visitor_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { ...user, ...profile };
  },

  async updateProfile(data) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile, error } = await supabase
      .from('visitor_profiles')
      .update(data)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return profile;
  },

  // Auth state listener for real-time auth changes
  onAuthStateChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};

// =============================================
// ADMIN AUTH SERVICE
// =============================================
const adminAuthService = {
  async login(email, password) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    // Check if user is staff
    const { data: staff, error: staffError } = await supabase
      .from('staff_users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (staffError || !staff) {
      await supabase.auth.signOut();
      throw new Error('Staff account not found');
    }

    if (!staff.is_active) {
      await supabase.auth.signOut();
      throw new Error('Account is deactivated');
    }

    return {
      ...staff,
      rolePermissions: rolePermissions[staff.role] || rolePermissions.support,
    };
  },

  async logout() {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },

  async getCurrentStaff() {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: staff } = await supabase
      .from('staff_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!staff) return null;

    return {
      ...staff,
      rolePermissions: rolePermissions[staff.role] || rolePermissions.support,
    };
  },

  async checkPermission(area) {
    const staff = await this.getCurrentStaff();
    if (!staff) return false;

    const perms = staff.rolePermissions;
    if (!perms) return false;

    return perms.areas.includes(area) || perms.areas.includes('all');
  },

  async canCreate() {
    const staff = await this.getCurrentStaff();
    return staff?.rolePermissions?.canCreate || false;
  },

  async canEdit() {
    const staff = await this.getCurrentStaff();
    return staff?.rolePermissions?.canEdit || false;
  },

  async canDelete() {
    const staff = await this.getCurrentStaff();
    return staff?.rolePermissions?.canDelete || false;
  },

  async listStaff() {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('staff_users')
      .select('id, email, name, role, is_active, created_at');

    if (error) throw error;
    return data || [];
  },

  async createStaff(staffData) {
    if (!supabase) throw new Error('Supabase not configured');

    const currentStaff = await this.getCurrentStaff();
    if (!currentStaff?.rolePermissions?.canManageStaff) {
      throw new Error('No permission to manage staff');
    }

    // Create staff record (auth user should be created separately via Supabase dashboard or invite)
    const { data: staff, error } = await supabase
      .from('staff_users')
      .insert({
        email: staffData.email,
        name: staffData.name,
        role: staffData.role,
      })
      .select()
      .single();

    if (error) throw error;
    return staff;
  },

  async updateStaff(staffId, updates) {
    if (!supabase) throw new Error('Supabase not configured');

    const currentStaff = await this.getCurrentStaff();
    if (!currentStaff?.rolePermissions?.canManageStaff) {
      throw new Error('No permission to manage staff');
    }

    const { data, error } = await supabase
      .from('staff_users')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStaff(staffId) {
    if (!supabase) throw new Error('Supabase not configured');

    const currentStaff = await this.getCurrentStaff();
    if (!currentStaff?.rolePermissions?.canManageStaff) {
      throw new Error('No permission to manage staff');
    }

    if (currentStaff.id === staffId) {
      throw new Error("Cannot delete your own account");
    }

    // Deactivate instead of delete for audit trail
    const { error } = await supabase
      .from('staff_users')
      .update({ is_active: false })
      .eq('id', staffId);

    if (error) throw error;
    return { success: true };
  },
};

// =============================================
// BOOKINGS SERVICE
// =============================================
const bookingsService = {
  async create(eventId, bookingData) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Please login to book events');

    // Check if already booked
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      throw new Error('You have already booked this event');
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        event_id: eventId,
        user_id: user.id,
        ...bookingData,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async list() {
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        events (title, start_time, location_id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to match existing format
    return (data || []).map(b => ({
      ...b,
      event_title: b.events?.title,
      event_date: b.events?.start_time,
    }));
  },

  async cancel(bookingId) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// =============================================
// AGENTS SERVICE (AI Chat)
// =============================================
const agentsService = {
  conversations: new Map(),
  subscribers: new Map(),

  // Helper to get live data from Supabase
  async getLiveData() {
    if (!supabase) {
      return { events: [], activities: [], shops: [], locations: [], announcements: [] };
    }

    const [eventsRes, activitiesRes, shopsRes, locationsRes, announcementsRes] = await Promise.all([
      supabase.from('events').select('*'),
      supabase.from('activities').select('*'),
      supabase.from('shops').select('*'),
      supabase.from('locations').select('*'),
      supabase.from('announcements').select('*').eq('is_active', true),
    ]);

    return {
      events: eventsRes.data || [],
      activities: activitiesRes.data || [],
      shops: shopsRes.data || [],
      locations: locationsRes.data || [],
      announcements: announcementsRes.data || [],
    };
  },

  // Helper to format date nicely
  formatEventTime(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${timeStr}`;
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
    }
  },

  // Get today's events
  async getTodaysEvents() {
    const { events } = await this.getLiveData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events.filter(e => {
      const eventDate = new Date(e.start_time);
      return eventDate >= today && eventDate < tomorrow;
    }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  },

  // Get upcoming events (next 7 days)
  async getUpcomingEvents(limit = 5) {
    const { events } = await this.getLiveData();
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return events.filter(e => {
      const eventDate = new Date(e.start_time);
      return eventDate >= now && eventDate <= weekFromNow;
    }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).slice(0, limit);
  },

  // Get open shops
  async getOpenShops() {
    const { shops } = await this.getLiveData();
    const now = new Date();
    const currentHour = now.getHours();

    return shops.filter(shop => {
      // Simple check - assume shops are open if current time is between 8-18
      return currentHour >= 8 && currentHour < 18;
    });
  },

  // Get activities by category
  async getActivitiesByCategory(category) {
    const { activities } = await this.getLiveData();
    if (!category) return activities;
    return activities.filter(a =>
      a.category?.toLowerCase().includes(category.toLowerCase()) ||
      a.tags?.some(t => t.toLowerCase().includes(category.toLowerCase()))
    );
  },

  // Get zone/location by name
  async findZone(searchTerm) {
    const { locations } = await this.getLiveData();
    const term = searchTerm.toLowerCase();
    return locations.find(loc =>
      loc.zone_name?.toLowerCase().includes(term) ||
      loc.zone_type?.toLowerCase().replace(/_/g, ' ').includes(term)
    );
  },

  // Get active announcements
  async getActiveAnnouncements() {
    const { announcements } = await this.getLiveData();
    const now = new Date();
    return announcements.filter(a => {
      if (!a.is_active) return false;
      if (a.expires_at && new Date(a.expires_at) < now) return false;
      return true;
    });
  },

  async createConversation({ agent_name, metadata = {} }) {
    await delay(100);

    // Create in Supabase if available
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user?.id || null,
          page_context: metadata.pageContext || null,
        })
        .select()
        .single();

      if (!error && data) {
        const conversation = { ...data, messages: [], agent_name, metadata };
        this.conversations.set(data.id, conversation);
        return conversation;
      }
    }

    // Fallback to in-memory
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversation = {
      id: conversationId,
      agent_name,
      metadata,
      messages: [],
      created_at: new Date().toISOString(),
      pageContext: metadata.pageContext || null,
    };

    this.conversations.set(conversationId, conversation);
    return conversation;
  },

  updateContext(conversationId, pageContext) {
    const conv = this.conversations.get(conversationId);
    if (conv) {
      conv.pageContext = pageContext;
    }
    // Also update in Supabase if available
    if (supabase) {
      supabase.from('conversations').update({ page_context: pageContext }).eq('id', conversationId);
    }
  },

  async addMessage(conversation, { role, content, pageContext }) {
    await delay(100);

    const conv = this.conversations.get(conversation.id);
    if (!conv) throw new Error('Conversation not found');

    // Update page context if provided
    if (pageContext) {
      conv.pageContext = pageContext;
    }

    // Add user message
    const userMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(userMessage);

    // Save to Supabase if available
    if (supabase) {
      await supabase.from('conversation_messages').insert({
        conversation_id: conversation.id,
        role,
        content,
      });
    }

    // Notify subscribers
    this.notifySubscribers(conversation.id);

    // If user message, generate AI response
    if (role === 'user') {
      setTimeout(async () => {
        const response = await this.generateResponse(content, conv.pageContext);
        const assistantMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        };
        conv.messages.push(assistantMessage);

        // Save assistant response to Supabase
        if (supabase) {
          await supabase.from('conversation_messages').insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: response,
          });
        }

        this.notifySubscribers(conversation.id);
      }, 1000);
    }

    return conv;
  },

  async generateResponse(userMessage, pageContext = null) {
    const lowerMsg = userMessage.toLowerCase();

    // Track AI question for analytics
    if (supabase) {
      try {
        await supabase.from('ai_question_logs').insert({ question: userMessage });
      } catch (e) {
        console.error('Failed to track AI question', e);
      }
    }

    // First, try to find a matching FAQ from knowledge base
    const matchingFaq = this.findMatchingFaq(lowerMsg);
    if (matchingFaq) {
      return matchingFaq.answer;
    }

    // Check for policy-related questions
    if (lowerMsg.includes('rule') || lowerMsg.includes('guideline') || lowerMsg.includes('policy')) {
      return policies.visitorGuidelines.content;
    }

    if (lowerMsg.includes('emergency') || lowerMsg.includes('first aid') || lowerMsg.includes('accident')) {
      return policies.emergencyInfo.content;
    }

    if (lowerMsg.includes('privacy') || lowerMsg.includes('data')) {
      return policies.privacyPolicy.content;
    }

    // ============ LIVE DATA RESPONSES ============

    // TODAY'S EVENTS
    if (lowerMsg.includes('today') && (lowerMsg.includes('event') || lowerMsg.includes('happening') || lowerMsg.includes('on'))) {
      const todaysEvents = await this.getTodaysEvents();
      if (todaysEvents.length === 0) {
        return "There are no scheduled events for today, but there's still plenty to do! Check out our daily activities like guided farm walks, animal feeding sessions, and exploring the greenhouses.";
      }

      let response = `**Today's Events** (${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}):\n\n`;
      todaysEvents.forEach(event => {
        const time = new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        response += `- **${event.title}** - ${time}\n`;
      });
      response += '\nWould you like more details about any of these events?';
      return response;
    }

    // UPCOMING EVENTS
    if (lowerMsg.includes('event') || lowerMsg.includes('happening') || lowerMsg.includes('upcoming') || lowerMsg.includes('schedule')) {
      const upcomingEvents = await this.getUpcomingEvents(5);
      if (upcomingEvents.length === 0) {
        return "We don't have any events scheduled for the next few days, but stay tuned! In the meantime, enjoy our daily activities and explore the farm.";
      }

      let response = '**Upcoming Events:**\n\n';
      upcomingEvents.forEach(event => {
        response += `- **${event.title}** - ${this.formatEventTime(event.start_time)}\n`;
      });
      response += '\nCheck the Events page for full details and booking!';
      return response;
    }

    // ACTIVITIES
    if (lowerMsg.includes('activity') || lowerMsg.includes('activities') || lowerMsg.includes('do')) {
      const { activities } = await this.getLiveData();
      let filteredActivities = activities;
      let categoryLabel = '';

      if (lowerMsg.includes('kid') || lowerMsg.includes('child') || lowerMsg.includes('family')) {
        filteredActivities = activities.filter(a =>
          a.tags?.some(t => ['family', 'kids', 'children'].includes(t.toLowerCase())) ||
          a.age_group?.toLowerCase().includes('kid') ||
          a.age_group?.toLowerCase().includes('all')
        );
        categoryLabel = ' for families';
      }

      if (filteredActivities.length === 0) {
        return "I couldn't find specific activities matching that. Here's what we generally offer:\n\n- Guided Farm Walks\n- Animal Feeding Sessions\n- Nature Workshops\n- Kids Play Zone\n\nVisit the Activities page for more!";
      }

      let response = `**Available Activities${categoryLabel}:**\n\n`;
      filteredActivities.slice(0, 5).forEach(activity => {
        response += `- **${activity.name}**`;
        if (activity.typical_time) response += ` (${activity.typical_time})`;
        response += '\n';
      });
      return response;
    }

    // SHOPS
    if (lowerMsg.includes('shop') || lowerMsg.includes('buy') || lowerMsg.includes('gift') || lowerMsg.includes('store')) {
      const { shops } = await this.getLiveData();

      if (shops.length === 0) {
        return 'Our shops include the Farm Fresh Market, Nature\'s Gift Shop, and more. Visit the Shops page for details!';
      }

      let response = '**Our Shops:**\n\n';
      shops.forEach(shop => {
        response += `- **${shop.name}**`;
        if (shop.opening_hours) response += ` (${shop.opening_hours})`;
        response += '\n';
      });
      return response;
    }

    // FOOD & CAFE
    if (lowerMsg.includes('food') || lowerMsg.includes('eat') || lowerMsg.includes('coffee') || lowerMsg.includes('cafe') || lowerMsg.includes('hungry')) {
      const { shops } = await this.getLiveData();
      const foodShops = shops.filter(s =>
        s.shop_type?.toLowerCase().includes('cafe') ||
        s.name?.toLowerCase().includes('cafe') ||
        s.name?.toLowerCase().includes('bakery')
      );

      if (foodShops.length === 0) {
        return `Hungry? We've got you covered!\n\n- **Gracia Farm Cafe** - Fresh farm-to-table meals (${graciaInfo.openingHours.cafe})\n- **Artisan Bakery** - Sourdough bread & pastries (${graciaInfo.openingHours.bakery})\n\nBoth are located in the Farm Shop & Cafe zone!`;
      }

      let response = '**Food & Drinks:**\n\n';
      foodShops.forEach(shop => {
        response += `- **${shop.name}**`;
        if (shop.opening_hours) response += ` (${shop.opening_hours})`;
        response += '\n';
      });
      return response;
    }

    // ZONES & DIRECTIONS
    if (lowerMsg.includes('map') || lowerMsg.includes('direction') || lowerMsg.includes('where') || lowerMsg.includes('zone')) {
      const { locations } = await this.getLiveData();

      let response = '**Gracia Farm Zones:**\n\n';
      locations.forEach(loc => {
        const emoji = {
          greenhouse: '~',
          animal_yard: '~',
          training_centre: '~',
          kids_zone: '~',
          shops: '~',
          entrance: '~',
          parking: '~'
        }[loc.zone_type] || '~';

        response += `- **${loc.zone_name}**`;
        if (loc.is_closed) response += ' *(Closed)*';
        response += '\n';
      });
      response += '\nTap any zone on the **Map** page for details and navigation!';
      return response;
    }

    // HOURS
    if (lowerMsg.includes('hour') || lowerMsg.includes('open') || lowerMsg.includes('time') || lowerMsg.includes('close')) {
      return `**Opening Hours:**\n- Farm: ${graciaInfo.openingHours.general}\n- Cafe: ${graciaInfo.openingHours.cafe}\n- Shops: ${graciaInfo.openingHours.shops}\n- Last entry: ${graciaInfo.openingHours.lastEntry}\n\nWe're open every day including weekends and holidays!`;
    }

    // GREETINGS
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      const todaysEvents = await this.getTodaysEvents();
      let response = `Hello! Welcome to ${graciaInfo.name}!\n\n`;

      if (todaysEvents.length > 0) {
        response += `**Happening today:** ${todaysEvents[0].title} at ${new Date(todaysEvents[0].start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}\n\n`;
      }

      response += 'How can I help you today? Ask me about:\n- Events & activities\n- Food & shopping\n- Directions & zones';
      return response;
    }

    if (lowerMsg.includes('thank')) {
      return "You're welcome! Enjoy your visit to Gracia. If you have any more questions, I'm always here to help!";
    }

    // DEFAULT
    let defaultResponse = "I'd be happy to help! Here's what I can tell you about:\n\n";
    defaultResponse += '- **Events** - What\'s happening today & upcoming\n';
    defaultResponse += '- **Activities** - Farm experiences & workshops\n';
    defaultResponse += '- **Food & Shops** - Where to eat and shop\n';
    defaultResponse += '- **Directions** - Navigate the farm zones\n';
    defaultResponse += '- **Hours** - Opening times\n';
    defaultResponse += '- **Rules** - Visitor guidelines\n';

    return defaultResponse;
  },

  // Find matching FAQ from knowledge base
  findMatchingFaq(query) {
    const words = query.toLowerCase().split(/\s+/);
    let bestMatch = null;
    let bestScore = 0;

    for (const faq of faqs) {
      let score = 0;

      // Check keywords
      for (const keyword of faq.keywords) {
        if (words.some(word => word.includes(keyword) || keyword.includes(word))) {
          score += 2;
        }
      }

      // Check question similarity
      const questionWords = faq.question.toLowerCase().split(/\s+/);
      for (const qWord of questionWords) {
        if (words.includes(qWord) && qWord.length > 3) {
          score += 1;
        }
      }

      if (score > bestScore && score >= 2) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    return bestMatch;
  },

  subscribeToConversation(conversationId, callback) {
    if (!this.subscribers.has(conversationId)) {
      this.subscribers.set(conversationId, new Set());
    }
    this.subscribers.get(conversationId).add(callback);

    // Immediately call with current data
    const conv = this.conversations.get(conversationId);
    if (conv) {
      callback({ messages: conv.messages });
    }

    // Subscribe to Supabase realtime if available
    if (supabase) {
      const channel = supabase
        .channel(`conv_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversation_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async () => {
            const { data } = await supabase
              .from('conversation_messages')
              .select('*')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: true });

            callback({ messages: data || [] });
          }
        )
        .subscribe();

      return () => {
        const subs = this.subscribers.get(conversationId);
        if (subs) subs.delete(callback);
        supabase.removeChannel(channel);
      };
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(conversationId);
      if (subs) {
        subs.delete(callback);
      }
    };
  },

  notifySubscribers(conversationId) {
    const subs = this.subscribers.get(conversationId);
    const conv = this.conversations.get(conversationId);
    if (subs && conv) {
      subs.forEach((callback) => {
        callback({ messages: conv.messages });
      });
    }
  },
};

// =============================================
// ANALYTICS SERVICE
// =============================================
const analyticsService = {
  async trackPageView(page) {
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('page_views').insert({
      page,
      user_id: user?.id || null,
    });
  },

  async trackSearch(query) {
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('search_logs').insert({
      query,
      user_id: user?.id || null,
    });
  },

  async trackAIQuestion(question) {
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('ai_question_logs').insert({
      question,
      user_id: user?.id || null,
    });
  },

  async getAnalytics() {
    if (!supabase) {
      return {
        totalEvents: 0,
        totalActivities: 0,
        totalShops: 0,
        totalBookings: 0,
        recentBookings: [],
        topSearches: [],
        topAIQuestions: [],
        pageViews: {},
      };
    }

    const [
      { count: eventsCount },
      { count: activitiesCount },
      { count: shopsCount },
      { data: bookings },
      { data: searches },
      { data: aiQuestions },
    ] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('activities').select('*', { count: 'exact', head: true }),
      supabase.from('shops').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('search_logs').select('query').order('created_at', { ascending: false }).limit(100),
      supabase.from('ai_question_logs').select('question').order('created_at', { ascending: false }).limit(100),
    ]);

    return {
      totalEvents: eventsCount || 0,
      totalActivities: activitiesCount || 0,
      totalShops: shopsCount || 0,
      totalBookings: bookings?.length || 0,
      recentBookings: bookings || [],
      topSearches: this.aggregateTopItems(searches || [], 'query'),
      topAIQuestions: this.aggregateTopItems(aiQuestions || [], 'question'),
      pageViews: {},
    };
  },

  aggregateTopItems(items, field) {
    const counts = {};
    items.forEach(item => {
      const key = item[field]?.toLowerCase().slice(0, 50);
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([text, count]) => ({ [field]: text, count }));
  },
};

// =============================================
// STORAGE SERVICE (File Uploads)
// =============================================
const storageService = {
  async uploadImage(bucket, file, folder = '') {
    if (!supabase) throw new Error('Supabase not configured');

    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async deleteImage(bucket, path) {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return { success: true };
  },

  getPublicUrl(bucket, path) {
    if (!supabase) return null;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  },
};

// =============================================
// EXPORT API
// =============================================
export const api = {
  entities: {
    Event: createEntityService('events'),
    Activity: createEntityService('activities'),
    Shop: createEntityService('shops'),
    Location: createEntityService('locations'),
    Announcement: createEntityService('announcements'),
  },
  auth: authService,
  adminAuth: adminAuthService,
  bookings: bookingsService,
  agents: agentsService,
  analytics: analyticsService,
  storage: storageService,
  rolePermissions,
  supabase, // Expose for direct access if needed
  isConfigured: isSupabaseConfigured,
};

export default api;
