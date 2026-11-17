// Indonesian (default). Every UI string lives here and in en.ts.
// Keep keys identical between the two files: en.ts is type-checked against this one.

const id = {
  meta: {
    title: 'Setia Bakti Baptist Church · Kediri',
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
      readingLabel: 'Bacaan',
      preacherLabel: 'Pembicara',
    },
    prayer: {
      tag: 'Rabu malam',
      title: 'Doa Rabu Malam',
      timesLabel: 'Jam doa',
      listLabel: 'Pokok doa minggu ini',
    },
    choir: {
      tag: 'Paduan suara',
      title: 'Paduan Suara',
      invite:
        'Suka bernyanyi? Bergabunglah melayani lewat pujian. Tidak perlu pengalaman, cukup kerinduan untuk memuji Tuhan bersama.',
      cta: 'Gabung paduan suara',
    },
    sampleNote: 'Contoh data. Akan diisi oleh staf gereja.',
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

  forms: {
    staffNote: 'Staf gereja akan menghubungi Anda melalui kontak yang Anda berikan.',
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
