# DRAMAFRIK

Site de vente de séries drama africaines. Les premiers épisodes sont gratuits, la série complète se paie dès 300 FCFA avec **Wave**, **Orange Money**, **MTN**, **Moov**, **Free Money** ou **carte bancaire**.

## Lancer le site sur votre ordinateur

```bash
npm install
npm run setup     # crée la base de données, le compte admin et une série de démonstration
npm run dev       # ouvre http://localhost:3000
```

Le compte admin (numéro + mot de passe) est dans le fichier `.env` (`ADMIN_PHONE`, `ADMIN_PASSWORD`).
Une fois connecté, cliquez sur **Admin** en haut à droite.

Au départ, le site est en **mode test** (`PAYMENT_MODE="simulation"`) : le bouton « Payer » simule un paiement sans débiter d'argent.

## Ajouter une série

1. **Admin → Nouvelle série** : titre, résumé, lien de l'affiche, prix (minimum 300 FCFA, multiple de 5) et nombre d'épisodes gratuits.
2. Sur la page de la série, ajoutez les épisodes un par un, avec l'**ID Bunny Stream** de chaque vidéo.
3. Cochez **Publiée** : la série apparaît sur l'accueil.

## Passer aux vrais paiements

### Avec GeniusPay (recommandé : Wave, Orange Money, MTN, Moov, carte en un seul bouton)

1. Dans le tableau de bord GeniusPay, ouvrez **Paramètres → API** ([lien direct](https://geniuspay.ci/dashboard/settings?tab=api)) et copiez les deux clés dans `.env` :
   ```
   GENIUSPAY_PUBLIC_KEY="pk_sandbox_..."
   GENIUSPAY_SECRET_KEY="sk_sandbox_..."
   PAYMENT_MODE="live"
   ```
   Commencez avec les clés **sandbox** (paiements de test chez GeniusPay). Remplacez-les par les clés **live** (`pk_live_…`, `sk_live_…`) pour encaisser pour de vrai.
2. Une fois le site en ligne, dans **Webhooks**, ajoutez l'adresse `https://VOTRE-SITE/api/webhooks/geniuspay` avec les événements `payment.success`, `payment.failed` et `payment.expired`.
3. Redémarrez le site.

### Autres prestataires

| Étape | Où | Ce qu'il faut mettre dans `.env` |
|---|---|---|
| Wave | [business.wave.com](https://business.wave.com), puis Développeurs → Clé API avec le droit « Checkout » | `WAVE_API_KEY` |
| Orange, MTN, Moov, carte | [cinetpay.com](https://cinetpay.com), puis Intégration → API Key et Site ID | `CINETPAY_API_KEY`, `CINETPAY_SITE_ID` |
| Webhook Wave | Dans Wave Business, ajoutez l'adresse `https://VOTRE-SITE/api/webhooks/wave` (événement `checkout.session.completed`) | |
| Activer | | `PAYMENT_MODE="live"` et `APP_URL="https://VOTRE-SITE"` |

Seuls les moyens de paiement dont les clés sont remplies s'affichent. Vous pouvez donc commencer avec Wave seul ou CinetPay seul.

**Sécurité des paiements :** le site ne débloque jamais une série sur la seule foi d'une notification. Il redemande toujours le vrai statut à Wave ou à CinetPay avant de donner l'accès.

## Héberger les vidéos (Bunny Stream)

1. Créez une bibliothèque vidéo sur [bunny.net/stream](https://bunny.net/stream).
2. Mettez son numéro dans `BUNNY_LIBRARY_ID`.
3. Dans **Security**, activez **Token Authentication** et copiez la clé dans `BUNNY_TOKEN_KEY`. Les liens vidéo expirent alors après 4 heures, ce qui empêche de partager une vidéo payante.
4. Envoyez vos épisodes sur Bunny, puis copiez l'**ID de chaque vidéo** dans l'admin.

Bunny adapte automatiquement la qualité à la connexion du spectateur (3G, 4G, wifi).

## Mettre le site en ligne

Il faut un hébergeur Node.js avec un disque permanent (la base SQLite y est stockée), par exemple Railway, Render ou un petit serveur VPS.

```bash
npm install
npm run build
npm run setup
npm start
```

N'oubliez pas de mettre `APP_URL` à l'adresse https de votre site. Wave et CinetPay refusent les adresses `localhost`.
