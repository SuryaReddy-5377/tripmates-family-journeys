import { useState, useEffect } from "react";

export type Language = "en" | "te";

export const LANGUAGES: { code: Language; label: string; nativeName: string }[] = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు" },
];

const STORAGE_KEY = "tripmates_lang_pref";

export const translations = {
  en: {
    // Brand
    brandName: "TripMates",
    brandTagline: "Premium Family Travel Planner",

    // Navigation
    navDashboard: "Dashboard",
    navTrips: "My Trips",
    navMap: "Explore Map",
    navItinerary: "Itinerary",
    navExpenses: "Expenses",
    navBudget: "Budget",
    navChecklist: "Checklist",
    navFamily: "Family Members",
    navNotifications: "Notifications",
    navSettings: "Settings",
    navSuperAdmin: "Super Admin",
    navSignOut: "Sign Out",

    // Common Actions
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    create: "Create",
    back: "Back",
    close: "Close",
    search: "Search",
    loading: "Loading...",
    confirm: "Confirm",
    retry: "Retry",
    online: "Online",
    offline: "Offline",
    all: "All",
    status: "Status",
    actions: "Actions",

    // Dashboard
    welcomeGreeting: "Hello",
    dashboardSubtitle: "Here is your family's travel overview, upcoming adventures, and shared finances.",
    upcomingTrip: "Next Adventure",
    noUpcomingTrips: "No upcoming trips planned yet",
    planTripNow: "Plan a Trip",
    countdownDays: "Days",
    countdownHours: "Hours",
    countdownMins: "Mins",
    totalTripBudget: "Total Budget",
    totalTripSpent: "Total Spent",
    remainingBudget: "Remaining",
    recentExpenses: "Recent Expenses",
    quickActions: "Quick Actions",
    createTripBtn: "Create Trip",
    addExpenseBtn: "Add Expense",
    openMapBtn: "Open Map",
    travelers: "Travelers",
    outstandingBalance: "Your Balance",
    youOwe: "You owe",
    youAreOwed: "You are owed",
    settledUp: "All settled up",
    upcomingActivities: "Upcoming Itinerary",
    noUpcomingActivities: "No scheduled activities for today.",

    // Trips
    allTrips: "All Trips",
    tripsSubtitle: "Manage active and upcoming family journeys.",
    newTrip: "New Trip",
    tripName: "Trip Name",
    destination: "Destination",
    startDate: "Start Date",
    endDate: "End Date",
    budget: "Budget (₹)",
    tripStatus: "Trip Status",
    statusDraft: "Draft",
    statusUpcoming: "Upcoming",
    statusActive: "Active",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    markAsCompleted: "Mark as Completed",
    markCompletedConfirmTitle: "Mark Trip as Completed?",
    markCompletedConfirmDesc: "Completed trips are archived to historical records. Only Super Admins retain full access to detailed notes and itemized ledgers.",
    completedTripNotice: "This trip is marked as completed and locked for regular editing.",
    superAdminAccessOnly: "Restricted View: Full itemized archive is preserved for Super Admin inspection.",
    viewSummaryOnly: "View Trip Summary",
    reopenTrip: "Reopen Trip",

    // Map & Routing
    mapTitle: "Explore Map & Routes",
    mapSubtitle: "Road navigation, day stops, and offline map regions.",
    allDays: "All Days",
    day: "Day",
    searchPlaces: "Search places in destination...",
    addStop: "Add Stop",
    stopName: "Stop / Place Name",
    stopAddress: "Address / Landmark",
    arrivalTime: "Planned Arrival (e.g. 10:30 AM)",
    notes: "Notes / Details",
    roadDistance: "Road Distance",
    estDriveTime: "Est. Driving Time",
    navigateInGoogleMaps: "Turn-by-Turn Navigation",
    liveGPS: "Live GPS",
    gpsActive: "GPS Active",
    offlineMaps: "Offline Maps",
    downloadRegion: "Download Region",
    storageUsed: "Storage Used",
    downloadingTiles: "Downloading map tiles...",
    offlineReady: "Offline Ready",

    // Itinerary
    itineraryTitle: "Day-by-Day Itinerary",
    itinerarySubtitle: "Keep everyone on schedule with synchronized family timelines.",
    addActivityBtn: "Add Activity",
    activityTitle: "Activity Title",
    time: "Time",
    location: "Location",
    assignedTo: "Assigned Family Members",
    scheduleConflict: "Schedule Conflict Detected",
    bookingConfirmed: "Confirmed",
    bookingTentative: "Tentative",

    // Expenses & Splits
    expensesTitle: "Trip Expenses & Split Ledger",
    expensesSubtitle: "Exact integer paise calculations. Fair and transparent splitting.",
    recordExpenseBtn: "Record Expense",
    expenseAmount: "Amount (₹)",
    paidBy: "Paid By",
    splitWith: "Split With",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    splitMethod: "Split Method",
    splitEqually: "Equally",
    splitCustom: "Exact Shares",
    category: "Category",
    categoryFood: "Food & Dining",
    categoryTransport: "Transport & Fuel",
    categoryStay: "Hotel & Stay",
    categoryActivities: "Activities & Tickets",
    categoryShopping: "Shopping",
    categoryMedical: "Medical & Health",
    categoryMisc: "Miscellaneous",
    netBalances: "Who Owes Whom",
    settleUpBtn: "Settle Up",
    recordSettlement: "Record Settlement Payment",
    payer: "From (Payer)",
    recipient: "To (Recipient)",
    settlementProof: "Reference / Transaction ID",

    // Budget
    budgetAnalyticsTitle: "Budget & Spend Analytics",
    budgetAnalyticsSubtitle: "Monitor spending velocity and family consumption in real-time.",
    budgetUtilization: "Budget Utilization",
    budgetAlert80: "Warning: You have reached 80% of the trip budget.",
    budgetAlert100: "Alert: Trip budget limit exceeded!",
    spendingByCategory: "Spending by Category",
    spendingByMember: "Spending by Member",

    // Checklist
    checklistTitle: "Packing & Travel Checklist",
    checklistSubtitle: "Never leave essentials behind. Categorized family checklist.",
    addItemBtn: "Add Item",
    categoryTickets: "Tickets & Reservations",
    categoryHotel: "Hotel & Stays",
    categoryVehicle: "Vehicle & Fastag",
    categoryDocuments: "ID Proofs & Passes",
    categoryMedicines: "Medicines & First Aid",
    categoryLuggage: "Luggage & Clothing",
    categoryElectronics: "Chargers & Gadgets",
    categoryEmergency: "Emergency & Cash",
    categoryGeneral: "General Items",

    // Family
    familyTitle: "Family Groups & Relatives",
    familySubtitle: "Private travel circles with role-based member permissions.",
    inviteCode: "Family Invite Code",
    copyCode: "Copy Code",
    codeCopied: "Invite Code Copied!",
    roleFamilyAdmin: "Family Admin",
    roleRegularMember: "Regular Member",
    roleSuperAdmin: "Super Admin",
    switchFamily: "Switch Family Group",

    // Settings
    settingsTitle: "Account & Preferences",
    settingsSubtitle: "Customize your language, data cache, and profile.",
    languageSection: "Language Preference",
    languageHelp: "Choose your preferred language for TripMates. Changes apply instantly across the whole app.",
    offlineCacheSection: "Offline Data & Cache",
    clearOfflineData: "Clear Stored Tiles & Cache",
    offlineClearedSuccess: "Offline storage cleared successfully.",

    // Weather
    weatherTitle: "Destination Weather",
    weatherLive: "Current Conditions",
    temp: "Temperature",
    humidity: "Humidity",
    weatherForecast: "Forecast",
    weatherUnavailable: "Weather information currently unavailable",
  },

  te: {
    // Brand
    brandName: "ట్రిప్‌మేట్స్",
    brandTagline: "కుటుంబ ప్రయాణ ప్రణాళికా వేదిక",

    // Navigation
    navDashboard: "డ్యాష్‌బోర్డ్",
    navTrips: "నా ప్రయాణాలు",
    navMap: "మ్యాప్ అన్వేషణ",
    navItinerary: "షెడ్యూల్",
    navExpenses: "ఖర్చులు",
    navBudget: "బడ్జెట్",
    navChecklist: "చెక్-లిస్ట్",
    navFamily: "కుటుంబ సభ్యులు",
    navNotifications: "నోటిఫికేషన్లు",
    navSettings: "సెట్టింగ్‌లు",
    navSuperAdmin: "సూపర్ అడ్మిన్",
    navSignOut: "లాగ్ అవుట్",

    // Common Actions
    save: "భద్రపరచు",
    cancel: "రద్దు చేయి",
    delete: "తొలగించు",
    edit: "సవరించు",
    add: "చేర్చు",
    create: "సృష్టించు",
    back: "వెనుకకు",
    close: "మూసివేయి",
    search: "శోధించండి",
    loading: "లోడ్ అవుతోంది...",
    confirm: "నిర్ధారించు",
    retry: "మళ్లీ ప్రయత్నించు",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    all: "అన్నీ",
    status: "స్థితి",
    actions: "చర్యలు",

    // Dashboard
    welcomeGreeting: "నమస్కారం",
    dashboardSubtitle: "మీ కుటుంబ ప్రయాణ వివరాలు, రాబోయే ప్రయాణాలు మరియు ఉమ్మడి ఖర్చుల సమాచారం.",
    upcomingTrip: "రాబోయే ప్రయాణం",
    noUpcomingTrips: "ప్రస్తుతం ఏ ప్రయాణాలు ప్లాన్ చేయబడలేదు",
    planTripNow: "ప్రయాణాన్ని ప్రారంభించండి",
    countdownDays: "రోజులు",
    countdownHours: "గంటలు",
    countdownMins: "నిమిషాలు",
    totalTripBudget: "మొత్తం బడ్జెట్",
    totalTripSpent: "మొత్తం ఖర్చు",
    remainingBudget: "మిగిలిన మొత్తం",
    recentExpenses: "ఇటీవలి ఖర్చులు",
    quickActions: "త్వరిత చర్యలు",
    createTripBtn: "కొత్త ప్రయాణం",
    addExpenseBtn: "ఖర్చు జోడించండి",
    openMapBtn: "మ్యాప్ తెరవండి",
    travelers: "ప్రయాణికులు",
    outstandingBalance: "మీ బ్యాలెన్స్",
    youOwe: "మీరు ఇవ్వాల్సినవి",
    youAreOwed: "మీకు రావాల్సినవి",
    settledUp: "అన్ని లెక్కలు పూర్తయ్యాయి",
    upcomingActivities: "రాబోయే షెడ్యూల్",
    noUpcomingActivities: "నేటికి ఎటువంటి కార్యక్రమాలు లేవు.",

    // Trips
    allTrips: "అన్ని ప్రయాణాలు",
    tripsSubtitle: "ప్రస్తుత మరియు ముగిసిన కుటుంబ ప్రయాణాలను నిర్వహించండి.",
    newTrip: "కొత్త ప్రయాణం",
    tripName: "ప్రయాణం పేరు",
    destination: "గమ్యస్థానం",
    startDate: "ప్రారంభ తేదీ",
    endDate: "ముగింపు తేదీ",
    budget: "బడ్జెట్ (₹)",
    tripStatus: "ప్రయాణ స్థితి",
    statusDraft: "డ్రాఫ్ట్",
    statusUpcoming: "రాబోయేది",
    statusActive: "కొనసాగుతోంది",
    statusCompleted: "పూర్తయింది",
    statusCancelled: "రద్దు చేయబడింది",
    markAsCompleted: "ప్రయాణం పూర్తయినట్లు గుర్తించు",
    markCompletedConfirmTitle: "ఈ ప్రయాణం పూర్తయిందని నిర్ధారించాలా?",
    markCompletedConfirmDesc: "పూర్తయిన ప్రయాణాలు చారిత్రక రికార్డులకు తరలించబడతాయి. పూర్తి వివరాలు మరియు ఖర్చులను కేవలం సూపర్ అడ్మిన్ మాత్రమే వీక్షించగలరు.",
    completedTripNotice: "ఈ ప్రయాణం పూర్తయింది, సాధారణ సవరణలు నిలిపివేయబడ్డాయి.",
    superAdminAccessOnly: "పరిమిత వీక్షణ: సమగ్ర పద్దులు సూపర్ అడ్మిన్ తనిఖీ కోసం మాత్రమే రక్షించబడ్డాయి.",
    viewSummaryOnly: "సారాంశం వీక్షించండి",
    reopenTrip: "ప్రయాణాన్ని పునఃప్రారంభించు",

    // Map & Routing
    mapTitle: "మ్యాప్ & ప్రయాణ మార్గాలు",
    mapSubtitle: "రోడ్డు నావిగేషన్, రోజువారీ స్టాప్‌లు మరియు ఆఫ్‌లైన్ మ్యాప్‌లు.",
    allDays: "అన్ని రోజులు",
    day: "రోజు",
    searchPlaces: "గమ్యస్థానంలో స్థలాలను వెతకండి...",
    addStop: "స్టాప్ జోడించండి",
    stopName: "స్థలం పేరు",
    stopAddress: "చిరునామా / ల్యాండ్‌మార్క్",
    arrivalTime: "చేరుకునే సమయం (ఉదా. 10:30 AM)",
    notes: "గమనికలు / వివరాలు",
    roadDistance: "రోడ్డు దూరం",
    estDriveTime: "అంచనా ప్రయాణ సమయం",
    navigateInGoogleMaps: "గూగుల్ మ్యాప్స్ నావిగేషన్",
    liveGPS: "లైవ్ జీపీఎస్ (GPS)",
    gpsActive: "జీపీఎస్ యాక్టివ్‌గా ఉంది",
    offlineMaps: "ఆఫ్‌లైన్ మ్యాప్‌లు",
    downloadRegion: "ప్రాంతాన్ని డౌన్‌లోడ్ చేయండి",
    storageUsed: "వినియోగించిన మెమరీ",
    downloadingTiles: "మ్యాప్ డౌన్‌లోడ్ అవుతోంది...",
    offlineReady: "ఆఫ్‌లైన్ సిద్ధంగా ఉంది",

    // Itinerary
    itineraryTitle: "రోజువారీ షెడ్యూల్",
    itinerarySubtitle: "కుటుంబ సభ్యులందరినీ ఒకే సమయానికి సమన్వయం చేయండి.",
    addActivityBtn: "కార్యక్రమాన్ని జోడించండి",
    activityTitle: "కార్యక్రమం పేరు",
    time: "సమయం",
    location: "ప్రదేశం",
    assignedTo: "కేటాయించబడిన సభ్యులు",
    scheduleConflict: "సమయ వివాదం గుర్తించబడింది",
    bookingConfirmed: "ఖరారైంది",
    bookingTentative: "తాత్కాలికం",

    // Expenses & Splits
    expensesTitle: "ఖర్చులు & సమాన పంపకాలు",
    expensesSubtitle: "పైసలతో సహా కచ్చితమైన లెక్కలు. పారదర్శక విభజన.",
    recordExpenseBtn: "ఖర్చును నమోదు చేయండి",
    expenseAmount: "మొత్తం (₹)",
    paidBy: "చెల్లించిన వారు",
    splitWith: "పంచుకునే సభ్యులు",
    selectAll: "అందరినీ ఎంచుకోండి",
    deselectAll: "అందరినీ తీసివేయండి",
    splitMethod: "విభజన పద్ధతి",
    splitEqually: "సమానంగా",
    splitCustom: "కచ్చితమైన వాటా",
    category: "వర్గం",
    categoryFood: "ఆహారం & భోజనం",
    categoryTransport: "రవాణా & ఇంధనం",
    categoryStay: "హోటల్ & బస",
    categoryActivities: "కార్యక్రమాలు & టిక్కెట్లు",
    categoryShopping: "షాపింగ్",
    categoryMedical: "వైద్యం & ఆరోగ్యం",
    categoryMisc: "ఇతర ఖర్చులు",
    netBalances: "ఎవరు ఎవరికి ఇవ్వాలి",
    settleUpBtn: "లెక్క తేల్చండి",
    recordSettlement: "చెల్లింపు నమోదు చేయండి",
    payer: "చెల్లించేవారు",
    recipient: "స్వీకరించేవారు",
    settlementProof: "లావాదేవీ సంఖ్య (UPI ID / Ref)",

    // Budget
    budgetAnalyticsTitle: "బడ్జెట్ & ఖర్చు విశ్లేషణ",
    budgetAnalyticsSubtitle: "నిజ-సమయ బడ్జెట్ వినియోగం మరియు ఖర్చుల తీరు.",
    budgetUtilization: "బడ్జెట్ వినియోగం",
    budgetAlert80: "హెచ్చరిక: మీరు ప్రయాణ బడ్జెట్‌లో 80% చేరుకున్నారు.",
    budgetAlert100: "హెచ్చరిక: బడ్జెట్ పరిమితిని మించిపోయింది!",
    spendingByCategory: "వర్గం వారీగా ఖర్చులు",
    spendingByMember: "సభ్యుల వారీగా ఖర్చులు",

    // Checklist
    checklistTitle: "ప్యాకింగ్ & ప్రయాణ చెక్-లిస్ట్",
    checklistSubtitle: "ముఖ్యమైన వస్తువులను ఎప్పటికీ మరచిపోకండి.",
    addItemBtn: "వస్తువును జోడించండి",
    categoryTickets: "టిక్కెట్లు & రిజర్వేషన్లు",
    categoryHotel: "హోటల్ బుకింగ్‌లు",
    categoryVehicle: "వాహనం & ఫాస్టాగ్",
    categoryDocuments: "గుర్తింపు కార్డులు (Aadhaar / ID)",
    categoryMedicines: "మందులు & ప్రథమ చికిత్స",
    categoryLuggage: "దుస్తులు & లగేజీ",
    categoryElectronics: "ఛార్జర్లు & గాడ్జెట్లు",
    categoryEmergency: "అత్యవసర నగదు",
    categoryGeneral: "సాధారణ వస్తువులు",

    // Family
    familyTitle: "కుటుంబ సమూహాలు & బంధువులు",
    familySubtitle: "అనుమతులతో కూడిన ప్రైవేట్ కుటుంబ సర్కిల్‌లు.",
    inviteCode: "కుటుంబ ఆహ్వాన కోడ్",
    copyCode: "కోడ్‌ను కాపీ చేయండి",
    codeCopied: "ఆహ్వాన కోడ్ కాపీ చేయబడింది!",
    roleFamilyAdmin: "ఫ్యామిలీ అడ్మిన్",
    roleRegularMember: "సాధారణ సభ్యుడు",
    roleSuperAdmin: "సూపర్ అడ్మిన్",
    switchFamily: "కుటుంబ సమూహాన్ని మార్చండి",

    // Settings
    settingsTitle: "ఖాతా & ప్రాధాన్యతలు",
    settingsSubtitle: "మీ భాష, డేటా కాష్ మరియు ప్రొఫైల్‌ను కాన్ఫిగర్ చేయండి.",
    languageSection: "భాషా ప్రాధాన్యత",
    languageHelp: "ట్రిప్‌మేట్స్ కోసం మీ ప్రాధాన్య భాషను ఎంచుకోండి. మార్పులు తక్షణమే వర్తిస్తాయి.",
    offlineCacheSection: "ఆఫ్‌లైన్ డేటా & కాష్",
    clearOfflineData: "ఆఫ్‌లైన్ మ్యాప్‌లు మరియు కాష్‌ను క్లియర్ చేయండి",
    offlineClearedSuccess: "ఆఫ్‌లైన్ డేటా విజయవంతంగా క్లియర్ చేయబడింది.",

    // Weather
    weatherTitle: "గమ్యస్థాన వాతావరణం",
    weatherLive: "ప్రస్తుత పరిస్థితులు",
    temp: "ఉష్ణోగ్రత",
    humidity: "తేమ",
    weatherForecast: "వాతావరణ అంచనా",
    weatherUnavailable: "వాతావరణ సమాచారం ప్రస్తుతం అందుబాటులో లేదు",
  },
};

export type TranslationKey = keyof typeof translations.en;

// Simple reactive event bus for cross-component re-renders
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

let currentLanguage: Language = "en";

// Initialize language from localStorage on client
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    if (saved === "en" || saved === "te") {
      currentLanguage = saved;
    }
  } catch {
    // Ignore storage errors
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors
    }
  }
  notify();
}

export function translate(key: TranslationKey, lang: Language = currentLanguage): string {
  const dict = translations[lang] || translations.en;
  return dict[key] || translations.en[key] || key;
}

export function useTranslation() {
  const [lang, setLangState] = useState<Language>(currentLanguage);

  useEffect(() => {
    const handler = () => {
      setLangState(currentLanguage);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang);
  };

  const t = (key: TranslationKey): string => {
    return translate(key, lang);
  };

  return {
    lang,
    setLanguage: changeLanguage,
    t,
    isTelugu: lang === "te",
  };
}
