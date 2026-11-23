# DRAMAFRIK

Site de vente de séries drama africaines. Les premiers épisodes sont gratuits, la série complète se paie dès 300 FCFA avec **Wave**, **Orange Money**, **MTN**, **Moov**, **Free Money** ou **carte bancaire**.

Hébergement : site sur **Render**, base de données sur **Neon** (voir « Mettre le site en ligne » plus bas).

Une fois connecté avec le compte admin (`ADMIN_PHONE`, `ADMIN_PASSWORD`), cliquez sur **Admin** en haut à droite.

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
2. Une fois le site en ligne, dans **Webhooks**, ajoutez l'adresse `https://VOTRE-SITE/api/webhooks/geniuspay` avec les événements `payment.success`, `payment.failed` et `payment.expired`. Copiez le secret affiché (`whsec_…`) dans `GENIUSPAY_WEBHOOK_SECRET`. Après un premier vrai paiement, si les journaux affichent « signature valide », ajoutez `GENIUSPAY_WEBHOOK_STRICT="true"` pour refuser les messages mal signés.
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

## Mettre le site en ligne (Render + Neon, gratuit)

Le site tourne sur **Render**, et la base de données (clients, achats, séries) est chez **Neon**.

### 1. Neon : la base de données

1. Créez un compte sur [neon.com](https://neon.com) (« Sign up with GitHub »).
2. Créez un projet nommé `dramafrik`, région **AWS Europe Central (Frankfurt)**.
3. Cliquez sur **Connect**. Gardez deux adresses :
   - avec **Connection pooling activé**, l'adresse contient `-pooler`. Ajoutez `&pgbouncer=true` à la fin : c'est votre **`DATABASE_URL`** ;
   - avec **Connection pooling désactivé**, l'adresse n'a pas de `-pooler` : c'est votre **`DIRECT_URL`**.

### 2. Render : le site

1. Créez un compte sur [render.com](https://render.com) (« Sign up with GitHub »).
2. Cliquez sur **New → Blueprint**, choisissez le dépôt `dramafrik`, puis **Apply**. Render lit `render.yaml` tout seul.
3. Render vous demande les valeurs manquantes :
   - `DATABASE_URL` et `DIRECT_URL` : les deux adresses Neon ;
   - `ADMIN_PHONE` et `ADMIN_PASSWORD` : votre compte admin sur le site en ligne. Choisissez un mot de passe solide ;
   - les autres (GeniusPay, Bunny) peuvent rester vides pour l'instant.
4. Attendez la fin du déploiement (3 à 5 minutes). Votre site est en ligne sur `https://dramafrik.onrender.com` (ou une adresse proche).

À chaque envoi de code sur GitHub (`main`), Render met le site à jour automatiquement.

### 3. Empêcher le site de s'endormir

Sur l'offre gratuite, Render endort le site après 15 minutes sans visite, et la page suivante met environ une minute à s'afficher. Pour l'éviter :

1. Créez un compte gratuit sur [uptimerobot.com](https://uptimerobot.com).
2. Ajoutez un **HTTP(s) monitor** sur l'adresse de votre site, toutes les **5 minutes**.

### 4. Encaisser

Dans Render → votre service → **Environment** :
- mettez vos clés `GENIUSPAY_PUBLIC_KEY` et `GENIUSPAY_SECRET_KEY` ;
- passez `PAYMENT_MODE` à `live`.

Puis, dans GeniusPay → **Webhooks**, ajoutez `https://VOTRE-SITE.onrender.com/api/webhooks/geniuspay`.

## Travailler sur le site en local

Le site local a besoin d'une base PostgreSQL. Le plus simple est de créer dans Neon une **branche** `dev` (Neon → Branches → New branch), pour ne pas mélanger vos tests avec les vrais clients. Mettez ses deux adresses dans `.env`, puis :

```bash
npm install
npm run setup     # crée les tables, le compte admin et la série de démonstration
npm run dev       # http://localhost:3000
```
