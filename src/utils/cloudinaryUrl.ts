/* ===========================
 * Cloudinary URL Utilities
 * =========================== */

function isCloudinaryUrl(url: string) {
  return /res\.cloudinary\.com\/.+\/image\/upload\//.test(url);
}

/* -------------------- Tiny Blur (arka plan) -------------------- */
export interface TinyBlurOpts {
  w?: number; // width (px)
  q?: number; // quality
  blur?: number; // e_blur
  dpr?: number; // device pixel ratio
}

/** Cloudinary URL'üne tiny-blur transformu ekler. Cloudinary dışı URL gelirse null döner. */
export function tinyBlurCloudinary(
  url: string | null | undefined,
  opts: TinyBlurOpts = {}
): string | null {
  if (!url || !isCloudinaryUrl(url)) return null;
  const { w = 96, q = 20, blur = 300, dpr = 1 } = opts;

  return url.replace(
    /\/image\/upload\/(?![a-z])/,
    `/image/upload/q_${q},w_${w},dpr_${dpr},e_blur:${blur}/`
  );
}

/** Arka plan blur'un alanı doldurması gereken yerler (hero vb.). */
export function tinyBlurFillCloudinary(
  url: string | null | undefined,
  opts: TinyBlurOpts & { fillWidth?: number } = {}
): string | null {
  if (!url || !isCloudinaryUrl(url)) return null;
  const { w = 96, q = 20, blur = 1200, dpr = 1, fillWidth } = opts;
  const fill =
    typeof fillWidth === "number" ? `,w_${fillWidth},c_fill,g_auto` : `,w_${w}`;
  return url.replace(
    /\/image\/upload\/(?![a-z])/,
    `/image/upload/f_auto,q_${q}${fill},dpr_${dpr},e_blur:${blur}/`
  );
}

/* -------------------- Genel optimize (referans) -------------------- */
export interface OptimizedCoverOpts {
  q?: number | "auto" | "auto:good" | "auto:eco";
  f?: "auto" | "jpg" | "png" | "webp" | "avif";
}

/** Kapak görseli için genel optimize (referans). */
export function optimizedCoverCloudinary(
  url: string | null | undefined,
  opts: OptimizedCoverOpts = {}
): string | null {
  if (!url || !isCloudinaryUrl(url)) return null;
  const { q = "auto:good", f = "auto" } = opts;
  return url.replace(
    /\/image\/upload\/(?![a-z])/,
    `/image/upload/f_${f},q_${q}/`
  );
}

/* -------------------- NO-CROP Foreground (oran koru) -------------------- */
export interface NoCropFitOpts {
  w: number; // hedef genişlik (px) – container max genişliğine göre
  h?: number; // opsiyonel yükseklik üst sınırı (px)
  q?: number | "auto" | "auto:eco" | "auto:low";
  f?: "auto" | "jpg" | "png" | "webp" | "avif";
  dprAuto?: boolean; // dpr_auto ekle
}

/**
 * Foreground için orijinal oran korunarak kırpmasız görüntü (c_limit).
 * - c_limit => upscaling yok, kırpma yok, oran korunur.
 */
export function noCropFitCloudinary(
  url: string | null | undefined,
  opts: NoCropFitOpts
): string | null {
  if (!url || !isCloudinaryUrl(url)) return null;
  const { w, h, q = "auto:eco", f = "auto", dprAuto = true } = opts;

  const parts = [`f_${f}`, `q_${q}`];
  if (dprAuto) parts.push("dpr_auto");
  if (h) parts.push(`h_${h}`);
  parts.push(`w_${w}`, "c_limit");

  const t = parts.join(",");
  return url.replace(/\/image\/upload\/(?![a-z])/, `/image/upload/${t}/`);
}

/* -------------------- < 1 MB garantisi için yardımcılar -------------------- */

/** Sırasıyla HEAD yapar, <1MB olan ilk URL'i döndürür; hiçbiri küçük değilse sonuncuyu döndürür. */
export async function pickUnder1MB(urls: string[]): Promise<string> {
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: "HEAD" });
      const len = Number(r.headers.get("content-length") ?? 0);
      if (len && len < 1_000_000) return u;
    } catch {
      /* ignore network errors for candidates */
    }
  }
  return urls.at(-1)!;
}

/**
 * Foreground no-crop için adayları üretip <1MB olanı seçer.
 * Örn: widths = [1920, 1600], qualities = ["auto:eco", "auto:low", 60]
 */
export async function chooseNoCropUnder1MB(
  baseUrl: string,
  widths = [1920, 1600],
  qualities: Array<NoCropFitOpts["q"]> = ["auto:eco", "auto:low", 60]
): Promise<string | null> {
  if (!isCloudinaryUrl(baseUrl)) return null;
  const candidates: string[] = [];
  for (const w of widths) {
    for (const q of qualities) {
      const u = noCropFitCloudinary(baseUrl, { w, q, dprAuto: true });
      if (u) candidates.push(u);
    }
  }
  return pickUnder1MB(candidates);
}
