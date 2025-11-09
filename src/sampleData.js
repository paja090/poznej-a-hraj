export const sampleEvents = [
  {
    id: 'e1',
    title: 'Večer her & speed-fun',
    description: 'Hry, výzvy a poznávání.',
    place: 'Klub Orion',
    capacity: 24,
    price: 150,
    tags: ['turnaj', 'kvíz', 'chill'],
    startDate: new Date('2025-11-20T19:00:00'),
    photos: [
      'https://picsum.photos/seed/party01/800/533',
      'https://picsum.photos/seed/party02/800/533',
    ],
  },
  {
    id: 'e2',
    title: 'Beer & Quiz Night',
    description: 'Týmové kvízy a pivo speciál.',
    place: 'Bar Neon',
    capacity: 20,
    price: null,
    tags: ['pivo', 'kvíz', 'hookah'],
    startDate: new Date('2025-11-27T19:30:00'),
    photos: ['https://picsum.photos/seed/party03/800/533'],
  },
  {
    id: 'e0',
    title: 'Retro Opening Party',
    description: 'Pilotní večer — fotky v archivu.',
    place: 'Start Klub',
    capacity: 30,
    price: 120,
    tags: ['retro', 'fotbálek'],
    startDate: new Date('2025-10-10T20:00:00'),
    photos: [
      'https://picsum.photos/seed/party04/800/533',
      'https://picsum.photos/seed/party05/800/533',
      'https://picsum.photos/seed/party06/800/533',
      'https://picsum.photos/seed/party07/800/533',
    ],
  },
];

export const sampleGallery = [
  { id: 'g1', name: 'party01.jpg', imageUrl: 'https://picsum.photos/seed/gallery01/600/400' },
  { id: 'g2', name: 'party02.jpg', imageUrl: 'https://picsum.photos/seed/gallery02/600/400' },
  { id: 'g3', name: 'party03.jpg', imageUrl: 'https://picsum.photos/seed/gallery03/600/400' },
  { id: 'g4', name: 'party04.jpg', imageUrl: 'https://picsum.photos/seed/gallery04/600/400' },
  { id: 'g5', name: 'party05.jpg', imageUrl: 'https://picsum.photos/seed/gallery05/600/400' },
  { id: 'g6', name: 'party06.jpg', imageUrl: 'https://picsum.photos/seed/gallery06/600/400' },
];

export const samplePollQuestion = 'Jaké téma chcete příště?';

export const samplePollOptions = [
  { id: 'opt1', title: 'Retro Night', description: '80s & 90s', votes: 6 },
  { id: 'opt2', title: 'Beer & Quiz', description: 'kvízy + pivo', votes: 9 },
  { id: 'opt3', title: 'Hookah & Chill', description: 'vodní dýmka & chill', votes: 4 },
];

export const sampleHeroTags = [
  { id: 'tag1', label: '🎮 Herní turnaje' },
  { id: 'tag2', label: '🎤 Live moderátoři' },
  { id: 'tag3', label: '📸 Foto koutek' },
  { id: 'tag4', label: '💬 Seznamování' },
];

export const sampleCrew = [
  {
    id: 't1',
    name: 'Marek',
    role: 'Moderátor her',
    description: 'Připravuje výzvy a dělá atmosféru.',
    photoUrl: 'https://i.pravatar.cc/160?img=12',
  },
  {
    id: 't2',
    name: 'Petra',
    role: 'Koordinátorka zábavy',
    description: 'Propojuje hosty a hlídá flow večera.',
    photoUrl: 'https://i.pravatar.cc/160?img=47',
  },
  {
    id: 't3',
    name: 'Tomáš',
    role: 'DJ & Tech',
    description: 'Hudba, světla a technika vyladěná na party.',
    photoUrl: 'https://i.pravatar.cc/160?img=33',
  },
];

export const sampleReviews = [
  {
    id: 'r1',
    name: 'Lucie',
    message: 'Skvělá atmosféra, poznala jsem spoustu nových lidí.',
    stars: 5,
    approved: true,
  },
  {
    id: 'r2',
    name: 'David',
    message: 'Perfektní kombinace her a chill zóny.',
    stars: 5,
    approved: true,
  },
];

export const sampleReservations = [];

export const sampleQuizResults = [
  {
    id: 'quiz1',
    name: 'Klára',
    type: 'Strategický taktik',
    score: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'quiz2',
    name: 'Ondra',
    type: 'Společenský parťák',
    score: 9,
    createdAt: new Date().toISOString(),
  },
];

export const sampleEventRatings = [
  {
    id: 'rate1',
    eventId: 'e1',
    name: 'Tereza',
    rating: 5,
    comment: 'Absolutní top! Kombinace her a moderace byla perfektní.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rate2',
    eventId: 'e0',
    name: 'Jirka',
    rating: 4,
    comment: 'Super komunita, jen bych přidal víc stolních her.',
    createdAt: new Date().toISOString(),
  },
];

export const sampleBoardMessages = [
  {
    id: 'msg1',
    name: 'Lucka',
    message: 'Kdo jde příště na quiz night? Ráda bych dala dohromady tým. 🎲',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'msg2',
    name: 'Martin',
    message: 'Díky za včerejšek! Nejvíc mě bavila improvizační hra.',
    createdAt: new Date().toISOString(),
  },
];
