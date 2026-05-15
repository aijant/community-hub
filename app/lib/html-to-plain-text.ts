/**
 * Converts HTML to readable plain text for display (no markup execution).
 * Uses DOMParser in the browser; block boundaries are reflected via innerText.
 */
export function htmlToPlainText(html: string): string {
  const raw = html.trim();
  if (!raw) return "";

  const doc = new DOMParser().parseFromString(raw, "text/html");
  doc.querySelectorAll("script, style").forEach((el) => el.remove());

  const body = doc.body;
  let text = body.innerText ?? body.textContent ?? "";
  text = text.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
}
