export const CROP_PRESET_IMAGES: Record<string, string> = {
  maize: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
  potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
  beans: "https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&w=800&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
  "sweet potato": "https://rwandainspirer.com/wp-content/uploads/2018/05/potatoes-800x445.jpg",
  cassava: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80",
  wheat: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80",
  soybean: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80",
  banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80",
  sorghum: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80",
  tomato: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80",
  onion: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80",
  default: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80",
};

/**
 * Returns a fully qualified image URL for a given crop type and custom URL.
 * Handles relative /static/ paths from backend, external HTTPS links, and crop fallbacks.
 */
export function getCropImageUrl(cropType?: string | null, customUrl?: string | null): string {
  if (customUrl && typeof customUrl === "string") {
    const trimmed = customUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:image/")) {
      return trimmed;
    }
    if (trimmed.startsWith("/static/")) {
      const backendRoot = (
        process.env.NEXT_PUBLIC_API_URL || "https://agromarket-backend-dpnj.onrender.com/api/v1"
      ).replace(/\/api\/v1\/?$/, "");
      return `${backendRoot}${trimmed}`;
    }
  }

  const key = (cropType || "").toLowerCase().trim();
  for (const [k, url] of Object.entries(CROP_PRESET_IMAGES)) {
    if (k !== "default" && key.includes(k)) {
      return url;
    }
  }
  return CROP_PRESET_IMAGES.default;
}
