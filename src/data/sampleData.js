/**
 * Sample data for Gracia Visitor App
 * This data simulates what would come from a backend database
 */

// Helper to generate dates relative to today
const today = new Date();
const addDays = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date;
};
const addHours = (hours) => {
  const date = new Date(today);
  date.setHours(date.getHours() + hours);
  return date;
};
const setTime = (date, hours, minutes = 0) => {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

// Locations/Zones
export const locations = [
  {
    id: "loc_1",
    zone_name: "Greenhouses",
    zone_type: "greenhouse",
    description: "Explore our organic greenhouses where we grow seasonal vegetables, herbs, and flowers using sustainable farming practices.",
    map_x: 20,
    map_y: 25,
    color: "#22c55e",
    // Closure fields
    is_closed: false,
    closure_severity: null,
    closure_reason: null,
    closure_end_time: null,
  },
  {
    id: "loc_2",
    zone_name: "Animal Yard",
    zone_type: "animal_yard",
    description: "Meet our friendly farm animals including goats, sheep, chickens, and rabbits. Perfect for families with children!",
    map_x: 70,
    map_y: 30,
    color: "#f59e0b",
    // Closure fields - Demo: This zone is closed
    is_closed: true,
    closure_severity: "medium",
    closure_reason: "Veterinary checkup in progress",
    closure_end_time: setTime(addDays(1), 17, 0),
  },
  {
    id: "loc_3",
    zone_name: "Training Centre",
    zone_type: "training_centre",
    description: "Our modern training facility hosts workshops, seminars, and educational programs on sustainable farming and wellness.",
    map_x: 80,
    map_y: 60,
    color: "#3b82f6",
    // Closure fields
    is_closed: false,
    closure_severity: null,
    closure_reason: null,
    closure_end_time: null,
  },
  {
    id: "loc_4",
    zone_name: "Kids Play Zone",
    zone_type: "kids_zone",
    description: "A safe and fun play area designed for children of all ages, featuring nature-inspired play equipment and activities.",
    map_x: 35,
    map_y: 70,
    color: "#ec4899",
    // Closure fields
    is_closed: false,
    closure_severity: null,
    closure_reason: null,
    closure_end_time: null,
  },
  {
    id: "loc_5",
    zone_name: "Farm Shop & Café",
    zone_type: "shops",
    description: "Browse fresh produce, artisanal products, and enjoy farm-to-table meals at our café.",
    map_x: 55,
    map_y: 45,
    color: "#8b5cf6",
    // Closure fields
    is_closed: false,
    closure_severity: null,
    closure_reason: null,
    closure_end_time: null,
  },
  {
    id: "loc_6",
    zone_name: "Main Entrance",
    zone_type: "entrance",
    description: "Welcome to Gracia! Start your journey here and pick up a visitor map.",
    map_x: 50,
    map_y: 90,
    color: "#6b7280",
    // Closure fields
    is_closed: false,
    closure_severity: null,
    closure_reason: null,
    closure_end_time: null,
  },
  {
    id: "loc_7",
    zone_name: "Parking Area",
    zone_type: "parking",
    description: "Free parking available for all visitors. Electric vehicle charging stations available.",
    map_x: 15,
    map_y: 85,
    color: "#475569",
    // Closure fields
    is_closed: false,
    closure_severity: null,
    closure_reason: null,
    closure_end_time: null,
  },
];

// Events
export const events = [
  {
    id: "evt_1",
    title: "Morning Farm Walk",
    description: "Join our expert guides for a refreshing morning walk through the farm. Learn about our sustainable farming practices and meet our animals.",
    start_time: setTime(today, 10, 0),
    end_time: setTime(today, 11, 30),
    category: "families",
    location_id: "loc_1",
    image_url: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&q=80",
    is_featured: true,
  },
  {
    id: "evt_2",
    title: "Children's Nature Workshop",
    description: "A fun, interactive workshop where kids learn about nature, plant seeds, and create nature art. Suitable for ages 5-12.",
    start_time: setTime(today, 14, 0),
    end_time: setTime(today, 16, 0),
    category: "families",
    location_id: "loc_4",
    image_url: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80",
    is_featured: true,
  },
  {
    id: "evt_3",
    title: "Sustainable Agriculture Talk",
    description: "Learn about regenerative farming techniques and how we're building a more sustainable food system. Q&A session included.",
    start_time: setTime(addDays(1), 11, 0),
    end_time: setTime(addDays(1), 12, 30),
    category: "entrepreneurs",
    location_id: "loc_3",
    image_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80",
    is_featured: false,
  },
  {
    id: "evt_4",
    title: "School Field Trip Program",
    description: "Educational program designed for school groups. Students will explore the farm, learn about ecosystems, and participate in hands-on activities.",
    start_time: setTime(addDays(2), 9, 30),
    end_time: setTime(addDays(2), 14, 0),
    category: "schools",
    location_id: "loc_2",
    image_url: "https://images.unsplash.com/photo-1588075592446-265fd1e6e76f?w=800&q=80",
    is_featured: false,
  },
  {
    id: "evt_5",
    title: "Farm-to-Table Cooking Class",
    description: "Learn to cook delicious meals using fresh ingredients from our farm. Take home recipes and a bag of fresh produce!",
    start_time: setTime(addDays(3), 15, 0),
    end_time: setTime(addDays(3), 18, 0),
    category: "families",
    location_id: "loc_5",
    image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    is_featured: true,
  },
  {
    id: "evt_6",
    title: "Entrepreneur Networking Breakfast",
    description: "Connect with like-minded entrepreneurs over a healthy farm breakfast. Share ideas and build your network in a relaxed setting.",
    start_time: setTime(addDays(4), 8, 0),
    end_time: setTime(addDays(4), 10, 0),
    category: "entrepreneurs",
    location_id: "loc_3",
    image_url: "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&q=80",
    is_featured: false,
  },
  {
    id: "evt_7",
    title: "Weekend Family Fun Day",
    description: "A full day of activities for the whole family! Includes farm tours, animal feeding, games, and a picnic lunch.",
    start_time: setTime(addDays(5), 10, 0),
    end_time: setTime(addDays(5), 16, 0),
    category: "families",
    location_id: "loc_4",
    image_url: "https://images.unsplash.com/photo-1472653431158-6364773b2a56?w=800&q=80",
    is_featured: true,
  },
  {
    id: "evt_8",
    title: "Sunset Yoga on the Farm",
    description: "Unwind with a peaceful yoga session as the sun sets over the fields. All levels welcome. Mats provided.",
    start_time: setTime(addDays(6), 18, 0),
    end_time: setTime(addDays(6), 19, 30),
    category: "general",
    location_id: "loc_1",
    image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    is_featured: false,
  },
];

// Activities
export const activities = [
  {
    id: "act_1",
    name: "Guided Farm Walk",
    description: "Explore the entire farm with our knowledgeable guides. Learn about our crops, animals, and sustainable practices.",
    typical_time: "Daily at 10:00 AM & 2:00 PM",
    location_id: "loc_1",
    type: "farm_walk",
    image_url: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&q=80",
  },
  {
    id: "act_2",
    name: "Animal Feeding Experience",
    description: "Get up close with our friendly farm animals. Feed the goats, sheep, and rabbits while learning about their care.",
    typical_time: "Daily at 11:00 AM & 3:00 PM",
    location_id: "loc_2",
    type: "feeding",
    image_url: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&q=80",
  },
  {
    id: "act_3",
    name: "Kids Adventure Playground",
    description: "Let the kids burn off energy in our nature-inspired playground with climbing structures, swings, and sandpit.",
    typical_time: "Open all day",
    location_id: "loc_4",
    type: "kids_zone",
    image_url: "https://images.unsplash.com/photo-1566454419290-57a64afe1e87?w=800&q=80",
  },
  {
    id: "act_4",
    name: "Seed Planting Workshop",
    description: "Plant your own seeds to take home! Learn about plant lifecycles and sustainable gardening techniques.",
    typical_time: "Weekends at 11:00 AM",
    location_id: "loc_1",
    type: "workshop",
    image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
  },
  {
    id: "act_5",
    name: "Nature Trail Exploration",
    description: "Discover our beautiful nature trails. Spot birds, insects, and native plants along the way.",
    typical_time: "Self-guided, open all day",
    location_id: "loc_1",
    type: "exploration",
    image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
  },
  {
    id: "act_6",
    name: "Herb Garden Tour",
    description: "Explore our aromatic herb garden and learn about culinary and medicinal uses of various herbs.",
    typical_time: "Daily at 12:00 PM",
    location_id: "loc_1",
    type: "farm_walk",
    image_url: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80",
  },
  {
    id: "act_7",
    name: "Petting Zoo",
    description: "A gentle introduction to farm animals for younger children. Meet bunnies, chicks, and baby goats.",
    typical_time: "Open all day",
    location_id: "loc_2",
    type: "kids_zone",
    image_url: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&q=80",
  },
  {
    id: "act_8",
    name: "Composting Workshop",
    description: "Learn how to turn kitchen scraps into garden gold! Practical demonstration included.",
    typical_time: "Saturdays at 2:00 PM",
    location_id: "loc_3",
    type: "workshop",
    image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
  },
];

// Announcements
export const announcements = [
  {
    id: "ann_1",
    title: "Welcome to Gracia Farm!",
    message: "We're excited to have you here. Don't miss our Morning Farm Walk at 10 AM!",
    type: "info",
    priority: "normal",
    is_active: true,
    start_date: setTime(today, 0, 0),
    end_date: setTime(addDays(7), 23, 59),
  },
  {
    id: "ann_2",
    title: "New! Weekend Family Fun Days",
    message: "Join us every weekend for special family activities, games, and farm adventures.",
    type: "promotion",
    priority: "high",
    is_active: true,
    start_date: setTime(today, 0, 0),
    end_date: setTime(addDays(30), 23, 59),
  },
  {
    id: "ann_3",
    title: "Café Special: Farm Breakfast",
    message: "Try our new farm breakfast menu - fresh eggs, homemade bread, and organic produce!",
    type: "promotion",
    priority: "normal",
    is_active: true,
    start_date: setTime(today, 0, 0),
    end_date: setTime(addDays(14), 23, 59),
  },
];

// Shops
export const shops = [
  {
    id: "shop_1",
    name: "Gracia Farm Café",
    description: "Enjoy fresh, farm-to-table meals, homemade pastries, and specialty coffee in our cozy café.",
    opening_hours: "8:00 AM - 6:00 PM",
    location_id: "loc_5",
    shop_type: "cafe",
    image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
  },
  {
    id: "shop_2",
    name: "Farm Fresh Market",
    description: "Take home the freshest seasonal produce, eggs, honey, and preserves straight from our farm.",
    opening_hours: "9:00 AM - 5:00 PM",
    location_id: "loc_5",
    shop_type: "farm_shop",
    image_url: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80",
  },
  {
    id: "shop_3",
    name: "Nature's Gift Shop",
    description: "Find unique gifts, handcrafted items, toys, and souvenirs to remember your visit.",
    opening_hours: "10:00 AM - 5:00 PM",
    location_id: "loc_5",
    shop_type: "gift_shop",
    image_url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80",
  },
  {
    id: "shop_4",
    name: "Artisan Bakery",
    description: "Freshly baked sourdough bread, pastries, and treats made with farm-fresh ingredients.",
    opening_hours: "7:00 AM - 4:00 PM",
    location_id: "loc_5",
    shop_type: "cafe",
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  },
  {
    id: "shop_5",
    name: "Green Living Store",
    description: "Eco-friendly products, reusable items, and sustainable living essentials from local partners.",
    opening_hours: "10:00 AM - 4:00 PM",
    location_id: "loc_5",
    shop_type: "partner_outlet",
    image_url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80",
  },
];

// Staff Users (for Admin Dashboard)
export const staffUsers = [
  {
    id: "staff_1",
    email: "admin@gracia.farm",
    password: "admin123", // In production, this would be hashed
    name: "Admin User",
    role: "super_admin",
    permissions: ["all"],
    created_at: new Date().toISOString(),
  },
  {
    id: "staff_2",
    email: "events@gracia.farm",
    password: "events123",
    name: "Event Manager",
    role: "event_manager",
    permissions: ["events", "activities", "announcements"],
    created_at: new Date().toISOString(),
  },
  {
    id: "staff_3",
    email: "content@gracia.farm",
    password: "content123",
    name: "Content Editor",
    role: "content_editor",
    permissions: ["events", "activities", "shops", "announcements"],
    created_at: new Date().toISOString(),
  },
  {
    id: "staff_4",
    email: "support@gracia.farm",
    password: "support123",
    name: "Support Staff",
    role: "support",
    permissions: ["announcements", "view_only"],
    created_at: new Date().toISOString(),
  },
];

// Role permissions mapping
export const rolePermissions = {
  super_admin: {
    label: "Super Admin",
    description: "Full access to all features",
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageStaff: true,
    areas: ["events", "activities", "shops", "zones", "announcements", "staff", "settings"],
  },
  event_manager: {
    label: "Event Manager",
    description: "Manage events and activities",
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageStaff: false,
    areas: ["events", "activities", "announcements"],
  },
  content_editor: {
    label: "Content Editor",
    description: "Edit content across the app",
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageStaff: false,
    areas: ["events", "activities", "shops", "announcements"],
  },
  support: {
    label: "Support Staff",
    description: "Limited access for support tasks",
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageStaff: false,
    areas: ["announcements"],
  },
};

// Default export
export default {
  locations,
  events,
  activities,
  shops,
  announcements,
  staffUsers,
  rolePermissions,
};
