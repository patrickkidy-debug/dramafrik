export function formatXof(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export function formatDuration(sec: number) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDate(d: Date) {
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const MIN_PRICE = Number(process.env.MIN_PRICE_XOF ?? 300);
