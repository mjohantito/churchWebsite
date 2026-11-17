import type { Dictionary } from './id';

type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };

const en: Shape<Dictionary> = {
  meta: {
    title: 'Setia Bakti Baptist Church · Kediri',
  },
  a11y: {
    skip: 'Skip to main content',
    home: 'Setia Bakti, home',
    mainNav: 'Main navigation',
    footerNav: 'Other pages',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menu: 'Menu',
    language: 'Choose language',
    close: 'Close',
    opensNewTab: '(opens in a new tab)',
  },
  lang: {
    id: 'ID',
    en: 'EN',
    idLong: 'Bahasa Indonesia',
    enLong: 'English',
  },
  nav: {
    dailyBread: 'Daily Bread',
    services: 'Church Services',
    baptism: 'Baptism',
    announcements: 'Announcements',
    roster: 'Service Duty Roster',
    contact: 'Contact Us',
    sermons: 'All sermons',
  },
  church: {
    name: 'Setia Bakti Baptist Church',
    wordmark: 'Setia Bakti',
    city: 'Kediri',
  },

  scripture: {
    text: '“Accept one another, then, just as Christ accepted you, in order to bring praise to God.”',
  },

  hero: {
    headingBefore: 'One family, one',
    headingScript: 'Hope',
    headingAfter: '',
    welcome:
      'At <b>Setia Bakti Baptist Church</b>, everyone is welcomed just as they are. Come to worship, to grow, and to walk with Jesus <i>together</i>.',
    ctaNew: 'I’m New',
    ctaPrayer: 'I Need Prayer',
    serviceNote: 'Sunday services · {{times}}',
  },

  services: {
    eyebrow: 'Worship & fellowship',
    headingBefore: 'Come and worship',
    headingScript: 'Together',
    headingAfter: '',
    intro: 'Three ways to gather and take part each week.',
    carouselLabel: 'Service cards',
    prev: 'Previous card',
    next: 'Next card',
    cardOf: 'Card {{current}} of {{total}}',
    sunday: {
      tag: 'Sunday',
      title: 'Sunday Service',
      timesLabel: 'Service times',
      materialLabel: 'Next Sunday’s material',
      readingLabel: 'Reading',
      preacherLabel: 'Preacher',
    },
    prayer: {
      tag: 'Wednesday night',
      title: 'Wednesday Night Prayer',
      timesLabel: 'Prayer time',
      listLabel: 'This week’s prayer list',
    },
    choir: {
      tag: 'Choir',
      title: 'Choir',
      invite:
        'Love to sing? Join us in serving through worship. No experience needed, just a heart to praise God together.',
      cta: 'Join the choir',
    },
    sampleNote: 'Sample data. Church staff will fill this in.',
  },

  sermon: {
    eyebrow: 'This week’s word',
    headingBefore: 'Latest',
    headingScript: 'Sermon',
    headingAfter: '',
    videoLabel: 'Sermon video',
    videoPlaceholder: 'Sermon YouTube video',
    preacherLabel: 'Preacher',
    dateLabel: 'Date',
    readingLabel: 'Reading',
    summaryLabel: 'Summary',
    slides: 'Download slides',
    slidesSoon: 'Slides coming soon',
    all: 'See all sermons',
    iframeTitle: 'Sermon video: {{title}}',
  },

  ministries: {
    eyebrow: 'Community',
    headingBefore: '',
    headingScript: 'There’s',
    headingAfter: 'A place for you',
    label: 'Growing together at every age',
    intro: 'Faith grows in good company. Find the community that fits your season of life.',
    join: 'Join',
    joinGroup: '{{group}}',
    groups: {
      kids: {
        name: 'Kids',
        script: 'Kids',
        text: 'A place for children to know God’s love through stories, songs and friends.',
        detail: 'Schedule and details coming soon.',
      },
      students: {
        name: 'Students',
        script: 'Students',
        text: 'For students who want to grow in faith through school life and friendships.',
        detail: 'Schedule and details coming soon.',
      },
      youth: {
        name: 'Youth',
        script: 'Youth',
        text: 'Room to ask questions, make friends and serve alongside other young people.',
        detail: 'Schedule and details coming soon.',
      },
      youngAdults: {
        name: 'Young Adults',
        script: 'Young adults',
        text: 'For those starting work, studying, or beginning a family.',
        detail: 'Schedule and details coming soon.',
      },
      adults: {
        name: 'Adults',
        script: 'Adults',
        text: 'Fellowship to support one another, pray, and go deeper in the Word together.',
        detail: 'Schedule and details coming soon.',
      },
    },
  },

  footer: {
    tagline: 'One family, one hope.',
    pages: 'Pages',
    times: 'Service times',
    sunday: 'Sunday Service',
    prayer: 'Wednesday Night Prayer',
    visit: 'Address',
    maps: 'Open in Google Maps',
    language: 'Language',
    copyright: '© {{year}} Setia Bakti Baptist Church. All rights reserved.',
  },

  comingSoon: {
    eyebrow: 'Coming soon',
    body: 'This page is being prepared. In the meantime, we’d love to see you on Sunday.',
    back: 'Back to home',
  },

  media: {
    placeholder: 'Photo coming soon',
    heroSanctuary: 'The congregation worshipping in the Setia Bakti sanctuary',
    sermonPoster: 'Sermon video still',
    kids: 'Children at Sunday school',
    students: 'Students in fellowship',
    youth: 'Young people in fellowship',
    youngAdults: 'Young adults in fellowship',
    adults: 'Adult fellowship gathering',
  },

  forms: {
    staffNote: 'Church staff will contact you using the details you give.',
    required: 'required',
    optional: 'optional',
    submit: 'Send',
    submitting: 'Sending…',
    cancel: 'Cancel',
    close: 'Close',
    retry: 'Try again',
    errorSummary: 'Please check the highlighted fields.',
    errorSubmit: 'Sorry, the form wasn’t sent. Check your connection and try again.',
    fields: {
      name: 'Full name',
      phone: 'Phone / WhatsApp',
      email: 'Email',
      message: 'Short message',
      request: 'Prayer request',
      voicePart: 'Voice part',
    },
    hints: {
      phone: 'Example: 0812 3456 7890',
      request: 'Share as much as you like. Your request is handled with care.',
    },
    errors: {
      nameRequired: 'Please enter your name.',
      phoneRequired: 'Please enter your phone number.',
      phoneInvalid: 'That phone number doesn’t look right.',
      emailInvalid: 'Please enter a valid email.',
      requestRequired: 'Please write your prayer request.',
    },
    voiceParts: {
      none: 'Not sure yet',
      soprano: 'Soprano',
      alto: 'Alto',
      tenor: 'Tenor',
      bass: 'Bass',
    },
    newMember: {
      title: 'Welcome!',
      intro: 'We’re glad you’re here. Leave your details and we’ll say hello.',
      success: 'Thank you! We’ve received your details.',
    },
    prayer: {
      title: 'Prayer request',
      intro: 'You are not alone. Share what you’re carrying and we will pray for you.',
      success: 'Thank you. We will pray for your request.',
    },
    choir: {
      title: 'Join the choir',
      intro: 'Fill in these short details and the choir leader will contact you.',
      success: 'Thank you! We’ll be in touch soon.',
    },
  },
};

export default en;
