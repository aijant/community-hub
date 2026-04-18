/** Set in `.env.local` as `VITE_WHATSAPP_GROUP_URL` / `VITE_TELEGRAM_GROUP_URL`. */
export function getWhatsappGroupUrl(): string | undefined {
  const raw = import.meta.env.VITE_WHATSAPP_GROUP_URL;
  const u = typeof raw === "string" ? raw.trim() : "";
  return u || undefined;
}

export function getTelegramGroupUrl(): string | undefined {
  const raw = import.meta.env.VITE_TELEGRAM_GROUP_URL;
  const u = typeof raw === "string" ? raw.trim() : "";
  return u || undefined;
}
