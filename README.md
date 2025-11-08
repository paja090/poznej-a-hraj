# Poznej & Hraj – interaktivní event platforma

Moderní jednostránková aplikace pro komunitní seznamovací večery s herní tematikou. Web běží kompletně na
HTML, CSS a JavaScriptu bez backendu – data se ukládají do `localStorage`.

## Struktura

- `index.html` – hlavní stránka s veřejným obsahem i skrytým admin panelem.
- `style.css` – neonový nightlife design, responzivní layout a animace.
- `app.js` – logika pro načítání dat, správu akcí, rezervací, galerie, recenzí a admin nástroje.
- `README.md` – tento přehled projektu.

## Funkce

### Veřejná část
- hero sekce se sloganem „Spojujeme lidi skrze zábavu, soutěže a společné zážitky.“
- nadcházející akce včetně ceny (pokud je uvedena), kapacity a volných míst.
- archiv minulých akcí s galerii fotek (připraveno pro Google Drive URL).
- globální galerie, spodní animovaný pás a sekce „Označ nás na IG“.
- anketa s procentuálním vyhodnocením hlasování.
- rezervace přes Formspree + lokální uložení.
- recenze s odesláním do schválení adminem.

### Admin režim (heslo `akce1234`)
- správa akcí (přidávání, úpravy, přesun do archivu, mazání, fotky).
- správa ankety (otázka, možnosti, aktivace, reset hlasů).
- správa galerie (fotky + zvýraznění do pásu).
- přehled rezervací a export do CSV.
- schvalování / mazání recenzí.

## Lokální spuštění

Otevři `index.html` v libovolném moderním prohlížeči. Pro čistá data smaž položku `poznej-hraj-state-v2` z
localStorage.
