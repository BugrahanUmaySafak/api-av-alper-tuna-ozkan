// Küçük harf, TR karakter transliterasyon, tek tire, baş/son tire kırpma
export function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    i: "i",
    İ: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    I: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };

  const normalized = input
    .trim()
    .replace(/\s+/g, " ")
    .split("")
    .map((ch) => (map[ch] ? map[ch] : ch))
    .join("")
    .toLowerCase();

  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
