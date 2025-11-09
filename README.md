# Poznej & Hraj – React + Vite

Moderní webová aplikace pro komunitu Poznej & Hraj. Projekt běží na Reactu (Vite), používá Tailwind CSS a ukládá zpětnou vazbu do Firebase (Firestore + Storage).

## Technologie

- [Vite](https://vitejs.dev/) + React
- [Tailwind CSS](https://tailwindcss.com/) pro stylování
- [Firebase](https://firebase.google.com/) – Firestore a Cloud Storage

## Lokální spuštění

```bash
npm install
npm run dev
```

## Build pro produkci

```bash
npm run build
```

Výstup se nachází ve složce `dist/` a je připravený k nasazení na GitHub Pages nebo Vercel (`npm run preview` spustí lokální náhled).

## Konfigurace Firebase

1. Vytvoř soubor `.env` podle `.env.example` a doplň klíče z Firebase konzole:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_PASSWORD=akce1234
```

2. V [Firebase konzoli](https://console.firebase.google.com/) povol Firestore a Cloud Storage.
3. Pokud `.env` nevyplníš, aplikace běží v ukázkovém režimu: zobrazí se demo data a akce jako rezervace či anketa se ukládají jen lokálně.
4. Struktura ukládaných dokumentů v kolekci `feedback`:
   - `name`, `email`, `message`, `photoURL`, `timestamp` (serverTimestamp).

## Struktura projektu

```
src/
  App.jsx            # hlavní layout
  main.jsx           # vstupní bod
  index.css          # Tailwind a custom styly
  firebaseConfig.js  # inicializace Firebase
  sampleData.js      # demo obsah pro offline náhled
  components/
    FeedbackForm.jsx
    ReviewForm.jsx
  services/
    feedback.js      # funkce sendFeedback()
```

## Scripts

- `npm run dev` – vývojový server
- `npm run build` – produkční build
- `npm run preview` – lokální náhled buildu
- `npm run lint` – lintování projektu

## Licence

Projekt je připraven pro repozitář `poznej-a-hraj-app`.
