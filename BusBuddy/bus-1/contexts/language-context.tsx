"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'hi'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  en: {
    // Common
    'common.busbuddy': 'BusBuddy',
    'common.smartTransitCompanion': 'Smart Transit Companion',
    'common.login': 'Login',
    'common.signup': 'Sign Up',
    'common.logout': 'Logout',
    'common.back': 'Back',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.comingSoon': 'Coming Soon',
    'common.required': 'Required',
    'common.optional': 'Optional',

    // Landing Page
    'landing.hero.title': 'Track. Connect. Travel Smart.',
    'landing.hero.subtitle': 'Your all-in-one solution for bus tracking, route planning, and seamless urban transportation.',
    'landing.courierTracking.title': 'Courier Tracking Service',
    'landing.courierTracking.description': 'Track your packages and deliveries with real-time location updates',
    'landing.courierTracking.action': 'Track Package',
    'landing.institution.title': 'Register Your Organization',
    'landing.institution.description': 'Connect your organization to our transportation network',
    'landing.institution.action': 'Get Started',
    'landing.institution.manageTitle': 'Manage Your Organization',
    'landing.institution.manageDescription': 'Access your organization dashboard and manage your fleet',
    'landing.institution.manageAction': 'Go to Dashboard',
    'landing.cityBus.title': 'Track City Bus Routes',
    'landing.cityBus.description': 'Real-time updates for public transportation and route optimization',
    'landing.cityBus.action': 'Explore Routes',

    // Auth Page
    'auth.welcomeBack': 'Welcome back',
    'auth.loginToContinue': 'Login to your account to continue',
    'auth.createAccount': 'Create your account',
    'auth.signupToStart': 'Sign up to get started with BusBuddy',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.enterEmail': 'Enter your email',
    'auth.enterPassword': 'Enter your password',
    'auth.loginButton': 'Login',
    'auth.signupButton': 'Sign Up',
    'auth.switchToSignup': 'Don\'t have an account? Sign up',
    'auth.switchToLogin': 'Already have an account? Login',

    // Passenger Page
    'passenger.dashboard': 'Passenger Dashboard',
    'passenger.findBus': 'Find Your Bus',
    'passenger.findYourBus': 'Find Your Bus',
    'passenger.tracking': 'Tracking',
    'passenger.smartTransitSearch': 'Smart Transit Search',
    'passenger.realTimeTracking': 'Real-time Tracking',
    'passenger.smartBusSearch': 'Smart Bus Search',
    'passenger.findBusesBetweenStops': 'Find buses between any two stops',
    'passenger.recentSearches': 'Recent Searches',
    'passenger.quickAccessPreviousRoutes': 'Quick access to your previous routes',
    'passenger.liveBusTracking': 'Live Bus Tracking',
    'passenger.realTimeLocationUpdates': 'Real-time location and updates',
    'passenger.mapView': 'Map View',
    'passenger.listView': 'List',
    'passenger.busBuddyPassenger': 'BusBuddy Passenger',
    'passenger.preparingJourneySearch': 'Preparing your journey search...',
    'passenger.trackingView': 'Bus Tracking View',
    
    // Search Form
    'passenger.fromStartStop': 'From (Start Stop)',
    'passenger.enterStartStop': 'Enter start stop name',
    'passenger.toDestinationStop': 'To (Destination Stop)',
    'passenger.enterDestinationStop': 'Enter destination stop name',
    'passenger.searchingRoutes': 'Searching Routes...',
    'passenger.findMyBus': 'Find My Bus',
    'passenger.missingInformation': 'Missing information',
    'passenger.enterBothStops': 'Please enter both start and end stops',
    'passenger.noBusesFound': 'No buses found',
    'passenger.noBusesFoundDesc': 'No buses found from {from} to {to}',
    'passenger.searchFailed': 'Search failed',
    'passenger.searchFailedDesc': 'Unable to search for buses. Please try again.',
    
    // Search Results
    'passenger.availableRoutes': 'Available Routes ({count})',
    'passenger.searchResults': 'Search Results',
    'passenger.availableBuses': 'Available Buses',
    'passenger.loadingResults': 'Loading search results...',
    'passenger.backToSearch': 'Back to Search',
    'passenger.routeFrom': 'from',
    'passenger.routeTo': 'to',
    'passenger.tapBusToTrack': 'Tap on any bus to start live tracking',
    'passenger.phone': 'Phone',
    'passenger.quality': 'Match Quality',
    'passenger.online': 'Online',
    'passenger.offline': 'Offline',
    'passenger.driver': 'Driver',
    'passenger.stops': 'stops',
    'passenger.tapToTrackLive': 'Tap to track live',
    'passenger.trackBus': 'Track Bus',
    
    // Bus Tracking
    'passenger.connected': 'Connected',
    'passenger.disconnected': 'Disconnected',
    'passenger.live': 'Live',
    'passenger.lastUpdate': 'Last update',
    'passenger.connectionLost': 'Connection Lost',
    'passenger.reconnecting': 'Trying to reconnect to live updates...',
    'passenger.liveTelemetry': 'Live Telemetry',
    'passenger.realTimeVehicleData': 'Real-time vehicle data',
    'passenger.broadcastingLive': 'Broadcasting Live',
    'passenger.currentSpeed': 'Current Speed (km/h)',
    'passenger.compassHeading': 'Compass Heading',  
    'passenger.connectedPassengers': 'Connected Passengers',
    'passenger.gpsCoordinates': 'GPS Coordinates',
    'passenger.lastUpdated': 'Last Updated',
    'passenger.busTimeline': 'Bus Timeline',
    'passenger.connectingLiveUpdates': 'Connecting to Live Updates',
    'passenger.establishingConnection': 'Establishing connection with the bus tracking system...',
    'passenger.stableInternetConnection': 'Make sure you have a stable internet connection',
    
    // Bus Timeline Status
    'passenger.departed': 'Departed',
    'passenger.arrivingNow': 'Arriving Now',
    'passenger.arriving': 'Arriving',
    'passenger.start': 'Start',
    
    // Recent Searches
    'passenger.dayAgo': '{days} day ago',
    'passenger.daysAgo': '{days} days ago', 
    'passenger.hourAgo': '{hours} hour ago',
    'passenger.hoursAgo': '{hours} hours ago',
    'passenger.justNow': 'Just now',

    // QR Code
    'qr.shareTrackingLink': 'Share Live Bus Tracking',
    'qr.scanToTrack': 'Scan this QR code to track this bus live on any device',
    'qr.trackingLink': 'Tracking Link',
    'qr.linkCopied': 'Link Copied!',
    'qr.linkCopiedDesc': 'Tracking link has been copied to clipboard',
    'qr.copyFailed': 'Failed to copy link to clipboard',
    'qr.copyLink': 'Copy Link',
    'qr.download': 'Download',
    'qr.share': 'Share',
    'qr.shareDesc': 'Track this bus live',
    'qr.shareQRCode': 'Share QR Code',
    'qr.copyImage': 'Copy Image',
    'qr.downloadImage': 'Download Image',
    'qr.imageCopied': 'QR Image Copied!',
    'qr.imageCopiedDesc': 'QR code image has been copied to clipboard',
    'qr.copyImageFailed': 'Failed to copy QR image',
    'qr.downloaded': 'Downloaded!',
    'qr.downloadedDesc': 'QR code image has been downloaded',

    // AI Chatbot
    'chatbot.title': 'AI Assistant',
    'chatbot.welcome': 'Hello! I\'m your BusBuddy AI assistant. Tell me where you want to go by saying something like "I want to go from Central Station to Airport" and I\'ll help you find buses!',
    'chatbot.tapToSpeak': 'Tap the microphone to speak',
    'chatbot.recording': 'Recording... Speak now',
    'chatbot.processing': 'Processing your audio...',
    'chatbot.transcribing': '🎤 Transcribing audio...',
    'chatbot.errorResponse': 'Sorry, I encountered an error. Please try again.',
    'chatbot.microphoneError': 'Could not access microphone',
    'chatbot.transcriptionError': 'Failed to transcribe audio',
    'chatbot.audioError': 'Error processing audio',
    'chatbot.routeFound': 'Great! I found your route',
    'chatbot.searchingBuses': 'Let me search for available buses on this route...',
    'chatbot.routeUnclear': 'I heard what you said, but I couldn\'t clearly identify the source and destination.',
    'chatbot.pleaseSpecify': 'Please try again and clearly mention where you want to go FROM and TO.',
    'chatbot.detectedLanguage': 'Detected language',
    'chatbot.noBusesAvailable': 'Sorry, no buses are currently available for this route.',
    'chatbot.tryDifferentRoute': 'Please try a different route or check back later.',
    'chatbot.busesFound': 'Found {count}',
    'chatbot.bus': 'bus',
    'chatbot.buses': 'buses',
    'chatbot.tapBusNumber': 'You can tap on any bus number to view live tracking!',
    'chatbot.redirectingToResults': 'Taking you to search results...',

    // Driver Page
    'driver.dashboard': 'Driver Dashboard',
    'driver.busInfo': 'Bus Information',
    'driver.tripControls': 'Trip Controls',
    'driver.startTrip': 'Start Trip',
    'driver.endTrip': 'End Trip',
    'driver.loadingDashboard': 'Loading Dashboard',
    'driver.initializingControls': 'Initializing driver controls...',
    'driver.busCommandCenter': 'Bus Command Center',
    'driver.professionalTransitControl': 'Professional Transit Control System',
    'driver.systemStatus': 'System Status',
    'driver.online': 'Online',
    'driver.passengers': 'Passengers',
    'driver.gpsStatus': 'GPS Status',
    'driver.active': 'Active',
    'driver.tripTime': 'Trip Time',
    'driver.driverProfile': 'Driver Profile',
    'driver.missionControl': 'Mission Control',
    'driver.systemDiagnostics': 'System Diagnostics',

    // Organization Registration
    'institution.title': 'Organization Registration',
    'institution.subtitle': 'Register your organization or business with BusBuddy',
    'institution.email': 'Email Address',
    'institution.password': 'Password',
    'institution.orgName': 'Organization Name',
    'institution.phone': 'Phone Number',
    'institution.state': 'State',
    'institution.city': 'City/Town/Village',
    'institution.location': 'Location',
    'institution.website': 'Website URL',
    'institution.enterEmail': 'Enter organization email',
    'institution.createPassword': 'Create a secure password',
    'institution.enterOrgName': 'Enter your organization name',
    'institution.enterPhone': 'Enter contact number',
    'institution.selectState': 'Select your state',
    'institution.searchCity': 'Search cities in',
    'institution.selectStateFirst': 'Please select a state first',
    'institution.enterWebsite': 'https://your-organization-website.com',
    'institution.fetchLocation': 'Fetch Current Location',
    'institution.locationFetched': 'Location Fetched',
    'institution.fetchingLocation': 'Fetching Location...',
    'institution.registerButton': 'Register Organization',
    'institution.submittingRegistration': 'Submitting Registration...',
    'institution.missingInfo': 'Missing Information',
    'institution.fillRequired': 'Please fill in all required fields',
    'institution.registrationSuccess': 'Registration Successful',
    'institution.registrationSuccessDesc': 'Your organization has been registered successfully!',
    'institution.registrationFailed': 'Registration Failed',
    'institution.registrationFailedDesc': 'An error occurred during registration. Please try again.',
    'institution.authRequired': 'Authentication Required',
    'institution.pleaseLogin': 'Please login to register your organization.',

    // Bus Search
    'busSearch.from': 'From',
    'busSearch.to': 'To',
    'busSearch.enterDeparture': 'Enter departure location',
    'busSearch.enterDestination': 'Enter destination',
    'busSearch.swap': 'Swap locations',
    'busSearch.searchBuses': 'Search Buses',

    // Tracking
    'tracking.busLocation': 'Bus Location',
    'tracking.route': 'Route',
    'tracking.estimatedArrival': 'Estimated Arrival',

    // Language
    'language.select': 'Language',
    'language.english': 'English',
    'language.hindi': 'हिंदी',

    // Location errors
    'location.denied': 'Location access denied. Please enable location permissions.',
    'location.unavailable': 'Location information is unavailable.',
    'location.timeout': 'Location request timed out.',
    'location.failed': 'Failed to get location',

    // Cities search
    'cities.noResults': 'No cities found matching',
    'cities.in': 'in',

    // Landing page additional
    'landing.services.title': 'More Services',
    'landing.services.subtitle': 'Discover additional features to enhance your transportation experience',
    'landing.passenger.title': 'I\'m a Passenger',
    'landing.passenger.subtitle': 'Find & track buses',
    'landing.driver.title': 'I\'m a Driver',
    'landing.driver.subtitle': 'Manage your routes',

    // Contact page
    'contact.title': 'Contact Us',
    'contact.subtitle': 'Get in touch with our team',

    // Demo page  
    'demo.title': 'Demo',
    'demo.subtitle': 'Try out our features',

    // Organization Dashboard
    'organization.dashboard': 'Organization Dashboard',
    'organization.welcome': 'Welcome to Your Organization Dashboard',
    'organization.manageNetwork': 'Manage your transportation network',
    'organization.registrationSuccess': 'Registration successful! Your organization is now part of the BusBuddy network.',
    'organization.fleetManagement': 'Fleet Management',
    'organization.fleetDescription': 'Add and manage your bus fleet, assign drivers, and monitor vehicle status.',
    'organization.routeManagement': 'Route Management',
    'organization.routeDescription': 'Create and manage bus routes, stops, and schedules for your network.',
    'organization.analytics': 'Analytics',
    'organization.analyticsDescription': 'View detailed analytics about your transportation operations and usage.',
    'organization.quickActions': 'Quick Actions',
    'organization.addBus': 'Add Bus',
    'organization.createRoute': 'Create Route',
    'organization.manageDrivers': 'Manage Drivers',
    'organization.settings': 'Settings',
    'organization.activeBuses': 'Active Buses',
    'organization.activeRoutes': 'Active Routes',
    'organization.comingSoon': 'Coming Soon',
    'organization.featuresInDevelopment': 'Dashboard features are being developed',
    'organization.featuresAvailableSoon': 'Fleet management, route creation, and analytics features will be available soon.',

    // General messages
    'messages.featureComingSoon': 'feature will be available soon!',
  },
  hi: {
    // Common
    'common.busbuddy': 'बसबडी',
    'common.smartTransitCompanion': 'स्मार्ट परिवहन साथी',
    'common.login': 'लॉग इन',
    'common.signup': 'साइन अप',
    'common.logout': 'लॉग आउट',
    'common.back': 'वापस',
    'common.submit': 'जमा करें',
    'common.cancel': 'रद्द करें',
    'common.save': 'सेव करें',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.comingSoon': 'जल्द आ रहा है',
    'common.required': 'आवश्यक',
    'common.optional': 'वैकल्पिक',

    // Landing Page
    'landing.hero.title': 'ट्रैक करें। जुड़ें। स्मार्ट यात्रा करें।',
    'landing.hero.subtitle': 'बस ट्रैकिंग, रूट प्लानिंग और सहज शहरी परिवहन के लिए आपका संपूर्ण समाधान।',
    'landing.courierTracking.title': 'कूरियर ट्रैकिंग सेवा',
    'landing.courierTracking.description': 'रियल-टाइम लोकेशन अपडेट के साथ अपने पैकेज और डिलीवरी को ट्रैक करें',
    'landing.courierTracking.action': 'पैकेज ट्रैक करें',
    'landing.institution.title': 'अपने संगठन का पंजीकरण करें',
    'landing.institution.description': 'अपने संगठन को हमारे परिवहन नेटवर्क से जोड़ें',
    'landing.institution.action': 'शुरू करें',
    'landing.institution.manageTitle': 'अपना संगठन प्रबंधित करें',
    'landing.institution.manageDescription': 'अपने संगठन डैशबोर्ड तक पहुंचें और अपने बेड़े का प्रबंधन करें',
    'landing.institution.manageAction': 'डैशबोर्ड पर जाएं',
    'landing.cityBus.title': 'शहरी बस रूट ट्रैक करें',
    'landing.cityBus.description': 'सार्वजनिक परिवहन और रूट अनुकूलन के लिए रियल-टाइम अपडेट',
    'landing.cityBus.action': 'रूट एक्सप्लोर करें',

    // Auth Page
    'auth.welcomeBack': 'वापस स्वागत है',
    'auth.loginToContinue': 'जारी रखने के लिए अपने खाते में लॉगिन करें',
    'auth.createAccount': 'अपना खाता बनाएं',
    'auth.signupToStart': 'BusBuddy के साथ शुरुआत करने के लिए साइन अप करें',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.enterEmail': 'अपना ईमेल दर्ज करें',
    'auth.enterPassword': 'अपना पासवर्ड दर्ज करें',
    'auth.loginButton': 'लॉग इन',
    'auth.signupButton': 'साइन अप',
    'auth.switchToSignup': 'खाता नहीं है? साइन अप करें',
    'auth.switchToLogin': 'पहले से खाता है? लॉगिन करें',

    // Passenger Page
    'passenger.dashboard': 'यात्री डैशबोर्ड',
    'passenger.findBus': 'अपनी बस खोजें',
    'passenger.findYourBus': 'अपनी बस खोजें',
    'passenger.tracking': 'ट्रैकिंग',
    'passenger.smartTransitSearch': 'स्मार्ट ट्रांजिट खोज',
    'passenger.realTimeTracking': 'रियल-टाइम ट्रैकिंग',
    'passenger.smartBusSearch': 'स्मार्ट बस खोज',
    'passenger.findBusesBetweenStops': 'किसी भी दो स्टॉप के बीच बसें खोजें',
    'passenger.recentSearches': 'हाल की खोजें',
    'passenger.quickAccessPreviousRoutes': 'आपके पिछले रूट्स तक त्वरित पहुंच',
    'passenger.liveBusTracking': 'लाइव बस ट्रैकिंग',
    'passenger.realTimeLocationUpdates': 'रियल-टाइम स्थान और अपडेट्स',
    'passenger.mapView': 'मैप व्यू',
    'passenger.listView': 'सूची',
    'passenger.busBuddyPassenger': 'बसबडी यात्री',
    'passenger.preparingJourneySearch': 'आपकी यात्रा खोज तैयार की जा रही है...',
    'passenger.trackingView': 'बस ट्रैकिंग व्यू',
    
    // Search Form
    'passenger.fromStartStop': 'से (प्रारंभिक स्टॉप)',
    'passenger.enterStartStop': 'प्रारंभिक स्टॉप का नाम दर्ज करें',
    'passenger.toDestinationStop': 'तक (गंतव्य स्टॉप)',
    'passenger.enterDestinationStop': 'गंतव्य स्टॉप का नाम दर्ज करें',
    'passenger.searchingRoutes': 'रूट्स खोजी जा रही हैं...',
    'passenger.findMyBus': 'मेरी बस खोजें',
    'passenger.missingInformation': 'अनुपस्थित जानकारी',
    'passenger.enterBothStops': 'कृपया प्रारंभिक और अंतिम दोनों स्टॉप दर्ज करें',
    'passenger.noBusesFound': 'कोई बस नहीं मिली',
    'passenger.noBusesFoundDesc': '{from} से {to} तक कोई बस नहीं मिली',
    'passenger.searchFailed': 'खोज असफल',
    'passenger.searchFailedDesc': 'बसों की खोज करने में असमर्थ। कृपया पुनः प्रयास करें।',
    
    // Search Results
    'passenger.availableRoutes': 'उपलब्ध रूट्स ({count})',
    'passenger.searchResults': 'खोज परिणाम',
    'passenger.availableBuses': 'उपलब्ध बसें',
    'passenger.loadingResults': 'खोज परिणाम लोड हो रहे हैं...',
    'passenger.backToSearch': 'खोज पर वापस जाएं',
    'passenger.routeFrom': 'से',
    'passenger.routeTo': 'तक',
    'passenger.tapBusToTrack': 'लाइव ट्रैकिंग शुरू करने के लिए किसी भी बस पर टैप करें',
    'passenger.phone': 'फोन',
    'passenger.quality': 'मैच गुणवत्ता',
    'passenger.online': 'ऑनलाइन',
    'passenger.offline': 'ऑफलाइन',
    'passenger.driver': 'ड्राइवर',
    'passenger.stops': 'स्टॉप्स',
    'passenger.tapToTrackLive': 'लाइव ट्रैक करने के लिए टैप करें',
    'passenger.trackBus': 'बस ट्रैक करें',
    
    // Bus Tracking
    'passenger.connected': 'कनेक्टेड',
    'passenger.disconnected': 'डिस्कनेक्टेड',
    'passenger.live': 'लाइव',
    'passenger.lastUpdate': 'अंतिम अपडेट',
    'passenger.connectionLost': 'कनेक्शन खो गया',
    'passenger.reconnecting': 'लाइव अपडेट्स से पुनः कनेक्ट करने का प्रयास कर रहे हैं...',
    'passenger.liveTelemetry': 'लाइव टेलीमेट्री',
    'passenger.realTimeVehicleData': 'रियल-टाइम वाहन डेटा',
    'passenger.broadcastingLive': 'लाइव प्रसारण',
    'passenger.currentSpeed': 'वर्तमान गति (किमी/घंटा)',
    'passenger.compassHeading': 'कम्पास दिशा',
    'passenger.connectedPassengers': 'कनेक्टेड यात्री',
    'passenger.gpsCoordinates': 'जीपीएस निर्देशांक',
    'passenger.lastUpdated': 'अंतिम अपडेट',
    'passenger.busTimeline': 'बस टाइमलाइन',
    'passenger.connectingLiveUpdates': 'लाइव अपडेट्स से कनेक्ट हो रहे हैं',
    'passenger.establishingConnection': 'बस ट्रैकिंग सिस्टम के साथ कनेक्शन स्थापित कर रहे हैं...',
    'passenger.stableInternetConnection': 'सुनिश्चित करें कि आपके पास स्थिर इंटरनेट कनेक्शन है',
    
    // Bus Timeline Status
    'passenger.departed': 'प्रस्थान किया',
    'passenger.arrivingNow': 'अब पहुंच रहा है',
    'passenger.arriving': 'पहुंच रहा है',
    'passenger.start': 'प्रारंभ',
    
    // Recent Searches Time
    'passenger.dayAgo': '{days} दिन पहले',
    'passenger.daysAgo': '{days} दिन पहले', 
    'passenger.hourAgo': '{hours} घंटे पहले',
    'passenger.hoursAgo': '{hours} घंटे पहले',
    'passenger.justNow': 'अभी',

    // QR Code
    'qr.shareTrackingLink': 'लाइव बस ट्रैकिंग शेयर करें',
    'qr.scanToTrack': 'इस बस को किसी भी डिवाइस पर लाइव ट्रैक करने के लिए इस QR कोड को स्कैन करें',
    'qr.trackingLink': 'ट्रैकिंग लिंक',
    'qr.linkCopied': 'लिंक कॉपी हो गया!',
    'qr.linkCopiedDesc': 'ट्रैकिंग लिंक क्लिपबोर्ड में कॉपी हो गया है',
    'qr.copyFailed': 'लिंक को क्लिपबोर्ड में कॉपी करने में असफल',
    'qr.copyLink': 'लिंक कॉपी करें',
    'qr.download': 'डाउनलोड',
    'qr.share': 'शेयर करें',
    'qr.shareDesc': 'इस बस को लाइव ट्रैक करें',
    'qr.shareQRCode': 'QR कोड शेयर करें',
    'qr.copyImage': 'इमेज कॉपी करें',
    'qr.downloadImage': 'इमेज डाउनलोड करें',
    'qr.imageCopied': 'QR इमेज कॉपी हो गई!',
    'qr.imageCopiedDesc': 'QR कोड इमेज क्लिपबोर्ड में कॉपी हो गई है',
    'qr.copyImageFailed': 'QR इमेज कॉपी करने में असफल',
    'qr.downloaded': 'डाउनलोड हो गया!',
    'qr.downloadedDesc': 'QR कोड इमेज डाउनलोड हो गई है',

    // AI Chatbot
    'chatbot.title': 'AI सहायक',
    'chatbot.welcome': 'नमस्ते! मैं आपका BusBuddy AI सहायक हूँ। मुझे बताएं कि आप कहाँ जाना चाहते हैं, जैसे "मैं सेंट्रल स्टेशन से एयरपोर्ट जाना चाहता हूँ" और मैं आपको बस खोजने में मदद करूंगा!',
    'chatbot.tapToSpeak': 'बोलने के लिए माइक्रोफोन दबाएं',
    'chatbot.recording': 'रिकॉर्डिंग... अब बोलें',
    'chatbot.processing': 'आपका ऑडियो प्रोसेस कर रहा हूँ...',
    'chatbot.transcribing': '🎤 ऑडियो ट्रांस्क्राइब कर रहा हूँ...',
    'chatbot.errorResponse': 'क्षमा करें, मुझे एक त्रुटि का सामना करना पड़ा। कृपया फिर से कोशिश करें।',
    'chatbot.microphoneError': 'माइक्रोफोन तक पहुंच नहीं मिली',
    'chatbot.transcriptionError': 'ऑडियो ट्रांस्क्राइब करने में असफल',
    'chatbot.audioError': 'ऑडियो प्रोसेसिंग में त्रुटि',
    'chatbot.routeFound': 'बहुत बढ़िया! मुझे आपका रूट मिल गया',
    'chatbot.searchingBuses': 'मैं इस रूट पर उपलब्ध बसों की खोज कर रहा हूँ...',
    'chatbot.routeUnclear': 'मैंने आपकी बात सुनी, लेकिन मुझे स्पष्ट रूप से शुरुआती और गंतव्य स्थान की पहचान नहीं हो सकी।',
    'chatbot.pleaseSpecify': 'कृपया फिर से कोशिश करें और स्पष्ट रूप से बताएं कि आप कहाँ से कहाँ जाना चाहते हैं।',
    'chatbot.detectedLanguage': 'पहचानी गई भाषा',
    'chatbot.noBusesAvailable': 'क्षमा करें, इस रूट पर फिलहाल कोई बस उपलब्ध नहीं है।',
    'chatbot.tryDifferentRoute': 'कृपया कोई अलग रूट ट्राई करें या बाद में चेक करें।',
    'chatbot.busesFound': 'मिली {count}',
    'chatbot.bus': 'बस',
    'chatbot.buses': 'बसें',
    'chatbot.tapBusNumber': 'आप किसी भी बस नंबर पर टैप करके लाइव ट्रैकिंग देख सकते हैं!',
    'chatbot.redirectingToResults': 'आपको खोज परिणामों पर ले जा रहा हूँ...',

    // Driver Page
    'driver.dashboard': 'ड्राइवर डैशबोर्ड',
    'driver.busInfo': 'बस की जानकारी',
    'driver.tripControls': 'ट्रिप नियंत्रण',
    'driver.startTrip': 'ट्रिप शुरू करें',
    'driver.endTrip': 'ट्रिप समाप्त करें',
    'driver.loadingTitle': 'बस कमांड सेंटर लोड हो रहा है...',
    'driver.loadingSubtitle': 'कृपया प्रतीक्षा करें जब तक हम आपकी बस की जानकारी लोड करते हैं',
    'driver.commandCenter': 'बस कमांड सेंटर',
    'driver.overview': 'अवलोकन',
    'driver.totalPassengers': 'कुल यात्री',
    'driver.activeRoutes': 'सक्रिय मार्ग',
    'driver.completedTrips': 'पूर्ण यात्राएं',
    'driver.todayEarnings': 'आज की कमाई',
    'driver.manageBus': 'बस प्रबंधन',
    'driver.tripManagement': 'यात्रा प्रबंधन',

    // Organization Registration
    'institution.title': 'संगठन पंजीकरण',
    'institution.subtitle': 'अपने संगठन या व्यवसाय को BusBuddy के साथ पंजीकृत करें',
    'institution.email': 'ईमेल पता',
    'institution.password': 'पासवर्ड',
    'institution.orgName': 'संगठन का नाम',
    'institution.phone': 'फोन नंबर',
    'institution.state': 'राज्य',
    'institution.city': 'शहर/कस्बा/गांव',
    'institution.location': 'स्थान',
    'institution.website': 'वेबसाइट URL',
    'institution.enterEmail': 'संगठन का ईमेल दर्ज करें',
    'institution.createPassword': 'एक सुरक्षित पासवर्ड बनाएं',
    'institution.enterOrgName': 'अपने संगठन का नाम दर्ज करें',
    'institution.enterPhone': 'संपर्क नंबर दर्ज करें',
    'institution.selectState': 'अपना राज्य चुनें',
    'institution.searchCity': 'शहर खोजें',
    'institution.selectStateFirst': 'कृपया पहले राज्य चुनें',
    'institution.enterWebsite': 'https://आपकी-संगठन-वेबसाइट.com',
    'institution.fetchLocation': 'वर्तमान स्थान प्राप्त करें',
    'institution.locationFetched': 'स्थान प्राप्त हुआ',
    'institution.fetchingLocation': 'स्थान प्राप्त कर रहे हैं...',
    'institution.registerButton': 'संगठन पंजीकृत करें',
    'institution.submittingRegistration': 'पंजीकरण जमा कर रहे हैं...',
    'institution.missingInfo': 'जानकारी गुम',
    'institution.fillRequired': 'कृपया सभी आवश्यक फ़ील्ड भरें',
    'institution.registrationSuccess': 'पंजीकरण सफल',
    'institution.registrationSuccessDesc': 'आपका संगठन सफलतापूर्वक पंजीकृत हो गया है!',
    'institution.registrationFailed': 'पंजीकरण असफल',
    'institution.registrationFailedDesc': 'पंजीकरण के दौरान एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
    'institution.authRequired': 'प्रमाणीकरण आवश्यक',
    'institution.pleaseLogin': 'अपना संगठन पंजीकृत करने के लिए कृपया लॉगिन करें।',

    // Bus Search
    'busSearch.from': 'से',
    'busSearch.to': 'तक',
    'busSearch.enterDeparture': 'प्रस्थान स्थान दर्ज करें',
    'busSearch.enterDestination': 'गंतव्य दर्ज करें',
    'busSearch.swap': 'स्थान बदलें',
    'busSearch.searchBuses': 'बस खोजें',

    // Tracking
    'tracking.busLocation': 'बस स्थान',
    'tracking.route': 'रूट',
    'tracking.estimatedArrival': 'अनुमानित आगमन',

    // Language
    'language.select': 'भाषा',
    'language.english': 'English',
    'language.hindi': 'हिंदी',

    // Location errors
    'location.denied': 'स्थान पहुंच अस्वीकृत। कृपया स्थान अनुमतियां सक्षम करें।',
    'location.unavailable': 'स्थान की जानकारी उपलब्ध नहीं है।',
    'location.timeout': 'स्थान अनुरोध का समय समाप्त हुआ।',
    'location.failed': 'स्थान प्राप्त करने में असफल',

    // Cities search
    'cities.noResults': 'कोई शहर नहीं मिला',
    'cities.in': 'में',

    // Landing page additional
    'landing.services.title': 'अधिक सेवाएं',
    'landing.services.subtitle': 'अपने परिवहन अनुभव को बेहतर बनाने के लिए अतिरिक्त सुविधाओं की खोज करें',
    'landing.passenger.title': 'मैं एक यात्री हूं',
    'landing.passenger.subtitle': 'बस खोजें और ट्रैक करें',
    'landing.driver.title': 'मैं एक ड्राइवर हूं',
    'landing.driver.subtitle': 'अपने रूट का प्रबंधन करें',

    // Contact page
    'contact.title': 'संपर्क करें',
    'contact.subtitle': 'हमारी टीम से संपर्क करें',

    // Demo page
    'demo.title': 'डेमो',
    'demo.subtitle': 'हमारी सुविधाओं को आजमाएं',

    // Organization Dashboard
    'organization.dashboard': 'संगठन डैशबोर्ड',
    'organization.welcome': 'आपके संगठन डैशबोर्ड में आपका स्वागत है',
    'organization.manageNetwork': 'अपने परिवहन नेटवर्क का प्रबंधन करें',
    'organization.registrationSuccess': 'पंजीकरण सफल! आपका संगठन अब BusBuddy नेटवर्क का हिस्सा है।',
    'organization.fleetManagement': 'फ्लीट प्रबंधन',
    'organization.fleetDescription': 'अपने बस फ्लीट को जोड़ें और प्रबंधित करें, ड्राइवरों को असाइन करें, और वाहन स्थिति की निगरानी करें।',
    'organization.routeManagement': 'रूट प्रबंधन',
    'organization.routeDescription': 'अपने नेटवर्क के लिए बस रूट, स्टॉप और शेड्यूल बनाएं और प्रबंधित करें।',
    'organization.analytics': 'एनालिटिक्स',
    'organization.analyticsDescription': 'अपने परिवहन संचालन और उपयोग के बारे में विस्तृत एनालिटिक्स देखें।',
    'organization.quickActions': 'त्वरित कार्य',
    'organization.addBus': 'बस जोड़ें',
    'organization.createRoute': 'रूट बनाएं',
    'organization.manageDrivers': 'ड्राइवर प्रबंधन',
    'organization.settings': 'सेटिंग्स',
    'organization.activeBuses': 'सक्रिय बसें',
    'organization.activeRoutes': 'सक्रिय रूट्स',
    'organization.comingSoon': 'जल्द आ रहा है',
    'organization.featuresInDevelopment': 'डैशबोर्ड सुविधाएं विकसित की जा रही हैं',
    'organization.featuresAvailableSoon': 'फ्लीट प्रबंधन, रूट निर्माण और एनालिटिक्स सुविधाएं जल्द उपलब्ध होंगी।',

    // General messages
    'messages.featureComingSoon': 'सुविधा जल्द उपलब्ध होगी!',
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load saved language from localStorage only on client side
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('busbuddy-language') as Language
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
        setLanguage(savedLanguage)
      }
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('busbuddy-language', lang)
    }
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}