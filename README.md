# Poznej &amp; Hraj

Jednostránková prezentace komunitní akce Poznej &amp; Hraj laděná do nočního neonového stylu. Součástí je přehled nadcházejících termínů, anketa aktivit s ukládáním hlasů do `localStorage` a galerie momentů z akcí.

## Struktura projektu

- `index.html` – hlavní stránka s hero kartou, programem, anketou, galerií a postranními boxy.
- `style.css` – styly rozhraní, neonová paleta a responsivní layout.
- `script.js` – logika ankety, práce s hlasováním, odezva formuláře a režim úprav obsahu.
- `assets/board-games.svg` – ilustrační grafika pro hero sekci.

## Lokální spuštění

Stačí otevřít `index.html` v prohlížeči, případně spustit jednoduchý server:

```bash
python -m http.server 8000
```

A poté navštívit <http://localhost:8000>.

## Režim úprav obsahu

- Klikni na tlačítko **Režim úprav** v horní liště pro odemčení textů s označením.
- Upravený text se ukládá do prohlížeče (`localStorage`) a zůstane zachován i po obnovení stránky.
- Pomocí tlačítka **Obnovit texty** lze vrátit původní znění jednotlivých bloků.
