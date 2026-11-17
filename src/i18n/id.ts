// Indonesian (default). Every UI string lives here and in en.ts.
// Keep keys identical between the two files: en.ts is type-checked against this one.

const id = {
  // Page titles + descriptions (browser tab, search results, link previews)
  meta: {
    title: 'Setia Bakti Baptist Church · Kediri',
    siteName: 'Setia Bakti Baptist Church',
    pageTitle: '{{page}} · Setia Bakti Baptist Church',
    ogImageAlt: 'Setia Bakti Baptist Church, Kediri',
    descriptions: {
      home: 'Gereja Baptis Setia Bakti di Kota Kediri. Ibadah Minggu, doa Rabu malam, khotbah terbaru, dan komunitas untuk setiap usia.',
      dailyBread: 'Renungan harian Setia Bakti Baptist Church: baca atau dengarkan renungan setiap hari.',
      dailyBreadDate: 'Renungan harian Setia Bakti Baptist Church untuk {{date}}.',
      announcements: 'Pengumuman terbaru dari KPW dan kelompok lain di Setia Bakti Baptist Church.',
      roster: 'Jadwal petugas ibadah mingguan Setia Bakti Baptist Church.',
      services: 'Jadwal dan informasi ibadah di Setia Bakti Baptist Church, Kediri.',
      baptism: 'Informasi dan pendaftaran baptisan di Setia Bakti Baptist Church.',
      contact: 'Hubungi Setia Bakti Baptist Church di Kota Kediri, Jawa Timur.',
      sermons: 'Kumpulan khotbah Setia Bakti Baptist Church.',
      staff: 'Halaman staf Setia Bakti Baptist Church.',
    },
  },
  a11y: {
    skip: 'Langsung ke konten utama',
    home: 'Setia Bakti, beranda',
    mainNav: 'Navigasi utama',
    footerNav: 'Halaman lain',
    openMenu: 'Buka menu',
    closeMenu: 'Tutup menu',
    menu: 'Menu',
    language: 'Pilih bahasa',
    close: 'Tutup',
    opensNewTab: '(membuka tab baru)',
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
    baptism: 'Baptisan',
    announcements: 'Pengumuman',
    roster: 'Jadwal Petugas Ibadah',
    contact: 'Contact Us',
    sermons: 'Semua khotbah',
  },
  church: {
    name: 'Setia Bakti Baptist Church',
    wordmark: 'Setia Bakti',
    city: 'Kediri',
  },

  // Hero scripture text (TB). The reference (Roma 15:7) lives in src/data/churchInfo.ts.
  scripture: {
    text: '“Sebab itu terimalah satu akan yang lain, sama seperti Kristus juga telah menerima kita, untuk kemuliaan Allah.”',
  },

  hero: {
    headingBefore: 'Satu keluarga, satu',
    headingScript: 'Pengharapan',
    headingAfter: '',
    // <b> = church name in bold, <i> = closing word in italic
    welcome:
      'Di <b>Setia Bakti Baptist Church</b>, siapa pun Anda disambut apa adanya. Mari beribadah, bertumbuh, dan melangkah <i>bersama</i>.',
    ctaNew: 'Saya Jemaat Baru',
    ctaPrayer: 'Butuh Doa',
    // {{times}} comes from src/data/churchInfo.ts
    serviceNote: 'Ibadah Minggu · {{times}}',
  },

  services: {
    eyebrow: 'Ibadah & persekutuan',
    headingBefore: 'Mari beribadah',
    headingScript: 'Bersama',
    headingAfter: '',
    intro: 'Tiga cara untuk hadir dan terlibat setiap minggu.',
    carouselLabel: 'Kartu ibadah',
    prev: 'Kartu sebelumnya',
    next: 'Kartu berikutnya',
    cardOf: 'Kartu {{current}} dari {{total}}',
    sunday: {
      tag: 'Minggu',
      title: 'Ibadah Minggu',
      timesLabel: 'Jam ibadah',
      materialLabel: 'Bahan Minggu depan',
      materialEmpty: 'Bahan Minggu depan belum diterbitkan.',
    },
    prayer: {
      tag: 'Rabu malam',
      title: 'Doa Rabu Malam',
      timesLabel: 'Jam doa',
      listLabel: 'Pokok doa minggu ini',
      listEmpty: 'Pokok doa minggu ini belum diterbitkan.',
    },
    choir: {
      tag: 'Paduan suara',
      title: 'Paduan Suara',
      invite:
        'Suka bernyanyi? Bergabunglah melayani lewat pujian. Tidak perlu pengalaman, cukup kerinduan untuk memuji Tuhan bersama.',
      cta: 'Gabung paduan suara',
    },
  },

  sermon: {
    eyebrow: 'Firman Minggu ini',
    headingBefore: 'Khotbah',
    headingScript: 'Terbaru',
    headingAfter: '',
    videoLabel: 'Video khotbah',
    videoPlaceholder: 'Video YouTube khotbah',
    preacherLabel: 'Pembicara',
    dateLabel: 'Tanggal',
    readingLabel: 'Bacaan',
    summaryLabel: 'Ringkasan',
    slides: 'Unduh slide',
    slidesSoon: 'Slide menyusul',
    all: 'Lihat semua khotbah',
    iframeTitle: 'Video khotbah: {{title}}',
    empty: 'Khotbah terbaru akan segera ditampilkan di sini.',
  },

  ministries: {
    eyebrow: 'Komunitas',
    headingBefore: '',
    headingScript: 'Ada',
    headingAfter: 'Tempat untukmu',
    label: 'Tumbuh bersama di setiap usia',
    intro:
      'Iman bertumbuh dalam kebersamaan. Temukan komunitas yang sesuai dengan musim hidup Anda.',
    join: 'Gabung',
    joinGroup: 'dengan {{group}}',
    groups: {
      kids: {
        name: 'Anak',
        script: 'Anak-anak',
        text: 'Tempat anak-anak mengenal kasih Tuhan lewat cerita, lagu, dan teman.',
        detail: 'Jadwal dan detail kegiatan menyusul.',
      },
      students: {
        name: 'Pelajar',
        script: 'Pelajar',
        text: 'Untuk pelajar yang ingin bertumbuh dalam iman di tengah sekolah dan pergaulan.',
        detail: 'Jadwal dan detail kegiatan menyusul.',
      },
      youth: {
        name: 'Pemuda',
        script: 'Pemuda',
        text: 'Ruang untuk bertanya, berteman, dan melayani bersama sesama anak muda.',
        detail: 'Jadwal dan detail kegiatan menyusul.',
      },
      youngAdults: {
        name: 'Dewasa Muda',
        script: 'Dewasa muda',
        text: 'Untuk Anda yang baru bekerja, kuliah, atau memulai keluarga.',
        detail: 'Jadwal dan detail kegiatan menyusul.',
      },
      adults: {
        name: 'Dewasa',
        script: 'Dewasa',
        text: 'Persekutuan untuk saling menopang, berdoa, dan mendalami Firman bersama.',
        detail: 'Jadwal dan detail kegiatan menyusul.',
      },
    },
  },

  footer: {
    tagline: 'Satu keluarga, satu pengharapan.',
    pages: 'Halaman',
    times: 'Jadwal ibadah',
    sunday: 'Ibadah Minggu',
    prayer: 'Doa Rabu Malam',
    visit: 'Alamat',
    maps: 'Buka di Google Maps',
    language: 'Bahasa',
    copyright: '© {{year}} Setia Bakti Baptist Church. Seluruh hak dilindungi.',
  },

  comingSoon: {
    eyebrow: 'Segera hadir',
    body: 'Halaman ini sedang disiapkan. Sementara itu, kami menantikan Anda di ibadah Minggu.',
    back: 'Kembali ke beranda',
  },

  media: {
    placeholder: 'Foto menyusul',
    heroSanctuary: 'Jemaat beribadah di ruang kebaktian Setia Bakti',
    sermonPoster: 'Cuplikan video khotbah',
    kids: 'Anak-anak sekolah Minggu',
    students: 'Pelajar dalam persekutuan',
    youth: 'Pemuda dalam persekutuan',
    youngAdults: 'Dewasa muda dalam persekutuan',
    adults: 'Persekutuan jemaat dewasa',
  },

  states: {
    loading: 'Memuat…',
    error: 'Maaf, data belum bisa dimuat. Periksa koneksi Anda.',
    retry: 'Coba lagi',
  },

  dailyBread: {
    eyebrow: 'Renungan harian',
    script: 'Harian',
    intro: 'Renungan singkat setiap hari: dengarkan audionya atau baca teksnya.',
    todayLabel: 'Hari ini',
    listen: 'Dengarkan renungan',
    audioUnsupported: 'Browser Anda tidak dapat memutar audio ini.',
    noAudio: 'Audio untuk renungan ini belum tersedia.',
    archive: 'Arsip renungan',
    empty: 'Belum ada renungan yang diterbitkan.',
    emptyDate: 'Belum ada renungan untuk tanggal ini.',
    invalidDate: 'Tanggal tidak valid.',
    backToToday: 'Kembali ke renungan hari ini',
    readingLabel: 'Bacaan',
  },

  announcements: {
    eyebrow: 'Kabar jemaat',
    intro: 'Pengumuman dari KPW dan kelompok lain di gereja, terbaru di atas.',
    filterLabel: 'Saring berdasarkan kelompok',
    all: 'Semua',
    empty: 'Belum ada pengumuman.',
    emptyGroup: 'Belum ada pengumuman dari kelompok ini.',
    postedOn: 'Diterbitkan',
  },

  roster: {
    eyebrow: 'Pelayanan ibadah',
    intro: 'Siapa yang bertugas di setiap ibadah minggu ini.',
    weekOf: 'Minggu {{range}}',
    prevWeek: 'Minggu sebelumnya',
    nextWeek: 'Minggu berikutnya',
    thisWeek: 'Minggu ini',
    roleHeader: 'Tugas',
    caption: 'Jadwal petugas ibadah, minggu {{range}}',
    services: {
      sun_am: 'Minggu pagi',
      sun_pm: 'Minggu sore',
      wed: 'Rabu malam',
    },
    empty: 'Jadwal untuk minggu ini belum diisi.',
    unassigned: 'Belum diisi',
  },

  auth: {
    title: 'Masuk staf',
    intro: 'Halaman ini hanya untuk staf gereja.',
    email: 'Email',
    password: 'Kata sandi',
    submit: 'Masuk',
    submitting: 'Memeriksa…',
    invalid: 'Email atau kata sandi salah.',
    network: 'Tidak dapat terhubung. Coba lagi sebentar lagi.',
    unavailable: 'Login tidak tersedia dalam mode data contoh (VITE_USE_MOCK).',
    signOut: 'Keluar',
    checking: 'Memeriksa sesi…',
    notAuthorizedTitle: 'Tidak diizinkan',
    notAuthorized: 'Akun ini belum terdaftar sebagai staf. Hubungi admin gereja.',
    profileError: 'Data staf belum bisa dimuat. Coba lagi.',
  },

  // Staff admin text lives in src/i18n/admin-*.ts and loads with the admin chunk.

  forms: {
    // consent line shown on every form
    staffNote: 'Staf akan menghubungi Anda melalui kontak yang Anda berikan.',
    throttled: 'Formulir baru saja terkirim. Mohon tunggu 30 detik sebelum mengirim lagi.',
    honeypot: 'Jangan isi kolom ini',
    required: 'wajib',
    optional: 'opsional',
    submit: 'Kirim',
    submitting: 'Mengirim…',
    cancel: 'Batal',
    close: 'Tutup',
    retry: 'Coba lagi',
    errorSummary: 'Mohon periksa kembali isian yang ditandai.',
    errorSubmit: 'Maaf, formulir belum terkirim. Periksa koneksi Anda lalu coba lagi.',
    fields: {
      name: 'Nama lengkap',
      phone: 'Nomor telepon / WhatsApp',
      email: 'Email',
      message: 'Pesan singkat',
      request: 'Pokok doa',
      voicePart: 'Jenis suara',
    },
    hints: {
      phone: 'Contoh: 0812 3456 7890',
      request: 'Ceritakan sebanyak yang Anda mau. Permohonan Anda dijaga dengan hormat.',
    },
    errors: {
      nameRequired: 'Mohon isi nama Anda.',
      phoneRequired: 'Mohon isi nomor telepon.',
      phoneInvalid: 'Nomor telepon sepertinya belum benar.',
      emailInvalid: 'Format email belum benar.',
      requestRequired: 'Mohon tuliskan pokok doa Anda.',
    },
    voiceParts: {
      none: 'Belum tahu',
      soprano: 'Sopran',
      alto: 'Alto',
      tenor: 'Tenor',
      bass: 'Bas',
    },
    newMember: {
      title: 'Selamat datang!',
      intro: 'Kami senang Anda di sini. Tinggalkan kontak Anda dan kami akan menyapa.',
      success: 'Terima kasih! Kami sudah menerima data Anda.',
    },
    prayer: {
      title: 'Permohonan doa',
      intro: 'Anda tidak sendiri. Bagikan pergumulan Anda dan kami akan mendoakannya.',
      success: 'Terima kasih. Kami akan mendoakan permohonan Anda.',
    },
    choir: {
      title: 'Gabung paduan suara',
      intro: 'Isi data singkat ini dan pelatih paduan suara akan menghubungi Anda.',
      success: 'Terima kasih! Kami akan segera menghubungi Anda.',
    },
  },
};

export default id;
export type Dictionary = typeof id;
