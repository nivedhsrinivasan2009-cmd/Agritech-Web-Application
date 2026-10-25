// Multi-language support (i18n) for Gracia Visitor App

const translations = {
  en: {
    // Navigation
    nav: {
      home: "Home",
      events: "Events",
      activities: "Activities",
      shops: "Shops",
      map: "Map",
      about: "About",
      profile: "Profile",
      login: "Login",
      logout: "Logout",
      admin: "Admin"
    },

    // Home Page
    home: {
      welcome: "Welcome to Gracia",
      subtitle: "Your digital companion for exploring our sustainable farm",
      announcements: "Announcements",
      quickAccess: "Quick Access",
      todayEvents: "Today's Events",
      viewAll: "View All",
      noAnnouncements: "No announcements at this time",
      featuredActivities: "Featured Activities"
    },

    // Events
    events: {
      title: "Events",
      upcoming: "Upcoming Events",
      today: "Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      noEvents: "No events found",
      filterBy: "Filter by",
      allAudiences: "All Audiences",
      families: "Families",
      schools: "Schools",
      entrepreneurs: "Entrepreneurs",
      bookNow: "Book Now",
      spotsLeft: "spots left",
      fullyBooked: "Fully Booked",
      viewDetails: "View Details",
      location: "Location",
      time: "Time",
      duration: "Duration",
      ageGroup: "Age Group"
    },

    // Activities
    activities: {
      title: "Activities",
      explore: "Explore Activities",
      categories: "Categories",
      allActivities: "All Activities",
      noActivities: "No activities found",
      difficulty: "Difficulty",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced"
    },

    // Shops
    shops: {
      title: "Shops & Cafes",
      openNow: "Open Now",
      closed: "Closed",
      closingSoon: "Closing Soon",
      opensAt: "Opens at",
      closesAt: "Closes at",
      viewMenu: "View Menu",
      getDirections: "Get Directions",
      noShops: "No shops found"
    },

    // Map
    map: {
      title: "Farm Map",
      zones: "Zones",
      yourLocation: "Your Location",
      selectZone: "Select a zone to explore",
      zoneClosed: "Zone Closed",
      partialClosure: "Partial Closure",
      navigate: "Navigate",
      zoneInfo: "Zone Information"
    },

    // AI Assistant
    assistant: {
      title: "AI Assistant",
      placeholder: "Ask me anything about Gracia...",
      send: "Send",
      thinking: "Thinking...",
      greeting: "Hi! I'm your Gracia guide. How can I help you today?",
      suggestions: "Suggested Questions",
      feedbackThanks: "Thanks for your feedback!",
      offline: "I'm currently offline. Please check your connection.",
      error: "Sorry, something went wrong. Please try again."
    },

    // Profile
    profile: {
      title: "My Profile",
      editProfile: "Edit Profile",
      favorites: "Favorites",
      bookings: "My Bookings",
      settings: "Settings",
      notifications: "Notifications",
      language: "Language",
      darkMode: "Dark Mode",
      accessibility: "Accessibility",
      signOut: "Sign Out"
    },

    // Auth
    auth: {
      login: "Login",
      register: "Register",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      continueAsGuest: "Continue as Guest",
      orContinueWith: "Or continue with"
    },

    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
      back: "Back",
      next: "Next",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      share: "Share",
      favorite: "Favorite",
      unfavorite: "Remove from favorites",
      viewMore: "View More",
      showLess: "Show Less",
      noResults: "No results found",
      tryAgain: "Try Again",
      refresh: "Refresh"
    },

    // Errors
    errors: {
      generic: "Something went wrong",
      network: "Network error. Please check your connection.",
      notFound: "Page not found",
      unauthorized: "Please login to continue",
      forbidden: "You don't have permission to access this"
    },

    // Time
    time: {
      now: "Now",
      today: "Today",
      tomorrow: "Tomorrow",
      yesterday: "Yesterday",
      minutes: "minutes",
      hours: "hours",
      days: "days"
    }
  },

  ar: {
    // Arabic translations
    nav: {
      home: "الرئيسية",
      events: "الفعاليات",
      activities: "الأنشطة",
      shops: "المتاجر",
      map: "الخريطة",
      about: "عن غراسيا",
      profile: "الملف الشخصي",
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      admin: "الإدارة"
    },
    home: {
      welcome: "مرحباً بكم في غراسيا",
      subtitle: "رفيقك الرقمي لاستكشاف مزرعتنا المستدامة",
      announcements: "الإعلانات",
      quickAccess: "الوصول السريع",
      todayEvents: "فعاليات اليوم",
      viewAll: "عرض الكل",
      noAnnouncements: "لا توجد إعلانات حالياً",
      featuredActivities: "الأنشطة المميزة"
    },
    events: {
      title: "الفعاليات",
      upcoming: "الفعاليات القادمة",
      today: "اليوم",
      thisWeek: "هذا الأسبوع",
      thisMonth: "هذا الشهر",
      noEvents: "لم يتم العثور على فعاليات",
      filterBy: "تصفية حسب",
      allAudiences: "جميع الفئات",
      families: "العائلات",
      schools: "المدارس",
      entrepreneurs: "رواد الأعمال",
      bookNow: "احجز الآن",
      spotsLeft: "أماكن متبقية",
      fullyBooked: "محجوز بالكامل",
      viewDetails: "عرض التفاصيل",
      location: "الموقع",
      time: "الوقت",
      duration: "المدة",
      ageGroup: "الفئة العمرية"
    },
    common: {
      loading: "جاري التحميل...",
      error: "خطأ",
      success: "نجاح",
      cancel: "إلغاء",
      save: "حفظ",
      delete: "حذف",
      edit: "تعديل",
      close: "إغلاق",
      back: "رجوع",
      next: "التالي",
      search: "بحث",
      filter: "تصفية",
      sort: "ترتيب",
      share: "مشاركة",
      favorite: "المفضلة",
      unfavorite: "إزالة من المفضلة",
      viewMore: "عرض المزيد",
      showLess: "عرض أقل",
      noResults: "لم يتم العثور على نتائج",
      tryAgain: "حاول مرة أخرى",
      refresh: "تحديث"
    },
    assistant: {
      title: "المساعد الذكي",
      placeholder: "اسألني أي شيء عن غراسيا...",
      send: "إرسال",
      thinking: "جاري التفكير...",
      greeting: "مرحباً! أنا دليلك في غراسيا. كيف يمكنني مساعدتك اليوم؟",
      suggestions: "أسئلة مقترحة",
      feedbackThanks: "شكراً على ملاحظاتك!",
      offline: "أنا غير متصل حالياً. يرجى التحقق من اتصالك.",
      error: "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى."
    },
    errors: {
      generic: "حدث خطأ ما",
      network: "خطأ في الشبكة. يرجى التحقق من اتصالك.",
      notFound: "الصفحة غير موجودة",
      unauthorized: "يرجى تسجيل الدخول للمتابعة",
      forbidden: "ليس لديك صلاحية للوصول"
    }
  },

  fr: {
    // French translations
    nav: {
      home: "Accueil",
      events: "Événements",
      activities: "Activités",
      shops: "Boutiques",
      map: "Carte",
      about: "À propos",
      profile: "Profil",
      login: "Connexion",
      logout: "Déconnexion",
      admin: "Admin"
    },
    home: {
      welcome: "Bienvenue à Gracia",
      subtitle: "Votre compagnon numérique pour explorer notre ferme durable",
      announcements: "Annonces",
      quickAccess: "Accès Rapide",
      todayEvents: "Événements du Jour",
      viewAll: "Voir Tout",
      noAnnouncements: "Aucune annonce pour le moment",
      featuredActivities: "Activités en Vedette"
    },
    common: {
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      cancel: "Annuler",
      save: "Enregistrer",
      delete: "Supprimer",
      edit: "Modifier",
      close: "Fermer",
      back: "Retour",
      next: "Suivant",
      search: "Rechercher",
      filter: "Filtrer",
      sort: "Trier",
      share: "Partager",
      favorite: "Favori",
      viewMore: "Voir Plus",
      showLess: "Voir Moins",
      noResults: "Aucun résultat trouvé",
      tryAgain: "Réessayer",
      refresh: "Actualiser"
    }
  }
};

// Current language state
let currentLanguage = localStorage.getItem('app_language') || 'en';

// Get nested translation by key path
function getNestedTranslation(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Translation function
export function t(key, params = {}) {
  const translation = getNestedTranslation(translations[currentLanguage], key)
    || getNestedTranslation(translations.en, key)
    || key;

  // Replace parameters like {name} with actual values
  if (typeof translation === 'string' && Object.keys(params).length > 0) {
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }

  return translation;
}

// Get current language
export function getCurrentLanguage() {
  return currentLanguage;
}

// Set language
export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('app_language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Dispatch event for React components to update
    window.dispatchEvent(new CustomEvent('languageChange', { detail: { language: lang } }));
    return true;
  }
  return false;
}

// Get available languages
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'fr', name: 'French', nativeName: 'Français' }
  ];
}

// Check if language is RTL
export function isRTL(lang = currentLanguage) {
  return lang === 'ar';
}

// Initialize language on app load
export function initializeLanguage() {
  const savedLang = localStorage.getItem('app_language');
  const browserLang = navigator.language.split('-')[0];
  const lang = savedLang || (translations[browserLang] ? browserLang : 'en');
  setLanguage(lang);
}

// React hook for translations
export function useTranslation() {
  const [, forceUpdate] = React.useState({});

  React.useEffect(() => {
    const handleLanguageChange = () => forceUpdate({});
    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  return {
    t,
    currentLanguage: getCurrentLanguage(),
    setLanguage,
    availableLanguages: getAvailableLanguages(),
    isRTL: isRTL()
  };
}

// Import React for the hook
import React from 'react';

export default {
  t,
  getCurrentLanguage,
  setLanguage,
  getAvailableLanguages,
  isRTL,
  initializeLanguage,
  useTranslation
};
