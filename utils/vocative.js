import { vocativeExceptions } from "./vocative-db.js";

/**
 * Český vocativ – pokročilá verze
 * @param {string} nameRaw
 * @returns {string}
 */
export function getVocative(nameRaw) {
  if (!nameRaw) return "";
  let name = nameRaw.trim();

  // Velké první písmeno
  name = name.charAt(0).toUpperCase() + name.slice(1);

  const lower = name.toLowerCase();

  // 1) Výjimky
  if (vocativeExceptions[lower]) {
    return vocativeExceptions[lower];
  }

  // 2) Ženská jména končí na -a → Tereza → Terezo
  if (lower.endsWith("a")) {
    return name.slice(0, -1) + "o";
  }

  // 3) Měkké koncovky -š → Tomáš → Tomáši
  if (lower.endsWith("š")) {
    return name + "i";
  }

  // 4) -ek → Marek → Marku
  if (lower.endsWith("ek")) {
    return name.slice(0, -2) + "ku";
  }

  // 5) -el → Daniel → Daniele
  if (lower.endsWith("el")) {
    return name.slice(0, -2) + "le";
  }

  // 6) tvrdé souhlásky
  const hardConsonants = ["r", "n", "m", "s", "t", "d", "k", "h"];
  if (hardConsonants.some((c) => lower.endsWith(c))) {
    return name + "e";
  }

  // fallback
  return name;
}
