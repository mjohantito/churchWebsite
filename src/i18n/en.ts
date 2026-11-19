import type { Dictionary } from "./id";

type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };

const en: Shape<Dictionary> = {
  meta: {
    title: "Setia Bakti Baptist Church · Kediri",
    siteName: "Setia Bakti Baptist Church",
    pageTitle: "{{page}} · Setia Bakti Baptist Church",
    ogImageAlt: "Setia Bakti Baptist Church, Kediri",
    descriptions: {
      home: "Setia Bakti Baptist Church in Kediri. Sunday services, Wednesday night prayer, the latest sermon, and community for every age.",
      dailyBread:
        "Daily devotionals from Setia Bakti Baptist Church: read or listen every day.",
      dailyBreadDate:
        "Setia Bakti Baptist Church daily devotional for {{date}}.",
      announcements:
        "The latest announcements from KPW and other groups at Setia Bakti Baptist Church.",
      roster: "The weekly service duty roster of Setia Bakti Baptist Church.",
      services:
        "Service times and information at Setia Bakti Baptist Church, Kediri.",
      baptism:
        "Baptism information and registration at Setia Bakti Baptist Church.",
      contact: "Contact Setia Bakti Baptist Church in Kediri, East Java.",
      sermons:
        "Sermon materials from Setia Bakti Baptist Church: videos, slides and summaries of Sunday sermons.",
      staff: "Staff area of Setia Bakti Baptist Church.",
    },
  },
  a11y: {
    skip: "Skip to main content",
    home: "Setia Bakti, home",
    mainNav: "Main navigation",
    footerNav: "Other pages",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menu: "Menu",
    language: "Choose language",
    close: "Close",
    opensNewTab: "(opens in a new tab)",
  },
  lang: {
    id: "ID",
    en: "EN",
    idLong: "Bahasa Indonesia",
    enLong: "English",
  },
  nav: {
    dailyBread: "Daily Bread",
    services: "Church Services",
    baptism: "Baptism",
    announcements: "Announcements",
    roster: "Service Duty Roster",
    contact: "Contact Us",
    sermons: "Sermon materials",
  },
  church: {
    name: "Setia Bakti Baptist Church",
    wordmark: "Setia Bakti",
    city: "Kediri",
  },

  scripture: {
    text: "“Accept one another, then, just as Christ accepted you, in order to bring praise to God.”",
  },

  hero: {
    headingBefore: "Faithfully",
    headingScript: "Devoted",
    headingAfter: "",
    welcome:
      "At <b>Setia Bakti Baptist Church</b>, everyone is welcomed just as they are. Come to worship, to grow, and to walk with Jesus <i>together</i>.",
    ctaNew: "I’m New",
    ctaPrayer: "I Need Prayer",
    serviceNote: "Sunday services · {{times}}",
  },

  services: {
    eyebrow: "Worship & fellowship",
    headingBefore: "Come and worship",
    headingScript: "Together",
    headingAfter: "",
    intro: "Ways to gather and take part each week.",
    carouselLabel: "Service cards",
    prev: "Previous card",
    next: "Next card",
    cardOf: "Card {{current}} of {{total}}",
    timesLabel: "Times",
    ctaDefault: "Learn more",
    sunday: {
      materialLabel: "Next Sunday’s material",
      materialEmpty: "Next Sunday’s material has not been published yet.",
    },
    prayer: {
      listLabel: "This week’s prayer list",
      listEmpty: "This week’s prayer list has not been published yet.",
    },
  },

  churchServices: {
    eyebrow: "Worship & fellowship",
    intro:
      "Service times at Setia Bakti. All times are in WIB (Western Indonesia Time). You are always welcome.",
    location: "Location",
    empty: "The service schedule is being updated.",
  },

  sermon: {
    eyebrow: "This week’s word",
    headingBefore: "Latest",
    headingScript: "Sermon",
    headingAfter: "",
    videoLabel: "Sermon video",
    videoPlaceholder: "Sermon YouTube video",
    preacherLabel: "Preacher",
    dateLabel: "Date",
    readingLabel: "Reading",
    summaryLabel: "Summary",
    slides: "Download slides",
    slidesSoon: "Slides coming soon",
    all: "See all sermons",
    iframeTitle: "Sermon video: {{title}}",
    empty: "The latest sermon will appear here soon.",
  },

  sermons: {
    eyebrow: "Sermon archive",
    intro: "Videos, slides and summaries of Sunday sermons, newest first.",
    searchLabel: "Search by title or preacher",
    searchPlaceholder: "For example: love",
    clearSearch: "Clear search",
    yearLabel: "Filter by year",
    allYears: "All years",
    showing: "Showing {{count}} sermons",
    loadMore: "Load more",
    empty: "No sermon materials yet.",
    noMatch: "No sermons match this search.",
    showAll: "Show all sermons",
    available: "Available",
    badgeVideo: "Video",
    badgeSlides: "Slides",
    badgeSummary: "Summary",
    backToList: "All sermon materials",
    play: "Play video: {{title}}",
    downloadSlides: "Download slides",
    fileInfo: "{{type}}, {{size}}",
    older: "Previous sermon",
    newer: "Next sermon",
    otherSermons: "Other sermons",
    notFound: "This sermon was not found or is not published yet.",
    metaDesc: "Sermon materials for {{date}}: video, slides and summary.",
    metaDescBy:
      "Sermon materials for {{date}} by {{preacher}}: video, slides and summary.",
  },

  ministries: {
    eyebrow: "Community",
    headingBefore: "",
    headingScript: "There’s",
    headingAfter: "A place for you",
    label: "Growing together at every age",
    intro:
      "Faith grows in good company. Find the community that fits your season of life.",
    join: "Join",
    joinGroup: "{{group}}",
    groups: {
      kids: {
        name: "Kids",
        script: "Kids",
        text: "A place for children to know God’s love through stories, songs and friends.",
        detail: "Schedule and details coming soon.",
      },
      students: {
        name: "Students",
        script: "Students",
        text: "For students who want to grow in faith through school life and friendships.",
        detail: "Schedule and details coming soon.",
      },
      youth: {
        name: "Youth",
        script: "Youth",
        text: "Room to ask questions, make friends and serve alongside other young people.",
        detail: "Schedule and details coming soon.",
      },
      youngAdults: {
        name: "Young Adults",
        script: "Young adults",
        text: "For those starting work, studying, or beginning a family.",
        detail: "Schedule and details coming soon.",
      },
      adults: {
        name: "Adults",
        script: "Adults",
        text: "Fellowship to support one another, pray, and go deeper in the Word together.",
        detail: "Schedule and details coming soon.",
      },
    },
  },

  footer: {
    tagline: "One family, one hope.",
    pages: "Pages",
    times: "Service times",
    sunday: "Sunday Service",
    prayer: "Wednesday Night Prayer",
    visit: "Address",
    maps: "Open in Google Maps",
    language: "Language",
    copyright: "© {{year}} Setia Bakti Baptist Church. All rights reserved.",
  },

  comingSoon: {
    eyebrow: "Coming soon",
    body: "This page is being prepared. In the meantime, we’d love to see you on Sunday.",
    back: "Back to home",
  },

  media: {
    placeholder: "Photo coming soon",
    heroSanctuary: "Worship team singing on stage under spotlights",
    sermonPoster: "Sermon video still",
    kids: "Children at Sunday school",
    students: "A crowd of young people worshipping with hands raised",
    youth:
      "A group of young people posing in front of a Christmas tree in church",
    youngAdults:
      "Group photo of about thirty people in a room with wooden tables",
    adults: "Adult fellowship gathering",
  },

  states: {
    loading: "Loading…",
    error: "Sorry, this could not be loaded. Please check your connection.",
    retry: "Try again",
  },

  dailyBread: {
    eyebrow: "Daily devotional",
    script: "Daily",
    intro:
      "A short devotional every day: listen to the audio or read the text.",
    todayLabel: "Today",
    listen: "Listen to the devotional",
    audioUnsupported: "Your browser cannot play this audio.",
    noAudio: "Audio for this devotional is not available yet.",
    archive: "Devotional archive",
    empty: "No devotionals have been published yet.",
    emptyDate: "There is no devotional for this date yet.",
    invalidDate: "That date is not valid.",
    readingLabel: "Reading",
    loadMore: "Load more",
    archiveCount: "{{shown}} of {{total}} devotionals",
    calendar: {
      label: "Devotional calendar",
      prevWeek: "Previous week",
      nextWeek: "Next week",
      weekdays: "S M T W T F S",
      emptyWeek: "No devotionals this week.",
    },
    entryOf: "Devotional for {{date}}",
  },

  audio: {
    play: "Play audio",
    pause: "Pause audio",
    seek: "Audio position",
    position: "{{current}} of {{total}}",
  },

  announcements: {
    eyebrow: "Church news",
    intro:
      "Announcements from KPW and other church groups, one week at a time.",
    filterLabel: "Filter by group",
    all: "All",
    weekNav: "Choose a week",
    prevWeek: "Previous week",
    nextWeek: "Next week",
    thisWeek: "This week",
    listLabel: "Announcements for {{range}}",
    emptyThisWeek: "There are no announcements for this week yet.",
    emptyWeek: "There are no announcements for this week.",
    seeLatest: "See the latest announcements ({{range}})",
    emptyGroupWeek: "No announcements from this group this week.",
    showAllGroups: "Show all groups",
    readMore: "Read more",
    showLess: "Show less",
    permalink: "Link",
    permalinkLabel: "Link to announcement: {{title}}",
    seeWeek: "See all announcements for {{range}}",
    backToAll: "All announcements",
    notFound: "This announcement was not found or is no longer shown.",
  },

  roster: {
    eyebrow: "Serving at worship",
    intro: "Who is serving at each service this week.",
    weekOf: "Week of {{range}}",
    prevWeek: "Previous week",
    nextWeek: "Next week",
    thisWeek: "This week",
    roleHeader: "Role",
    caption: "Service duty roster, week of {{range}}",
    services: {
      sun_am: "Sunday morning",
      sun_pm: "Sunday evening",
      wed: "Wednesday night",
    },
    empty: "The roster for this week has not been filled in yet.",
    unassigned: "Not yet assigned",
  },

  auth: {
    title: "Staff sign-in",
    intro: "This page is for church staff only.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    submitting: "Checking…",
    invalid: "Wrong email or password.",
    network: "Could not connect. Please try again shortly.",
    unavailable: "Sign-in is not available in mock data mode (VITE_USE_MOCK).",
    signOut: "Sign out",
    checking: "Checking session…",
    notAuthorizedTitle: "Not authorized",
    notAuthorized:
      "This account is not registered as staff. Please contact the church admin.",
    profileError: "Staff details could not be loaded. Please try again.",
  },

  // Staff admin text lives in src/i18n/admin-*.ts and loads with the admin chunk.

  forms: {
    staffNote: "Staff will contact you using these details.",
    throttled:
      "Your form was just sent. Please wait 30 seconds before sending another.",
    honeypot: "Leave this field empty",
    required: "required",
    optional: "optional",
    submit: "Send",
    submitting: "Sending…",
    cancel: "Cancel",
    close: "Close",
    retry: "Try again",
    errorSummary: "Please check the highlighted fields.",
    errorSubmit:
      "Sorry, the form wasn’t sent. Check your connection and try again.",
    fields: {
      name: "Full name",
      phone: "Phone / WhatsApp",
      email: "Email",
      message: "Short message",
      request: "Prayer request",
      voicePart: "Voice part",
    },
    hints: {
      phone: "Example: 0812 3456 7890",
      request: "Share as much as you like. Your request is handled with care.",
    },
    errors: {
      nameRequired: "Please enter your name.",
      phoneRequired: "Please enter your phone number.",
      phoneInvalid: "That phone number doesn’t look right.",
      emailInvalid: "Please enter a valid email.",
      requestRequired: "Please write your prayer request.",
    },
    voiceParts: {
      none: "Not sure yet",
      soprano: "Soprano",
      alto: "Alto",
      tenor: "Tenor",
      bass: "Bass",
    },
    newMember: {
      title: "Welcome!",
      intro: "We’re glad you’re here. Leave your details and we’ll say hello.",
      success: "Thank you! We’ve received your details.",
    },
    prayer: {
      title: "Prayer request",
      intro:
        "You are not alone. Share what you’re carrying and we will pray for you.",
      success: "Thank you. We will pray for your request.",
    },
    choir: {
      title: "Join the choir",
      intro:
        "Fill in these short details and the choir leader will contact you.",
      success: "Thank you! We’ll be in touch soon.",
    },
  },
};

export default en;
