// src/modules/videos/thumb.helper.ts
import cloudinary from "../../config/cloudinary.js";

// YouTube tarafında denenecek varyasyonlar
const VARIANTS = ["maxresdefault", "sddefault", "hqdefault", "mqdefault", "0"];
const DOMAINS = ["i.ytimg.com", "img.youtube.com"];

async function headOk(url: string) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * YouTube ID için erişilebilir en iyi thumb’ı bul.
 */
export async function findBestYouTubeThumb(youtubeId: string) {
  for (const d of DOMAINS) {
    for (const v of VARIANTS) {
      const jpg = `https://${d}/vi/${youtubeId}/${v}.jpg`;
      if (await headOk(jpg)) return jpg;
    }
  }
  return null;
}

/**
 * YouTube kapağını bulur ve Cloudinary'ye yükler.
 * DÖNDÜRDÜĞÜMÜZ ŞEY ARTIK:
 *   { coverUrl?: string; coverPublicId?: string }
 *
 * coverPublicId **her zaman** Cloudinary’nin döndürdüğü tam public_id’dir.
 * Yani silerken doğrudan bunu kullanacağız.
 */
export async function uploadCoverToCloudinary(youtubeId: string): Promise<{
  coverUrl?: string;
  coverPublicId?: string;
}> {
  const best = await findBestYouTubeThumb(youtubeId);
  if (!best) {
    return {};
  }

  try {
    const upload = await cloudinary.uploader.upload(best, {
      folder: "videos",
      public_id: youtubeId, // videolar için aynı ID
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    });

    return {
      coverUrl: upload.secure_url as string,
      // Cloudinary burada "videos/OPf0..." diye TAM public_id döndürür
      coverPublicId: upload.public_id as string,
    };
  } catch {
    return {};
  }
}

/**
 * Cloudinary’deki videonun kapağını sil.
 * Biz backend’de her zaman ya tam public_id ya da sadece youtubeId yollayacağız.
 * Burada ikisini de destekliyoruz.
 */
export async function deleteCoverFromCloudinary(publicIdOrYoutube: string) {
  if (!publicIdOrYoutube) return;

  // Eğer zaten "videos/..." ile başlıyorsa direkt kullan
  const publicId = publicIdOrYoutube.startsWith("videos/")
    ? publicIdOrYoutube
    : `videos/${publicIdOrYoutube}`;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch {
    // sessiz geç
  }
}
