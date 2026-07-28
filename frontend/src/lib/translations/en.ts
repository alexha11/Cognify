// ─── English (default) translations ───────────────────────────────────────────

// ── Type definitions (plain interface so all languages can satisfy it) ────────
export interface TranslationKeys {
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    submit: string;
    back: string;
    next: string;
    close: string;
    viewAll: string;
    getStarted: string;
    learnMore: string;
    search: string;
    noDescription: string;
    creating: string;
    saving: string;
    error: string;
    copyright: string;
  };
  nav: {
    dashboard: string;
    courses: string;
    questions: string;
    analytics: string;
    progress: string;
    settings: string;
    contact: string;
    home: string;
    myProfile: string;
    contactSupport: string;
    homepage: string;
    logout: string;
    login: string;
    signup: string;
  };
  header: {
    loginButton: string;
    signupButton: string;
  };
  auth: {
    welcomeBack: string;
    signInToAccount: string;
    signIn: string;
    signUp: string;
    createAccount: string;
    createYourAccount: string;
    getStartedFree: string;
    continueWithGoogle: string;
    orSignInWithEmail: string;
    orSignUpWithEmail: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    forgotPassword: string;
    noAccount: string;
    alreadyHaveAccount: string;
    iAm: string;
    student: string;
    instructor: string;
    backToHome: string;
    passwordHint: string;
    invalidCredentials: string;
    registrationFailed: string;
  };
  dashboard: {
    title: string;
    yourCourses: string;
    newCourse: string;
    courses: string;
    questions: string;
    questionsAnswered: string;
    accuracy: string;
    noCourses: string;
    createCourse: string;
    masterAnySubject: string;
    precision: string;
    cognifyDescription: string;
    getStartedFree: string;
    browseCourses: string;
  };
  courses: {
    title: string;
    manageCourses: string;
    exploreCourses: string;
    newCourse: string;
    createNewCourse: string;
    courseName: string;
    description: string;
    createCourse: string;
    startQuiz: string;
    questions: string;
    materials: string;
    created: string;
    visibility: string;
    public: string;
    private: string;
    publicDesc: string;
    privateDesc: string;
    noCoursesInstructor: string;
    noCoursesStudent: string;
    nameplaceholder: string;
    descPlaceholder: string;
    cancel: string;
    creating: string;
  };
  contact: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    sendMessage: string;
    sendMessageDesc: string;
    yourName: string;
    emailAddress: string;
    whatCanWeHelp: string;
    messageDetails: string;
    messagePlaceholder: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    sendingMessage: string;
    sendMessageBtn: string;
    messageReceived: string;
    thankYou: string;
    yourInquiry: string;
    hasBeenLogged: string;
    asQuicklyAsPossible: string;
    sendAnother: string;
    connectLinkedIn: string;
    linkedInDesc: string;
    reachOutLinkedIn: string;
    categories: {
      technical: string;
      course: string;
      account: string;
      feedback: string;
      other: string;
    };
    fillInFields: string;
    messageSent: string;
    home: string;
  };
  settings: {
    title: string;
    subtitle: string;
    profile: string;
    appearance: string;
    language: string;
    security: string;
    dangerZone: string;
    saveProfile: string;
    updatePassword: string;
    deleteAccount: string;
    deleteAccountDesc: string;
    typeDeleteToConfirm: string;
    emailCannotBeChanged: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    role: string;
    themeTitle: string;
    languageTitle: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    themeAlwaysLight: string;
    themeAlwaysDark: string;
    themeMatchOS: string;
    langEnglish: string;
    langVietnamese: string;
    langFinnish: string;
    langDefault: string;
    langOfficial: string;
    langNordic: string;
    profileUpdated: string;
    profileFailed: string;
    passwordUpdated: string;
    passwordIncorrect: string;
    passwordTooShort: string;
    passwordsNoMatch: string;
    passwordStrong: string;
    passwordGood: string;
    passwordAcceptable: string;
    passwordTooShortLabel: string;
    administrator: string;
    roleDescriptions: {
      ADMIN: string;
      INSTRUCTOR: string;
      STUDENT: string;
    };
  };
  progress: {
    title: string;
    subtitle: string;
    synthesisVolume: string;
    synthesisDesc: string;
    accuracyThreshold: string;
    accuracyDesc: string;
    successfulIdentifications: string;
    successDesc: string;
    courseMastery: string;
    recentActivity: string;
    noCoursesYet: string;
    noRecentActivity: string;
    identifyCourses: string;
    resumeSession: string;
    mastery: string;
    unitsValidated: string;
    progression: string;
    validated: string;
    incorrect: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    courses: string;
    questions: string;
    materials: string;
    avgCompletion: string;
    assessmentMetrics: string;
    totalAttempts: string;
    assessmentsRecorded: string;
    correctAnswers: string;
    validatedResponses: string;
    accuracyRate: string;
    overallPerformance: string;
    bestPerforming: string;
    needsAttention: string;
    coursesBelow: string;
    coursePerformance: string;
    completion: string;
    accuracy: string;
    noCoursesToAnalyze: string;
    mastered: string;
    inProgress: string;
    needsWork: string;
    notStarted: string;
  };
  quiz: {
    checkAnswer: string;
    nextQuestion: string;
    hint: string;
    correct: string;
    incorrect: string;
    quizComplete: string;
    score: string;
    retake: string;
    backToCourses: string;
  };
  home: {
    heroTitle: string;
    heroHighlight: string;
    heroSubtitle: string;
    heroSub1: string;
    heroSubHighlight1: string;
    heroSub2: string;
    heroSubHighlight2: string;
    getStarted: string;
    featuresTitle: string;
    featuresHighlight: string;
    featuresSubtitle: string;
    tabAll: string;
    tabAi: string;
    tabEngine: string;
    tabDocs: string;
    tabQuiz: string;
    aiTitle: string;
    aiDesc: string;
    aiLink: string;
    engineTitle: string;
    engineDesc: string;
    engineLink: string;
    docsTitle: string;
    docsDesc: string;
    docsLink: string;
    quizTitle: string;
    quizDesc: string;
    quizLink: string;
    everythingTitle: string;
    everythingHighlight: string;
    everythingSubtitle: string;
    cap1Title: string;
    cap1Desc: string;
    cap2Title: string;
    cap2Desc: string;
    cap3Title: string;
    cap3Desc: string;
    cap4Title: string;
    cap4Desc: string;
    cap5Title: string;
    cap5Desc: string;
    cap6Title: string;
    cap6Desc: string;
    ctaTitle: string;
    ctaHighlight: string;
    contactUs: string;
    footerCourses: string;
    footerContact: string;
  };
}

// ── English values ────────────────────────────────────────────────────────────
export const en: TranslationKeys = {
  // ── Common ──────────────────────────────────────────────────────────────────
  common: {
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    submit: "Submit",
    back: "Back",
    next: "Next",
    close: "Close",
    viewAll: "View all",
    getStarted: "Get started",
    learnMore: "Learn more",
    search: "Search",
    noDescription: "No description yet.",
    creating: "Creating...",
    saving: "Saving...",
    error: "Something went wrong. Please try again.",
    copyright: "© 2026 Cognify. All rights reserved.",
  },

  // ── Navigation / Sidebar ─────────────────────────────────────────────────────
  nav: {
    dashboard: "Dashboard",
    courses: "Courses",
    questions: "Questions",
    analytics: "Analytics",
    progress: "My Progress",
    settings: "Settings",
    contact: "Contact Us",
    home: "Home",
    myProfile: "My Profile",
    contactSupport: "Contact Support",
    homepage: "Homepage",
    logout: "Log out",
    login: "Log in",
    signup: "Sign up",
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    loginButton: "Log in",
    signupButton: "Sign up",
  },

  // ── Auth ─────────────────────────────────────────────────────────────────────
  auth: {
    welcomeBack: "Welcome back",
    signInToAccount: "Sign in to your account",
    signIn: "Sign in",
    signUp: "Sign up",
    createAccount: "Create account",
    createYourAccount: "Create your account",
    getStartedFree: "Get started with Cognify for free",
    continueWithGoogle: "Continue with Google",
    orSignInWithEmail: "or sign in with email",
    orSignUpWithEmail: "or sign up with email",
    email: "Email",
    password: "Password",
    firstName: "First name",
    lastName: "Last name",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    iAm: "I am a",
    student: "Student",
    instructor: "Instructor",
    backToHome: "Back to home",
    passwordHint: "Min. 8 characters, one uppercase letter and one number",
    invalidCredentials: "Invalid credentials",
    registrationFailed: "Registration failed",
  },

  // ── Dashboard ────────────────────────────────────────────────────────────────
  dashboard: {
    title: "Dashboard",
    yourCourses: "Your courses",
    newCourse: "New Course",
    courses: "Courses",
    questions: "Questions",
    questionsAnswered: "Questions answered",
    accuracy: "Accuracy",
    noCourses: "No courses yet.",
    createCourse: "Create a course",
    masterAnySubject: "Master any subject with",
    precision: "precision.",
    cognifyDescription:
      "Cognify synthesizes personalized assessments, providing data-driven trajectory for students and educators.",
    getStartedFree: "Get started free",
    browseCourses: "Browse courses",
  },

  // ── Courses ──────────────────────────────────────────────────────────────────
  courses: {
    title: "Courses",
    manageCourses: "Manage your course",
    exploreCourses: "Explore available courses",
    newCourse: "New Course",
    createNewCourse: "Create new course",
    courseName: "Course name",
    description: "Description (optional)",
    createCourse: "Create course",
    startQuiz: "Start Quiz",
    questions: "questions",
    materials: "materials",
    created: "Created",
    visibility: "Visibility",
    public: "Public",
    private: "Private",
    publicDesc: "Public — everyone can see this course",
    privateDesc: "Private — only you can access this course",
    noCoursesInstructor: "Begin by creating your first educational courses.",
    noCoursesStudent: "Check back later for newly published courses.",
    nameplaceholder: "e.g., Foundations of AI",
    descPlaceholder: "A brief overview of the course content...",
    cancel: "Cancel",
    creating: "Creating...",
  },

  // ── Contact ──────────────────────────────────────────────────────────────────
  contact: {
    badge: "Student Support & Feedback",
    title: "We're here to",
    titleHighlight: "help.",
    subtitle:
      "Have a question about Cognify, encountering a technical issue, or want to connect? Reach out using the form below or connect directly via LinkedIn.",
    sendMessage: "Send a Message",
    sendMessageDesc: "Fill in the details and we'll reply directly to your email.",
    yourName: "Your Name",
    emailAddress: "Email Address",
    whatCanWeHelp: "What can we help you with?",
    messageDetails: "Message Details",
    messagePlaceholder: "Describe your question, bug details, or feedback here...",
    namePlaceholder: "Jane Doe",
    emailPlaceholder: "jane@student.edu",
    sendingMessage: "Sending message...",
    sendMessageBtn: "Send Message",
    messageReceived: "Message Received!",
    thankYou: "Thank you for contacting us,",
    yourInquiry: "Your inquiry regarding",
    hasBeenLogged: "has been logged. We'll reply to",
    asQuicklyAsPossible: "as quickly as possible.",
    sendAnother: "Send Another Message",
    connectLinkedIn: "Connect on LinkedIn",
    linkedInDesc:
      "Prefer direct networking or messaging? Connect directly on LinkedIn for quick responses, course guidance, or career discussions.",
    reachOutLinkedIn: "Reach out on LinkedIn",
    categories: {
      technical: "Technical Issue",
      course: "Course & Quiz Help",
      account: "Account & Access",
      feedback: "Feature Request",
      other: "Other Inquiry",
    },
    fillInFields: "Please fill in your name, email, and message before submitting.",
    messageSent: "Message sent! We have received your support request.",
    home: "Home",
  },

  // ── Settings ─────────────────────────────────────────────────────────────────
  settings: {
    title: "Settings",
    subtitle: "Manage your account, preferences, and security.",
    profile: "Profile",
    appearance: "Appearance",
    language: "Language",
    security: "Security",
    dangerZone: "Danger zone",
    saveProfile: "Save profile",
    updatePassword: "Update password",
    deleteAccount: "Delete account",
    deleteAccountDesc:
      "Permanently deletes your account and all associated data. This action cannot be undone.",
    typeDeleteToConfirm: "Type DELETE to confirm",
    emailCannotBeChanged: "Email cannot be changed. Contact support if needed.",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    firstName: "First name",
    lastName: "Last name",
    emailAddress: "Email address",
    role: "Role",
    themeTitle: "Choose how Cognify looks to you. Select a theme or follow your system setting.",
    languageTitle: "Choose your preferred language for the interface.",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    themeAlwaysLight: "Always light",
    themeAlwaysDark: "Always dark",
    themeMatchOS: "Match OS",
    langEnglish: "English",
    langVietnamese: "Vietnamese",
    langFinnish: "Finnish",
    langDefault: "Default",
    langOfficial: "Official",
    langNordic: "Nordic",
    profileUpdated: "Profile updated successfully.",
    profileFailed: "Failed to save profile. Please try again.",
    passwordUpdated: "Password updated successfully.",
    passwordIncorrect: "Current password is incorrect or update failed.",
    passwordTooShort: "Password must be at least 8 characters.",
    passwordsNoMatch: "Passwords do not match.",
    passwordStrong: "Strong password",
    passwordGood: "Good password",
    passwordAcceptable: "Acceptable password",
    passwordTooShortLabel: "Password too short",
    administrator: "Administrator",
    roleDescriptions: {
      ADMIN: "Full platform access, manage all courses and users.",
      INSTRUCTOR: "Create and manage courses, generate questions.",
      STUDENT: "Access courses and track your learning progress.",
    },
  },

  // ── Progress ──────────────────────────────────────────────────────────────────
  progress: {
    title: "Learning Progress",
    subtitle: "Monitor your progress and get valuable insights.",
    synthesisVolume: "Synthesis Volume",
    synthesisDesc: "Total items processed",
    accuracyThreshold: "Accuracy Threshold",
    accuracyDesc: "Precision of your assessments",
    successfulIdentifications: "Successful Identifications",
    successDesc: "Verifiable correct responses",
    courseMastery: "Course Mastery",
    recentActivity: "Recent Activity",
    noCoursesYet: "No courses identified in your profile yet.",
    noRecentActivity: "No recent activity found in your learning logs.",
    identifyCourses: "Identify courses",
    resumeSession: "Resume session",
    mastery: "Mastery",
    unitsValidated: "units validated",
    progression: "Progression",
    validated: "Validated",
    incorrect: "Incorrect",
  },

  // ── Analytics ─────────────────────────────────────────────────────────────────
  analytics: {
    title: "Analytics",
    subtitle: "Platform performance metrics and learning progress.",
    courses: "Courses",
    questions: "Questions",
    materials: "Materials",
    avgCompletion: "Avg. completion",
    assessmentMetrics: "Assessment metrics",
    totalAttempts: "Total attempts",
    assessmentsRecorded: "Assessments recorded",
    correctAnswers: "Correct answers",
    validatedResponses: "Validated responses",
    accuracyRate: "Accuracy rate",
    overallPerformance: "Overall performance",
    bestPerforming: "Best performing",
    needsAttention: "Needs attention",
    coursesBelow: "courses below threshold",
    coursePerformance: "Course performance",
    completion: "Completion",
    accuracy: "Accuracy",
    noCoursesToAnalyze: "No courses to analyze yet.",
    mastered: "Mastered",
    inProgress: "In progress",
    needsWork: "Needs work",
    notStarted: "Not started",
  },

  // ── Quiz ──────────────────────────────────────────────────────────────────────
  quiz: {
    checkAnswer: "Check Answer",
    nextQuestion: "Next Question",
    hint: "Hint",
    correct: "Correct!",
    incorrect: "Incorrect",
    quizComplete: "Quiz Complete",
    score: "Score",
    retake: "Retake",
    backToCourses: "Back to courses",
  },

  // ── Home page ─────────────────────────────────────────────────────────────────
  home: {
    heroTitle: "Enable real",
    heroHighlight: "learning.",
    heroSubtitle:
      "Cognify turns your learning materials into smart assessments, giving students and instructors actionable insights.",
    heroSub1: "Cognify turns your learning materials into",
    heroSubHighlight1: "smart assessments",
    heroSub2: ", giving students and instructors",
    heroSubHighlight2: "actionable insights",
    getStarted: "Get Started",
    featuresTitle: "Elevate your learning,",
    featuresHighlight: "the smart way.",
    featuresSubtitle:
      "Straightforward analytics, AI generation, and powerful management tools designed for educators and students.",
    tabAll: "All",
    tabAi: "AI Generation",
    tabEngine: "Assessment Engine",
    tabDocs: "Smart Processing",
    tabQuiz: "Quiz Experience",
    aiTitle: "AI-Powered Question Generation",
    aiDesc:
      "Instantly convert your course materials into high-quality assessments. Full control over question types, difficulty levels, and automatic grading with just a click.",
    aiLink: "Explore generation",
    engineTitle: "Modern Assessment Engine",
    engineDesc:
      "An intuitive engine that makes it easy for anyone to create and manage questions across all difficulty levels. Monitor student engagement with real-time analytics.",
    engineLink: "View analytics",
    docsTitle: "Smart Document Processing",
    docsDesc:
      "Upload your course materials in any format. Our system automatically processes, chunks, and creates semantic embeddings to ensure the AI understands every detail.",
    docsLink: "Upload materials",
    quizTitle: "Interactive Quiz Experience",
    quizDesc:
      "Deliver a sleek, fast quiz interface for your students. Provide immediate feedback, comprehensive hints, and track individual performance with ease.",
    quizLink: "Try a quiz",
    everythingTitle: "Everything in",
    everythingHighlight: "your control.",
    everythingSubtitle:
      "All the features you need to manage your quizzes, evaluate student mastery, and track progress — without friction.",
    cap1Title: "Instant AI Generation",
    cap1Desc:
      "Transform raw lecture notes, PDFs, or slide decks into fully formatted multiple choice and open questions within seconds.",
    cap2Title: "Real-time Mastery Analytics",
    cap2Desc:
      "Monitor student performance curves, spot knowledge gaps early, and track class accuracy across difficulty tiers.",
    cap3Title: "Semantic Vector RAG",
    cap3Desc:
      "Automatic document chunking and vector embeddings guarantee that generated questions stay 100% faithful to course content.",
    cap4Title: "Course Leaderboards",
    cap4Desc:
      "Drive healthy competition with live course rankings, accuracy breakdown stats, and attempt timestamp tracking.",
    cap5Title: "Adaptive Question Controls",
    cap5Desc:
      "Customize difficulty levels, answer option counts, question categories, and step-by-step hints with full educator override.",
    cap6Title: "Scrambled Answer Security",
    cap6Desc:
      "Fisher-Yates randomized answer positions on every attempt ensure students demonstrate true concept mastery.",
    ctaTitle: "Assessment reimagined.",
    ctaHighlight: "Available today.",
    contactUs: "Contact us",
    footerCourses: "Courses",
    footerContact: "Contact Us",
  },
};
