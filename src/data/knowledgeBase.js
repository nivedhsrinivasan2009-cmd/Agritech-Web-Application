/**
 * Knowledge Base for Gracia AI Assistant
 * Contains FAQs, policies, and contextual information
 */

// Frequently Asked Questions
export const faqs = [
  // Opening Hours & General Info
  {
    id: "faq_1",
    category: "general",
    question: "What are Gracia's opening hours?",
    answer: "Gracia Farm is open daily from 8:00 AM to 6:00 PM. Last entry is at 5:00 PM. We're open every day including weekends and public holidays.",
    keywords: ["hours", "open", "time", "close", "when"],
  },
  {
    id: "faq_2",
    category: "general",
    question: "Where is Gracia located?",
    answer: "Gracia Farm is located in the countryside, easily accessible by car. Free parking is available near the main entrance, including electric vehicle charging stations.",
    keywords: ["location", "address", "where", "directions", "find"],
  },
  {
    id: "faq_3",
    category: "general",
    question: "Is there an entry fee?",
    answer: "General admission to Gracia is free! Some special events and workshops may have a separate fee. Check the Events page for details on specific activities.",
    keywords: ["fee", "cost", "price", "admission", "ticket", "free"],
  },
  {
    id: "faq_4",
    category: "general",
    question: "Is parking available?",
    answer: "Yes! Free parking is available for all visitors near the main entrance. We also have accessible parking spaces and electric vehicle charging stations.",
    keywords: ["parking", "car", "drive", "vehicle"],
  },

  // Family & Kids
  {
    id: "faq_5",
    category: "families",
    question: "Is Gracia suitable for children?",
    answer: "Absolutely! Gracia is very family-friendly. We have a dedicated Kids Play Zone with nature-inspired playground equipment, a petting zoo with gentle animals, and regular activities designed for children ages 3 and up.",
    keywords: ["kids", "children", "family", "child", "baby", "toddler"],
  },
  {
    id: "faq_6",
    category: "families",
    question: "Are strollers allowed?",
    answer: "Yes, strollers are welcome throughout Gracia. Most pathways are paved and accessible. We recommend off-road strollers for the nature trails.",
    keywords: ["stroller", "pram", "pushchair", "buggy"],
  },
  {
    id: "faq_7",
    category: "families",
    question: "Where can I change my baby's diaper?",
    answer: "Baby changing facilities are available in the restrooms near the Main Entrance and the Farm Shop & Café area.",
    keywords: ["diaper", "nappy", "change", "baby", "toilet"],
  },
  {
    id: "faq_8",
    category: "families",
    question: "Can I bring my own food?",
    answer: "Yes, you're welcome to bring your own food. We have several picnic areas throughout the farm where you can enjoy your meal. We also have a café and bakery if you prefer to dine in.",
    keywords: ["food", "picnic", "bring", "own", "lunch"],
  },

  // Food & Shopping
  {
    id: "faq_9",
    category: "food",
    question: "Where can I get coffee?",
    answer: "You can enjoy specialty coffee at the Gracia Farm Café (8 AM - 6 PM) or the Artisan Bakery (7 AM - 4 PM). Both are located in the Farm Shop & Café zone.",
    keywords: ["coffee", "cafe", "café", "drink", "beverage"],
  },
  {
    id: "faq_10",
    category: "food",
    question: "What food options are available?",
    answer: "We have several dining options:\n\n• **Gracia Farm Café** - Fresh farm-to-table meals, breakfast, lunch, and snacks\n• **Artisan Bakery** - Sourdough bread, pastries, and baked treats\n\nAll our food is made with fresh ingredients, much of it grown right here on the farm!",
    keywords: ["food", "eat", "restaurant", "meal", "lunch", "breakfast", "snack"],
  },
  {
    id: "faq_11",
    category: "food",
    question: "Are there vegetarian or vegan options?",
    answer: "Yes! Our café offers vegetarian and vegan options. Many of our dishes feature fresh vegetables and herbs from our own gardens. Just ask our staff for recommendations.",
    keywords: ["vegetarian", "vegan", "plant", "meat-free", "dietary"],
  },
  {
    id: "faq_12",
    category: "shopping",
    question: "What can I buy at the farm shop?",
    answer: "Our Farm Fresh Market sells seasonal produce, free-range eggs, local honey, homemade preserves, and artisanal products. The Nature's Gift Shop has souvenirs, toys, and handcrafted items.",
    keywords: ["buy", "shop", "purchase", "gift", "souvenir", "produce"],
  },

  // Activities & Events
  {
    id: "faq_13",
    category: "activities",
    question: "What activities are available?",
    answer: "We offer many activities including:\n\n• Guided Farm Walks (10 AM & 2 PM daily)\n• Animal Feeding (11 AM & 3 PM daily)\n• Kids Adventure Playground\n• Nature Trail Exploration\n• Workshops (seed planting, composting)\n\nCheck the Activities page for the full schedule!",
    keywords: ["activities", "do", "things", "experience", "tour"],
  },
  {
    id: "faq_14",
    category: "activities",
    question: "When is animal feeding time?",
    answer: "Animal feeding sessions are held daily at 11:00 AM and 3:00 PM at the Animal Yard. Meet our friendly goats, sheep, chickens, and rabbits!",
    keywords: ["feeding", "animal", "feed", "goat", "sheep", "rabbit"],
  },
  {
    id: "faq_15",
    category: "activities",
    question: "Do I need to book activities in advance?",
    answer: "Most activities are drop-in and don't require booking. However, some special workshops and events may require advance booking. Check the Events page for specific requirements.",
    keywords: ["book", "reserve", "advance", "registration"],
  },

  // Accessibility
  {
    id: "faq_16",
    category: "accessibility",
    question: "Is Gracia wheelchair accessible?",
    answer: "Yes, Gracia is wheelchair accessible. Main pathways are paved, and accessible restrooms are available. The Farm Shop & Café and most indoor areas are fully accessible.",
    keywords: ["wheelchair", "accessible", "disability", "mobility"],
  },
  {
    id: "faq_17",
    category: "accessibility",
    question: "Are dogs allowed?",
    answer: "Assistance dogs are welcome throughout Gracia. Pet dogs are allowed in outdoor areas only and must be kept on a leash at all times. Please clean up after your pet.",
    keywords: ["dog", "pet", "animal", "leash"],
  },

  // Safety & Emergencies
  {
    id: "faq_18",
    category: "safety",
    question: "What should I do in an emergency?",
    answer: "In case of emergency:\n\n• Alert any staff member immediately\n• First aid stations are located at the Main Entrance and Farm Shop\n• Emergency exits are marked throughout the venue\n• For serious emergencies, call emergency services\n\nStaff are trained in first aid and emergency procedures.",
    keywords: ["emergency", "help", "first aid", "accident", "safety"],
  },
  {
    id: "faq_19",
    category: "safety",
    question: "Is there a lost and found?",
    answer: "Yes, our lost and found is located at the Main Entrance. If you lose something, please visit the welcome desk or ask any staff member for assistance.",
    keywords: ["lost", "found", "missing", "item"],
  },

  // Schools & Groups
  {
    id: "faq_20",
    category: "schools",
    question: "Do you offer school programs?",
    answer: "Yes! We offer educational programs for schools including guided tours, hands-on workshops, and curriculum-aligned activities. Contact us to arrange a school visit.",
    keywords: ["school", "education", "field trip", "group", "class"],
  },
  {
    id: "faq_21",
    category: "entrepreneurs",
    question: "Can I host an event at Gracia?",
    answer: "Yes, our Training Centre and outdoor spaces are available for events, workshops, and corporate gatherings. Contact us to discuss your requirements and availability.",
    keywords: ["event", "corporate", "meeting", "venue", "hire", "rent"],
  },
];

// Policies
export const policies = {
  visitorGuidelines: {
    title: "Visitor Guidelines",
    content: `
Welcome to Gracia Farm! To ensure everyone has a safe and enjoyable visit, please follow these guidelines:

**Respect the Environment**
- Stay on designated paths
- Don't pick plants or flowers without permission
- Take all rubbish with you
- Respect wildlife and their habitats

**Animal Interaction**
- Only feed animals during designated feeding sessions
- Follow staff instructions when handling animals
- Wash hands after touching animals
- Don't chase or startle animals

**Safety**
- Supervise children at all times
- Wear appropriate footwear
- Stay hydrated, especially on hot days
- Report any hazards to staff

**General Rules**
- No smoking in any area
- Drones are not permitted
- Commercial photography requires permission
- Respect other visitors and staff
    `.trim(),
  },

  privacyPolicy: {
    title: "Privacy Policy",
    content: `
**Data Collection**
The Gracia Visitor App collects minimal data to enhance your visit:
- Browsing preferences (stored locally on your device)
- Booking information (if you create an account)
- AI chat conversations (temporary, not stored permanently)

**Data Usage**
Your data is used only to:
- Provide personalized recommendations
- Process event bookings
- Improve our services

**Your Rights**
- Your data is stored locally on your device
- You can clear app data at any time
- We don't share personal information with third parties
- Contact us to request data deletion
    `.trim(),
  },

  emergencyInfo: {
    title: "Emergency Information",
    content: `
**Emergency Contacts**
- Emergency Services: 999 / 112
- Gracia Staff: Contact any staff member
- First Aid: Main Entrance, Farm Shop

**First Aid Stations**
1. Main Entrance - Welcome Desk
2. Farm Shop & Café

**Emergency Exits**
- Main Entrance (primary exit)
- Service Gate (near Parking Area)
- Emergency exits marked in all buildings

**Meeting Point**
In case of evacuation, please proceed to the Main Parking Area.

**Weather Emergencies**
In case of severe weather, seek shelter in the Training Centre or Farm Shop buildings.
    `.trim(),
  },
};

// Gracia Information
export const graciaInfo = {
  name: "Gracia Farm",
  tagline: "Your Gateway to Sustainable Living",
  description: "Gracia is a sustainable farm and visitor centre dedicated to promoting organic farming, environmental education, and community wellness.",

  openingHours: {
    general: "8:00 AM - 6:00 PM",
    lastEntry: "5:00 PM",
    cafe: "8:00 AM - 6:00 PM",
    bakery: "7:00 AM - 4:00 PM",
    shops: "9:00 AM - 5:00 PM",
  },

  features: [
    "Organic Greenhouses",
    "Animal Yard & Petting Zoo",
    "Kids Play Zone",
    "Training Centre",
    "Farm Shop & Café",
    "Nature Trails",
  ],

  contact: {
    email: "info@gracia.farm",
    phone: "+1 (555) 123-4567",
    address: "Gracia Farm, Countryside Road",
  },
};

// Export all
export default {
  faqs,
  policies,
  graciaInfo,
};
