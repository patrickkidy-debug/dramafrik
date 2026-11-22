import type { Series } from "@prisma/client";
import { btn, input, label } from "@/lib/ui";
import { MIN_PRICE } from "@/lib/format";

export function SeriesForm({
  action,
  series,
  submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  series?: Series;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {series && <input type="hidden" name="id" value={series.id} />}
      <div className="sm:col-span-2">
        <label className={label} htmlFor="title">Titre</label>
        <input id="title" name="title" required defaultValue={series?.title} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="slug">Adresse web (laisser vide = automatique)</label>
        <input id="slug" name="slug" defaultValue={series?.slug} placeholder="heritage-mama-awa" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="tagline">Phrase d&apos;accroche</label>
        <input id="tagline" name="tagline" defaultValue={series?.tagline} className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="synopsis">Résumé</label>
        <textarea id="synopsis" name="synopsis" rows={4} defaultValue={series?.synopsis} className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="coverUrl">Lien de l&apos;affiche (image verticale 2:3)</label>
        <input id="coverUrl" name="coverUrl" type="url" defaultValue={series?.coverUrl} placeholder="https://…" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="priceXof">Prix de la série (FCFA, min. {MIN_PRICE})</label>
        <input id="priceXof" name="priceXof" type="number" min={MIN_PRICE} step={5} required defaultValue={series?.priceXof ?? MIN_PRICE} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="freeEpisodes">Épisodes gratuits</label>
        <input id="freeEpisodes" name="freeEpisodes" type="number" min={0} required defaultValue={series?.freeEpisodes ?? 2} className={input} />
      </div>
      <label className="flex items-center gap-2 sm:col-span-2">
        <input type="checkbox" name="published" defaultChecked={series?.published} className="h-4 w-4 accent-[var(--color-gold)]" />
        <span>Publiée (visible par le public)</span>
      </label>
      <div className="sm:col-span-2">
        <button className={btn}>{submitLabel}</button>
      </div>
    </form>
  );
}
