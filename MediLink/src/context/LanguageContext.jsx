import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);

export const TRANSLATIONS = {
  en: {
    // Nav & System
    dashboard: "Dashboard",
    users: "Users",
    branches: "Branches",
    medicines: "Medicines",
    categories: "Categories",
    batches: "Medicine Batches",
    suppliers: "Suppliers",
    purchases: "Purchases",
    sales: "Sales & Billing",
    prescriptions: "Prescriptions",
    customers: "Customers",
    reservations: "Reservations",
    availability: "Medicine Availability",
    partners: "Partner Medical Shops",
    reports: "Reports",
    notifications: "Notifications",
    settings: "Settings",
    apiAccess: "API Access",
    adminConsole: "System Administrator Console",
    quickDemoLogin: "EVALUATOR QUICK LOGIN (5+ USERS)",
    signInWorkspace: "Sign in to your workspace",
    enterCredentials: "Enter your credentials or choose a verified test account below.",
    continueGoogle: "Continue with Google",
    continueGithub: "Continue with GitHub",
    logout: "Logout",
    clearRecent: "Clear Recent",
    copyApiKey: "Copy API Key",
    viewAllNotifications: "View all notifications",
    markAllRead: "Mark all read",
    activeStatus: "Active",
    inactiveStatus: "Inactive",

    // Common Actions
    create: "Create",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    collect: "Collect",
    search: "Search",
    filter: "Filter",
    refresh: "Refresh",
    actions: "Actions",
    view: "View",
    sendSms: "Send WhatsApp",
    sendWhatsApp: "Send WhatsApp",
    send: "Send",

    // Common Labels
    customer: "Customer",
    customerName: "Customer Name",
    phone: "Phone Number",
    phoneNumber: "Phone Number",
    customerPhone: "Customer Phone",
    medicine: "Medicine",
    medicineName: "Medicine Name",
    quantity: "Quantity",
    branch: "Branch",
    status: "Status",
    price: "Price",
    stock: "Stock",
    available: "Available",
    availableStock: "Available Stock",
    batch: "Batch",
    batchNumber: "Batch Number",
    generic: "Generic Name",
    expiry: "Expiry Date",
    expiresOn: "Expires On",
    date: "Date",
    bookingDate: "Booking Date",
    notes: "Notes",
    total: "Total",
    grandTotal: "Grand Total",

    // Reservations & Queue
    reservationId: "Reservation ID",
    reservedMedicine: "Reserved Medicine",
    stockArrived: "Stock Arrived",
    notifyQueue: "Notify Queue via WhatsApp",
    stockQueueTitle: "Stock Arrived · Queue WhatsApp Dispatcher",
    availableUnits: "Available Newly Arrived Units",
    fifoOrderNotice: "Queued customers will receive WhatsApp strictly by booking timestamp order.",
    deleteReservationConfirm: "Are you sure you want to delete this reservation?",

    // Partners
    partnerShopsTitle: "Partner Medical Shops & Availability",
    availableMedicinesAt: "Available Medicines at",
    addMedicineStock: "+ Add Medicine Stock",
    sendSmsInquiry: "Send WhatsApp Inquiry to Shop",
    sendWhatsAppInquiry: "Send WhatsApp Inquiry to Shop",
    inquireViaSms: "WhatsApp Inquiry",
    shopInventorySubtitle: "Explore specific shop availability, add inventory batches, or inquire via WhatsApp.",

    // Google OAuth Chooser
    signInWithGoogle: "Sign in with Google",
    chooseAccount: "Choose an account",
    continueTo: "to continue to",
    useAnotherAccount: "Use another account",
    privacyNotice: "Before using this app, you can review MediLink's Privacy Policy and Terms of Service.",

    // Dashboard & Stats
    recentItems: "Recently Accessed",
    noRecent: "No recently accessed records yet",
    searchPlaceholder: "Search medicines, customers, bills, batches...",
    allBranches: "All Branches",
    totalSales: "Total Sales",
    grossProfit: "Gross Profit",
    activeBatches: "Active Batches",
    lowStock: "Low Stock Items",
    nearExpiry: "Expiring Soon",
    expired: "Expired",
    pendingReservations: "Pending Reservations",
    checkSafety: "Check Availability",
    medibotTitle: "MediBot AI Assistant",
    medibotSubtitle: "Pharmacy & Stock Assistant",
    askQuestion: "Ask a question about medicines, stock...",

    // Statuses
    pending: "Pending",
    reserved: "Reserved",
    collected: "Collected",
    cancelled: "Cancelled",
  },

  ta: {
    // Nav & System
    dashboard: "டாஷ்போர்டு",
    users: "பயனர்கள்",
    branches: "கிளைகள்",
    medicines: "மருந்துகள்",
    categories: "வகைகள்",
    batches: "மருந்து தொகுப்புகள்",
    suppliers: "வழங்குநர்கள்",
    purchases: "கொள்முதல்கள்",
    sales: "விற்பனை & பில்லிங்",
    prescriptions: "மருத்துவர் சீட்டுகள்",
    customers: "வாடிக்கையாளர்கள்",
    reservations: "முன்பதிவுகள்",
    availability: "மருந்து இருப்பு விபரம்",
    partners: "கூட்டு மருந்தகங்கள்",
    reports: "அறிக்கைகள்",
    notifications: "அறிவிப்புகள்",
    settings: "அமைப்புகள்",
    apiAccess: "ஏபிஐ அணுகல் (API)",
    adminConsole: "நிர்வாகி கன்சோல் (Admin)",
    quickDemoLogin: "சோதனை கணக்குகள் (5+ பயனர்கள்)",
    signInWorkspace: "உங்கள் கணக்கில் உள்நுழையவும்",
    enterCredentials: "உங்கள் சான்றுகளை உள்ளிடவும் அல்லது சோதனை கணக்கை தேர்வு செய்யவும்.",
    continueGoogle: "Google மூலம் உள்நுழைக",
    continueGithub: "GitHub மூலம் உள்நுழைக",
    logout: "வெளியேறு",
    clearRecent: "அனைத்தையும் நீக்கு",
    copyApiKey: "API சாவியை நகலெடு",
    viewAllNotifications: "அனைத்து அறிவிப்புகள்",
    markAllRead: "அனைத்தும் படித்ததாக குறிக்கவும்",
    activeStatus: "செயலில்",
    inactiveStatus: "செயலற்றது",

    // Common Actions
    create: "உருவாக்கு",
    add: "சேர்",
    edit: "திருத்து",
    delete: "நீக்கு",
    save: "சேமி",
    saveChanges: "மாற்றங்களைச் சேமி",
    cancel: "ரத்து செய்",
    close: "மூடு",
    confirm: "உறுதி செய்",
    collect: "பெற்றுக்கொள்",
    search: "தேடு",
    filter: "வடிகட்டு",
    refresh: "புதுப்பி",
    actions: "செயல்கள்",
    view: "பார்",
    sendSms: "WhatsApp அனுப்பு",
    sendWhatsApp: "WhatsApp அனுப்பு",
    send: "அனுப்பு",

    // Common Labels
    customer: "வாடிக்கையாளர்",
    customerName: "வாடிக்கையாளர் பெயர்",
    phone: "தொலைபேசி எண்",
    phoneNumber: "தொலைபேசி எண்",
    customerPhone: "வாடிக்கையாளர் தொலைபேசி",
    medicine: "மருந்து",
    medicineName: "மருந்து பெயர்",
    quantity: "அளவு",
    branch: "கிளை",
    status: "நிலை",
    price: "விலை",
    stock: "இருப்பு",
    available: "கிடைக்கும் அளவு",
    availableStock: "இருப்பில் உள்ளவை",
    batch: "தொகுதி",
    batchNumber: "தொகுதி எண் (Batch)",
    generic: "மூலப்பொருள் (Generic)",
    expiry: "காலாவதி தேதி",
    expiresOn: "காலாவதியாகும் நாள்",
    date: "தேதி",
    bookingDate: "முன்பதிவு தேதி (வரிசை)",
    notes: "குறிப்புகள்",
    total: "மொத்தம்",
    grandTotal: "மொத்த தொகை",

    // Reservations & Queue
    reservationId: "முன்பதிவு எண்",
    reservedMedicine: "முன்பதிவு செய்யப்பட்ட மருந்து",
    stockArrived: "இருப்பு வந்துவிட்டது",
    notifyQueue: "வரிசையில் உள்ளவர்களுக்கு WhatsApp அனுப்பு",
    stockQueueTitle: "மருந்து இருப்பு வந்தது · வரிசை WhatsApp அறிவிப்பு",
    availableUnits: "புதிதாக வந்த மருந்துகளின் எண்ணிக்கை",
    fifoOrderNotice: "முன்பதிவு செய்த நேரத்தின் அடிப்படையில் வரிசையாக WhatsApp அனுப்பப்படும்.",
    deleteReservationConfirm: "இந்த முன்பதிவை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?",

    // Partners
    partnerShopsTitle: "கூட்டு மருந்தகங்கள் & மருந்து இருப்பு",
    availableMedicinesAt: "இதில் கிடைக்கும் மருந்துகள்:",
    addMedicineStock: "+ புதிய மருந்து சேர்க்க",
    sendSmsInquiry: "மருந்தகத்திற்கு WhatsApp விசாரணை அனுப்ப",
    sendWhatsAppInquiry: "மருந்தகத்திற்கு WhatsApp விசாரணை அனுப்ப",
    inquireViaSms: "WhatsApp விசாரணை",
    shopInventorySubtitle: "தேர்ந்தெடுத்த மருந்தகத்தின் இருப்பு, புதிய மருந்துகள் சேர்க்க அல்லது WhatsApp மூலம் விசாரிக்கலாம்.",

    // Google OAuth Chooser
    signInWithGoogle: "Google மூலம் உள்நுழைக",
    chooseAccount: "கணக்கைத் தேர்வுசெய்க",
    continueTo: "தொடர:",
    useAnotherAccount: "மற்றொரு கணக்கைப் பயன்படுத்தவும்",
    privacyNotice: "இந்த செயலியைப் பயன்படுத்துவதற்கு முன், MediLink-இன் தனியுரிமைக் கொள்கை மற்றும் சேவை விதிமுறைகளை நீங்கள் மதிப்பாய்வு செய்யலாம்.",

    // Dashboard & Stats
    recentItems: "சமீபத்தில் பார்த்தவை",
    noRecent: "சமீபத்திய பதிவுகள் எதுவும் இல்லை",
    searchPlaceholder: "மருந்துகள், பில்கள், தொகுப்புகளைத் தேட...",
    allBranches: "அனைத்து கிளைகள்",
    totalSales: "மொத்த விற்பனை",
    grossProfit: "மொத்த லாபம்",
    activeBatches: "செயலில் உள்ள தொகுப்புகள்",
    lowStock: "குறைந்த இருப்பு",
    nearExpiry: "விரைவில் காலாவதியாகும்",
    expired: "காலாவதியானது",
    pendingReservations: "நிலுவையிலுள்ள முன்பதிவுகள்",
    checkSafety: "இருப்பை சரிபார்க்கவும்",
    medibotTitle: "மெடிபாட் AI உதவியாளர்",
    medibotSubtitle: "மருந்தகம் & இருப்பு AI",
    askQuestion: "மருந்துகள், இருப்பு பற்றி கேளுங்கள்...",

    // Statuses
    pending: "நிலுவையில்",
    reserved: "முன்பதிவு செய்யப்பட்டது",
    collected: "பெறப்பட்டது",
    cancelled: "ரத்து செய்யப்பட்டது",
  },

  hi: {
    // Nav & System
    dashboard: "डैशबोर्ड",
    users: "उपयोगकर्ता",
    branches: "शाखाएं",
    medicines: "दवाइयां",
    categories: "श्रेणियां",
    batches: "दवा बैच",
    suppliers: "आपूर्तिकर्ता",
    purchases: "खरीद",
    sales: "बिक्री और बिलिंग",
    prescriptions: "पर्चे (Prescriptions)",
    customers: "ग्राहक",
    reservations: "आरक्षण",
    availability: "दवा उपलब्धता",
    partners: "पार्टनर मेडिकल शॉप्स",
    reports: "रिपोर्ट्स",
    notifications: "सूचनाएं",
    settings: "सेटिंग्स",
    apiAccess: "एपीआई एक्सेस",
    adminConsole: "सिस्टम एडमिनिस्ट्रेटर कंसोल",
    quickDemoLogin: "परीक्षण लॉगिन (5+ खाते)",
    signInWorkspace: "वर्कस्पेस में साइन इन करें",
    enterCredentials: "अपने क्रेडेंशियल दर्ज करें या नीचे एक सत्यापित खाता चुनें।",
    continueGoogle: "Google के साथ जारी रखें",
    continueGithub: "GitHub के साथ जारी रखें",
    logout: "लॉग आउट",
    clearRecent: "हालिया साफ़ करें",
    copyApiKey: "API कुंजी कॉपी करें",
    viewAllNotifications: "सभी सूचनाएं देखें",
    markAllRead: "सभी पढ़े हुए चिह्नित करें",
    activeStatus: "सक्रिय",
    inactiveStatus: "निष्क्रिय",

    // Common Actions
    create: "बनाएं",
    add: "जोड़ें",
    edit: "संपादित करें",
    delete: "हटाएं",
    save: "सहेजें",
    saveChanges: "बदलाव सहेजें",
    cancel: "रद्द करें",
    close: "बंद करें",
    confirm: "पुष्टि करें",
    collect: "प्राप्त करें",
    search: "खोजें",
    filter: "फ़िल्टर",
    refresh: "ताज़ा करें",
    actions: "क्रियाएं",
    view: "देखें",
    sendSms: "WhatsApp भेजें",
    sendWhatsApp: "WhatsApp भेजें",
    send: "भेजें",

    // Common Labels
    customer: "ग्राहक",
    customerName: "ग्राहक का नाम",
    phone: "फ़ोन नंबर",
    phoneNumber: "फ़ोन नंबर",
    customerPhone: "ग्राहक फ़ोन",
    medicine: "दवा",
    medicineName: "दवा का नाम",
    quantity: "मात्रा",
    branch: "शाखा",
    status: "स्थिति",
    price: "मूल्य",
    stock: "स्टॉक",
    available: "उपलब्ध",
    availableStock: "उपलब्ध स्टॉक",
    batch: "बैच",
    batchNumber: "बैच नंबर",
    generic: "जेनेरिक नाम",
    expiry: "समाप्ति तिथि",
    expiresOn: "समाप्त होने की तिथि",
    date: "दिनांक",
    bookingDate: "बुकिंग तिथि (कतार क्रम)",
    notes: "नोट्स",
    total: "कुल",
    grandTotal: "कुल योग",

    // Reservations & Queue
    reservationId: "आरक्षण आईडी",
    reservedMedicine: "आरक्षित दवा",
    stockArrived: "स्टॉक आ गया",
    notifyQueue: "कतार को WhatsApp भेजें",
    stockQueueTitle: "स्टॉक आ गया · कतार WhatsApp डिस्पैचर",
    availableUnits: "नया उपलब्ध स्टॉक",
    fifoOrderNotice: "ग्राहकों को बुकिंग समय के क्रम के अनुसार WhatsApp भेजा जाएगा।",
    deleteReservationConfirm: "क्या आप वाकई इस आरक्षण को हटाना चाहते हैं?",

    // Partners
    partnerShopsTitle: "पार्टनर मेडिकल शॉप्स और दवा उपलब्धता",
    availableMedicinesAt: "इसमें उपलब्ध दवाइयां:",
    addMedicineStock: "+ नया दवा स्टॉक जोड़ें",
    sendSmsInquiry: "दुकान को WhatsApp पूछताछ भेजें",
    sendWhatsAppInquiry: "दुकान को WhatsApp पूछताछ भेजें",
    inquireViaSms: "WhatsApp पूछताछ",
    shopInventorySubtitle: "विशिष्ट दुकान का स्टॉक देखें, दवाएं जोड़ें या WhatsApp पूछताछ करें।",

    // Google OAuth Chooser
    signInWithGoogle: "Google के साथ साइन इन करें",
    chooseAccount: "एक खाता चुनें",
    continueTo: "जारी रखने के लिए:",
    useAnotherAccount: "दूसरे खाते का उपयोग करें",
    privacyNotice: "इस ऐप का उपयोग करने से पहले, आप MediLink की गोपनीयता नीति और सेवा की शर्तों की समीक्षा कर सकते हैं।",

    // Dashboard & Stats
    recentItems: "हाल ही में देखे गए",
    noRecent: "कोई हालिया रिकॉर्ड नहीं",
    searchPlaceholder: "दवाइयां, ग्राहक, बिल खोजें...",
    allBranches: "सभी शाखाएं",
    totalSales: "कुल बिक्री",
    grossProfit: "सकल लाभ",
    activeBatches: "सक्रिय बैच",
    lowStock: "कम स्टॉक",
    nearExpiry: "शीघ्र समाप्त होने वाला",
    expired: "समाप्त",
    pendingReservations: "लंबित आरक्षण",
    checkSafety: "उपलब्धता जांचें",
    medibotTitle: "मेडीबॉट एआई सहायक",
    medibotSubtitle: "फार्मेसी एवं स्टॉक असिस्टेंट",
    askQuestion: "दवाओं, स्टॉक के बारे में पूछें...",

    // Statuses
    pending: "लंबित",
    reserved: "आरक्षित",
    collected: "प्राप्त किया",
    cancelled: "रद्द",
  },

  es: {
    // Nav & System
    dashboard: "Panel de Control",
    users: "Usuarios",
    branches: "Sucursales",
    medicines: "Medicamentos",
    categories: "Categorías",
    batches: "Lotes de Medicamentos",
    suppliers: "Proveedores",
    purchases: "Compras",
    sales: "Ventas y Facturación",
    prescriptions: "Recetas Médicas",
    customers: "Clientes",
    reservations: "Reservas",
    availability: "Disponibilidad",
    partners: "Farmacias Asociadas",
    reports: "Informes",
    notifications: "Notificaciones",
    settings: "Configuración",
    apiAccess: "Acceso API",
    adminConsole: "Consola de Administrador",
    quickDemoLogin: "LOGIN DE PRUEBA (5+ USUARIOS)",
    signInWorkspace: "Inicie sesión en su espacio",
    enterCredentials: "Ingrese sus credenciales o seleccione una cuenta verificada.",
    continueGoogle: "Continuar con Google",
    continueGithub: "Continuar con GitHub",
    logout: "Cerrar Sesión",
    clearRecent: "Borrar Recientes",
    copyApiKey: "Copiar Clave API",
    viewAllNotifications: "Ver todas las notificaciones",
    markAllRead: "Marcar todas como leídas",
    activeStatus: "Activo",
    inactiveStatus: "Inactivo",

    // Common Actions
    create: "Crear",
    add: "Agregar",
    edit: "Editar",
    delete: "Eliminar",
    save: "Guardar",
    saveChanges: "Guardar Cambios",
    cancel: "Cancelar",
    close: "Cerrar",
    confirm: "Confirmar",
    collect: "Entregar",
    search: "Buscar",
    filter: "Filtrar",
    refresh: "Actualizar",
    actions: "Acciones",
    view: "Ver",
    sendSms: "Enviar WhatsApp",
    sendWhatsApp: "Enviar WhatsApp",
    send: "Enviar",

    // Common Labels
    customer: "Cliente",
    customerName: "Nombre del Cliente",
    phone: "Teléfono",
    phoneNumber: "Número de Teléfono",
    customerPhone: "Teléfono del Cliente",
    medicine: "Medicamento",
    medicineName: "Nombre del Medicamento",
    quantity: "Cantidad",
    branch: "Sucursal",
    status: "Estado",
    price: "Precio",
    stock: "Inventario",
    available: "Disponible",
    availableStock: "Stock Disponible",
    batch: "Lote",
    batchNumber: "Número de Lote",
    generic: "Nombre Genérico",
    expiry: "Fecha de Vencimiento",
    expiresOn: "Vence el",
    date: "Fecha",
    bookingDate: "Fecha de Reserva",
    notes: "Notas",
    total: "Total",
    grandTotal: "Total General",

    // Reservations & Queue
    reservationId: "ID de Reserva",
    reservedMedicine: "Medicamento Reservado",
    stockArrived: "Stock Recibido",
    notifyQueue: "Notificar Cola vía WhatsApp",
    stockQueueTitle: "Stock Recibido · Notificador WhatsApp en Cola",
    availableUnits: "Unidades Disponibles Recibidas",
    fifoOrderNotice: "Los clientes recibirán WhatsApp estrictamente según el orden de tiempo de reserva.",
    deleteReservationConfirm: "¿Está seguro de eliminar esta reserva?",

    // Partners
    partnerShopsTitle: "Farmacias Asociadas y Disponibilidad",
    availableMedicinesAt: "Medicamentos disponibles en",
    addMedicineStock: "+ Agregar Stock de Medicamentos",
    sendSmsInquiry: "Enviar Consulta WhatsApp a la Farmacia",
    sendWhatsAppInquiry: "Enviar Consulta WhatsApp a la Farmacia",
    inquireViaSms: "Consulta WhatsApp",
    shopInventorySubtitle: "Explore la disponibilidad por farmacia, agregue stock o consulte vía WhatsApp.",

    // Google OAuth Chooser
    signInWithGoogle: "Iniciar sesión con Google",
    chooseAccount: "Elegir una cuenta",
    continueTo: "para continuar a",
    useAnotherAccount: "Usar otra cuenta",
    privacyNotice: "Antes de usar esta aplicación, puede revisar la Política de privacidad y los Términos de servicio de MediLink.",

    // Dashboard & Stats
    recentItems: "Vistos Recientemente",
    noRecent: "No hay registros recientes aún",
    searchPlaceholder: "Buscar medicamentos, clientes, facturas...",
    allBranches: "Todas las Sucursales",
    totalSales: "Ventas Totales",
    grossProfit: "Beneficio Bruto",
    activeBatches: "Lotes Activos",
    lowStock: "Bajo Stock",
    nearExpiry: "Por Vencer",
    expired: "Vencido",
    pendingReservations: "Reservas Pendientes",
    checkSafety: "Verificar Disponibilidad",
    medibotTitle: "Asistente AI MediBot",
    medibotSubtitle: "Asistente de Farmacia e Inventario",
    askQuestion: "Pregunte sobre medicamentos, stock...",

    // Statuses
    pending: "Pendiente",
    reserved: "Reservado",
    collected: "Entregado",
    cancelled: "Cancelado",
  },
};

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸", short: "EN" },
  { code: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳", short: "தமிழ்" },
  { code: "hi", label: "हिंदी (Hindi)", flag: "🇮🇳", short: "हिंदी" },
  { code: "te", label: "తెలుగు (Telugu)", flag: "🇮🇳", short: "తెలుగు" },
  { code: "ml", label: "മലയാളം (Malayalam)", flag: "🇮🇳", short: "മലയാളം" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳", short: "ಕನ್ನಡ" },
  { code: "es", label: "Español (Spanish)", flag: "🇪🇸", short: "ES" },
  { code: "fr", label: "Français (French)", flag: "🇫🇷", short: "FR" },
  { code: "de", label: "Deutsch (German)", flag: "🇩🇪", short: "DE" },
  { code: "ar", label: "العربية (Arabic)", flag: "🇸🇦", short: "AR" },
];

function applyGoogleTranslate(code) {
  if (typeof document === "undefined") return;

  const hostname = window.location.hostname;
  const isEnglish = code === "en";

  if (isEnglish) {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${hostname}; path=/;`;
    document.cookie = "googtrans=/auto/en; path=/;";
  } else {
    document.cookie = `googtrans=/en/${code}; path=/;`;
    document.cookie = `googtrans=/auto/${code}; path=/;`;
    document.cookie = `googtrans=/en/${code}; domain=${hostname}; path=/;`;
    document.cookie = `googtrans=/auto/${code}; domain=${hostname}; path=/;`;
  }

  // Find and trigger Google Translate combo dropdown
  const fireChange = () => {
    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    return false;
  };

  if (!fireChange()) {
    const retryDelays = [200, 500, 1000, 2000, 3000];
    retryDelays.forEach((delay) => {
      setTimeout(() => {
        fireChange();
      }, delay);
    });
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem("medilink.lang") || "en";
  });
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("medilink.lang") || "en";
    if (saved && saved !== "en") {
      applyGoogleTranslate(saved);
    }
  }, []);

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem("medilink.lang", code);
    setTranslating(true);
    applyGoogleTranslate(code);
    setTimeout(() => setTranslating(false), 1200);
  };

  const t = (key, fallback = "") => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES, translating }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => {},
      t: (k, fb) => fb || k,
      languages: LANGUAGES,
      translating: false,
    };
  }
  return ctx;
}

