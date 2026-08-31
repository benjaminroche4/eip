# Laravel App — guide du projet

Laravel 12 + Inertia 2 + React 19 + TypeScript + Tailwind 4 + shadcn/ui, rendu **SSR** pour le SEO.
Basé sur le starter kit officiel `laravel/react-starter-kit`. Pas de Next.js, pas de front séparé : tout vit dans ce repo.

## Environnement local

- PHP 8.4 (Homebrew), Composer 2.8, Node 20 — **MySQL via MAMP** (port 8889, root/root, base `estate_in_paris`). MAMP doit être lancé.
- Démarrer : `composer run dev` (serveur PHP + Vite HMR + queue + logs). Le port 8000 est souvent pris par un `symfony` local → Laravel bascule sur **http://127.0.0.1:8001**.
- SSR en dev : `npm run build:ssr && php artisan inertia:start-ssr` dans un second terminal (sinon Inertia rend en client, sans erreur).
- Vérifier le SSR : `curl -s http://127.0.0.1:8001/ | grep '<h1'` doit renvoyer du contenu.

## Commandes

| Commande | Rôle |
|---|---|
| `composer run dev` | dev complet |
| `npm run build` / `npm run build:ssr` | build client / client + SSR (`bootstrap/ssr/ssr.js`) |
| `php artisan inertia:start-ssr` | serveur SSR Node (port 13714) — à garder vivant en prod (Supervisor) |
| `npx tsc --noEmit` · `npm run lint` · `npm run format` | typecheck, ESLint, Prettier |
| `vendor/bin/pint` | style PHP |
| `php artisan test` | 36 tests PHPUnit (classes ; SSR désactivé via `phpunit.xml`) |
| `php artisan db:seed` | fixtures locales : 1 user (`test@example.com` / `password`), 14 demandes de contact (`ContactRequestSeeder`), 24 abonnés newsletter (`NewsletterSubscriberSeeder`), 11 demandes d'estimation (`ValuationRequestSeeder`) — factories `database/factories/{ContactRequest,NewsletterSubscriber,ValuationRequest}Factory` avec états `handled()` / `mailFailed()`, `unsubscribed()` / `welcomeFailed()`. Jamais en prod |
| `php artisan sitemap:generate` | régénère `public/sitemap.xml` (**index**) + `sitemap.pages.xml` + `sitemap.blog.xml` (planifié chaque jour dans `routes/console.php`) |

Avant de livrer : `composer run check` (tsc + eslint + prettier --check + pint --test + tests) doit passer.

## Qualité & tests — règle absolue

- **Tout le projet est sous tests** : chaque fonctionnalité (Action de domaine, contrôleur/route, middleware, commande, builder SEO, composant critique) a ses tests — unitaires (`tests/Unit`, classes PHPUnit) et fonctionnels (`tests/Feature`, requêtes HTTP Inertia/SSR). Une fonctionnalité sans test n'est pas terminée.
- **Après chaque modification** de code (PHP ou TS), relancer `composer run check` et corriger jusqu'au vert. Ne jamais laisser un test rouge « pour plus tard ».
- **Avant chaque `git push`** : `composer run check` complet + `npm run build:ssr` doivent passer. Un push avec des tests rouges est interdit, même pour un « petit » changement.
- Nouveau comportement = nouveau test d'abord ou en même temps (régression couverte). Bug corrigé = test qui le reproduit.
- Front : `npx tsc --noEmit`, ESLint et Prettier sont considérés comme des tests ; une page publique se vérifie aussi au `curl` SSR.

## Typographie — tiret demi-cadratin interdit

- Le caractère **« – » (en dash, U+2013) est interdit partout dans le projet** : code, textes UI (`lang/*`), config, tests, documentation. Utiliser le tiret simple « - » (plages de valeurs `6-15`, `120-160`, séparateurs) ou le point médian « · » déjà utilisé pour les titres SEO.
- **Unique exception** : `app/Domain/Blog/Support/SeoText.php`, où « – » figure dans la liste `rtrim` précisément pour le supprimer des textes venant de Sanity.

## Accessibilité — règle absolue (WCAG 2.2 AA, RGAA)

- **Tout élément interactif est utilisable au clavier seul** : Tab/Shift+Tab dans un ordre logique, Entrée/Espace pour activer, Échap pour fermer (menus, sheets, dialogs), flèches dans les listes/menus quand le pattern ARIA le demande. Aucun piège de focus ; focus rendu visible (`focus-visible:` ring) sur tout ce qui prend le focus, jamais `outline-none` sans remplacement.
- **Focus géré** : à l'ouverture d'un menu/dialog le focus entre dedans, à la fermeture il revient sur le déclencheur (Radix/shadcn le fait ; le conserver). Hover-only = interdit : tout ce qui s'ouvre au survol s'ouvre aussi au focus/clic.
- **Sémantique d'abord** : `<button>` pour une action, `<a href>` pour une navigation, `<nav aria-label>`, `<main>`, un seul `<h1>`, hiérarchie de titres sans saut. Pas de `div onClick`.
- **ARIA** uniquement en complément : `aria-label` sur les contrôles iconiques, `aria-expanded`/`aria-controls` sur les déclencheurs, `aria-current="page"`, `aria-hidden` + `inert` sur le contenu masqué, `sr-only` pour les libellés invisibles. Images décoratives `alt=""`, informatives `alt` descriptif.
- **Contraste** ≥ 4.5:1 texte / 3:1 UI et grands textes (vérifier avec les tokens, light et dark). Cibles tactiles ≥ 24×24 (44×44 sur mobile). Information jamais portée par la couleur seule.
- **Mouvement** : toute animation respecte `motion-reduce:` ; rien ne clignote, rien d'auto-défilant non stoppable.
- **Langue** : `<html lang>` correct, `hreflang`/`lang` sur les liens vers une autre langue.
- **Vérification = test** : chaque composant interactif a un test clavier (Testing Library + `user-event` : tab, enter, escape, retour du focus) ; les pages publiques passent `axe` sans violation. Une fonctionnalité non accessible au clavier n'est pas terminée.

## Structure utile

```
app/Http/Middleware/NoSsr.php          alias 'no-ssr' : désactive le SSR pour une route/groupe
app/Http/Middleware/HandleInertiaRequests.php  props partagées : auth, name, ziggy (routes + location)
app/Http/Controllers/SearchController.php      page /recherche (orchestration → Domain/Search)
app/Http/Controllers/SeoController.php         robots.txt, llms.txt
app/Http/Middleware/CanonicalUrl.php           301 vers l'URL canonique en prod
app/Console/Commands/GenerateSitemap.php       sitemap (délègue à Domain/Seo/Support/SitemapBuilder : index `sitemap.xml` → `sitemap.pages.xml` (pages statiques FR+EN, `lastmod` = date de la release) + `sitemap.blog.xml` (articles Sanity, `lastmod` = article le plus récent) ; une future famille (biens) = une entrée dans `FILES` + une méthode)
resources/js/app.tsx / ssr.tsx         entrées client / serveur
resources/js/lib/json-ld.ts            builders JSON-LD (siteGraph, breadcrumbList, faqPage, article, itemList)
resources/css/tokens.css               palette Figma (voir Design system)
config/seo.php                         défauts SEO/GEO partagés au front via la prop `seo`
app/Domain/                            logique métier (voir Architecture)
app/Domain/Blog/                       blog Sanity — **projet partagé avec Relocation in Paris (`ks9vwq45`)** : chaque site a ses types (`blog`/`author`/`category` pour Relocation, **`estateBlog`/`estateAuthor`/`estateCategory`** pour Estate in Paris, mêmes champs) ; le type lu est `SANITY_BLOG_TYPE` (défaut `estateBlog`, param GROQ `$type` via `ListBlogPosts::typeParams()`). Support/SanityClient (GROQ via HTTP, token serveur, cache 5 min, CDN si SANITY_USE_CDN), SanityImage (ref → URL cdn + srcset + dimensions), PortableText (normalise le body, extrait FAQ), SeoText (title ≤ 60 / description ≤ 160) ; Actions ListBlogPosts / ShowBlogPost / ListBlogUrls (sitemap) ; Data BlogQuery / BlogPostSummary / BlogPost / BlogListing
app/Http/Controllers/BlogController.php  /blog (+ ?page, noindex > 1) et /blog/{slug} → pages/blog/index.tsx, show.tsx. Le switcher/hreflang suivent le slug traduit (translation.metadata) via LocalizedUrls::override()
resources/js/components/blog/          types.ts (miroir des DTO + blocs Sanity), portable-text (block/image/youtube, listes regroupées, marks), blog-body (quickAnswerBlock, wysiwygBlock, tableBlock, ctaBlock, faqBlock), blog-post-card
app/Domain/Valuation/                  demande d'estimation (Figma 696-13105) : Data/Valuation (DTO, consts PROPERTY_TYPES apartment/duplex/studio/mansion/house/loft/building/other (« dernier étage » n'est pas un type : il est dans FLOORS) et CONTACT_METHODS phone/whatsapp/email), Actions/SendValuationRequest (stocke puis mail agence `Mail/ValuationRequestMail` + confirmation `Mail/ValuationConfirmationMail` dans la langue du propriétaire, `mail_sent_at` null si échec), Models/ValuationRequest (table valuation_requests). `EstimateController` show/store (route `estimate` GET+POST, `throttle:estimate` 5/min, `EstimateRequest` : téléphone 6-15 chiffres (E.164, même règle que le contact ; `PhoneInput` `limitMaxLength` : pas plus de chiffres que la longueur du pays), surface 5-999 m², chambres ≤ pièces, message ≤ 2000, honeypot `website`, consentement) → `pages/estimate.tsx` = eyebrow + h1 `estimate.headline` + intro GEO + `components/estimate/estimate-form.tsx` (**pas de carte** : formulaire nu à gauche (`lg:col-span-3`), à droite `estimate-recap.tsx` = carte **sticky** (`lg:top-24`, liseré sable + ombre douce comme la carte contact) qui récapitule en direct chaque champ saisi (en-tête : avatars des 3 conseillers + titre ; **jauge** : hairline `role="progressbar"` sous l'en-tête (champs requis remplis, largeur via variable CSS `--progress` — seul `style=` dynamique toléré), pastille de groupe → coche verte `animate-pop` quand le groupe est complet ; 5 groupes numérotés (questions des étapes, séparés par des `GradientHairline`) avec libellés courts `estimate.recap_labels.*`, une ligne par champ, pièces + chambres fusionnées, réponses courtes du groupe 3 sur deux colonnes séparées par un trait (`short`), atouts = nombre coché (coche verte + chiffre, pas de pastille) (noms en `sr-only` + `title`), ✓ vert quand rempli, sans compteur, `aria-live="polite"`, un `<dl>` par groupe) — décision utilisateur 2026-08-27 ; 5 étapes numérotées `step-heading` (titre gris → couleur titre quand l'étape est complète) séparées par des `GradientHairline`, **guidage** : choisir le type de bien focalise « Nom complet », choisir le mode de contact focalise la note ; **micro-validation positive** : coche verte `Valide` (sr-only) sur e-mail / téléphone (`isValidPhoneNumber`) / adresse dès qu'ils sont valides ; cartes `active:scale-98` + point radio `animate-pop` ; stepper sans animation de la valeur (glissement essayé puis retiré, décision utilisateur) ; **mobile** : récap masqué, bouton d'envoi du formulaire masqué (`hidden lg:inline-flex`, un seul bouton par écran), barre `sticky bottom-0` en fin de colonne formulaire (`lg:hidden`, colle en bas de l'écran puis part avec la section) avec le bouton d'envoi (`form=`) + bouton flèche (▲/▼, contrôlé) ouvrant le récap **sans cadre** (`frameless` : même fond `bg-card` + dégradé sable que la carte desktop, sans bordure ni ombre) dans un `Sheet` bas (voile `bg-black/30` maison au-dessus de la page, un tap le ferme) qui s'arrête au-dessus de la barre (`bottom-[calc(4.5rem+safe-area)]`, `hideClose`, fermé automatiquement au passage en desktop (`matchMedia(min-width: 64rem)`) ; la barre reste visible et cliquable : `Sheet modal={false}` (pas d'overlay ni d'`aria-hidden` sur la page), `z-60` + `onPointerDownOutside` ignoré sur la barre ; `ui/sheet.tsx` : `shadow-none`, croix `rounded-none`), `pb-24` sous le formulaire ; **envoi incomplet** : pas de requête, premier champ requis manquant (ordre de la page) marqué `estimate.required_hint` + focalisé, flag effacé à la prochaine saisie ; **brouillon** `sessionStorage` `estimate-draft` restauré à l'ouverture (jamais le consentement), effacé après envoi ; `selection-cards` = Radix RadioGroup en cartes (icônes lucide, coché = `bg-background-05 border-secondary-50`, nouveau token), `stepper-input` −/+ (input number réel, pièces 1-10, chambres 0-10 ≤ pièces), étage en `Select` (`Valuation::FLOORS` : RDC, 1-6, 7 et plus, dernier étage) + case ascenseur, atouts multi-choix `Valuation::FEATURES` (lumineux, belle vue, calme, balcon/terrasse, proche métro, hyper centre, parking, cave — colonne JSON `features`) + `Select` état général (`CONDITIONS`, « à rénover » remplace l'ancien « travaux à prévoir »), valeur estimée formatée `1 500 000` (chiffres seuls envoyés), unité m² / € en suffixe, textarea 2000 (le récap n'affiche que « Note ajoutée »), consentement, mode de contact pré-sélectionné selon la langue (EN → e-mail) + indice WhatsApp ; **erreurs serveur** : résumé `role="alert"` en tête (compteur + liens), premier champ en erreur focalisé (`lib/focus-field.ts`) ; récap : chaque ligne est un bouton « Modifier : … » qui focalise le champ ; sous le bouton : Confidentiel · Sans engagement · Réponse sous 24 h + avatar du conseiller `seo.advisor`, `estimate-success` (Figma 696-13309 / 696-13603 : cadre pointillé, badge succès, titre, **référence `VAL-{année}-{id}`** (accesseur `ValuationRequest::reference`, flash `valuation_reference` → `flash.valuationReference`, bouton copier) , carte conseiller `seo.advisor` (photo carrée, chips expérience / langues / délai), 3 prochaines étapes (1 faite ✓, 2 en cours, 3 à venir ; pointillés horizontaux desktop / verticaux mobile), CTA « Découvrir nos biens » → `buy`) remplace formulaire + récap ; la référence figure aussi dans les deux mails). Textes `ui.estimate.*`.
app/Domain/Newsletter/                 inscription newsletter : Data/NewsletterSubscription, Actions/SubscribeToNewsletter (une ligne par adresse : création, ré-activation si désinscrite ; une adresse déjà active renvoie **le même succès** sans second e-mail — aucune fuite « déjà inscrit », décision utilisateur 2026-08-27), Models/NewsletterSubscriber (table newsletter_subscribers, e-mail unique, subscribed_at/unsubscribed_at). NewsletterController show/store (throttle:newsletter 5/min, honeypot `website`), prop `nextIssue` = lundi courant ou prochain lundi (iso + libellé localisé) ; flash dédié `newsletter_success` → `flash.newsletter` (`flash.success` reste réservé au contact) ; fréquence **hebdomadaire, le lundi** partout (page, llms.txt) → pages/newsletter.tsx (Figma 262-7802 : fond dégradé pleine largeur `from-background-05 to-background to-60%` (bandeau `w-screen` absolu — les vagues SVG animées du Figma ont été construites puis **retirées**, décision utilisateur 2026-08-27), `<PageEyebrow>` (`components/page/page-eyebrow.tsx`, surtitre = `pages.<key>.title` ; sur contact = `nav.contact_page` « Contactez-nous ») + h1 + phrase-réponse, components/newsletter/newsletter-form (carte bg-grey-5 `max-w-xl`, e-mail + bouton sur une ligne — label `sr-only` via `FormField hideLabel`, erreur sous la ligne entière via `FormField externalError`, `enterKeyHint="send"` —, avatars + date (pas de ligne de promesse ni de mention d'auteur : retirées, décision utilisateur 2026-08-27), pilule ShieldCheck « pas de spam », shimmer de bordure **2 passages puis immobile** ; succès = titre + date de la 1re édition + CTA blog / accueil) + newsletter-benefits (3 colonnes orientées « ce que je reçois » : opportunités / chiffres du marché / analyses en 3 min, icônes lucide BadgeCheck/ChartNoAxesCombined/Timer, hairlines en dégradé). **Bloc d'inscription compact dans le footer** (`components/footer/newsletter-signup.tsx`, même route, même flash) — UX revue le 2026-08-27 (décision utilisateur). E-mail de bienvenue `Mail/NewsletterWelcomeMail` (vues `mail/newsletter-welcome(-text)`, textes `ui.mail.newsletter_*`, langue de l'abonné, `welcome_sent_at` null si l'envoi échoue). Pas encore de lien de désinscription (le mail invite à répondre). Lien dans le footer (`useFooterNavItems`).
app/Http/Controllers/FaqController.php   page FAQ (`/questions-frequentes` ↔ `/en/faq`) : `faq.categories` dans `lang/{locale}/ui.php` (4 thèmes buying/selling/investing/working, 10 questions chacun, réponses autonomes) → `pages/faq.tsx` = `<PageEyebrow>` + h1 + intro + `components/faq/faq-tabs.tsx` (Figma 696-10782 desktop / 696-10837 mobile : **Radix Tabs** — colonne de thèmes à gauche en desktop (`sticky top-24` sous le header, rangées pleine largeur, mêmes surfaces que l'accordéon : actif = `bg-background-08` + couleur titre, hover = `bg-background-05`, jamais de changement de graisse ni de capitales, compteur de questions `tabular-nums` à droite), sur mobile **le même style et la même taille** (`text-sm`, rangées sable) en bande défilante (snap, `scrollIntoView` du thème actif, fondu à droite — pilules à bordure puis trait dessiné essayés et retirés, décision utilisateur) ; panneau = `ui/accordion.tsx` (variante Figma 278-10243/10244 : bloc `p-6`, fond `bg-background-08` ouvert, hover `bg-background-05`, question `text-base font-semibold` muted → foreground, icône `components/page/accordion-toggle-icon.tsx` plus → moins), 1ʳᵉ question ouverte, h2 `sr-only` par thème car Radix rend les questions en `<h3>`) ; JSON-LD `faqPage()` sur toutes les questions (réponses passées par `stripFaqMarkup`) + breadcrumb ; lien dans le footer. **Au-dessus du design** : recherche client intégrée en tête de la colonne des thèmes (`faq-search.tsx` : encadré `bg-card`, loupe à gauche, chip `kbd` « / » à droite — la touche `/` focalise le champ ; libellé `sr-only` ; question + réponse, sans accents ; ≥ 2 caractères ; résultats à plat dans le panneau avec le thème en surtitre, tous ouverts, thèmes grisés ; aucun → CTA contact ; choisir un thème efface la recherche), **ancres** `#slug-du-theme` / `#slug-de-la-question` (slugs `Str::slug` calculés dans `FaqController`, restaurés au chargement avec scroll, `history.replaceState` en naviguant), questions ouvertes **mémorisées par thème**, bouton « Tout ouvrir / Tout replier » par thème, CTA « Vous n'avez pas trouvé ? » (`faq-cta.tsx` : bande sable `bg-background-08` d'une ligne, `Button variant="outline"` (bordure seule, fond transparent, avatar du conseiller `seo.advisor.photo` à gauche du libellé, pas d'icône) vers contact — choisi parmi 10 variantes ui.sh) en fin de thème et en état « aucun résultat ». Liens dans les réponses : mini-markup `[libellé](nom.de.route)` dans `ui.php` (`lib/faq-markup.ts` parse/strip, `faq-answer.tsx` rend des `<Link prefetch>` avec `linkClass`) — `FaqTest` vérifie que chaque route citée existe
app/Domain/Legal/Data/LegalPage.php    pages légales (privacy/legal/terms) depuis lang/{locale}/legal.php → LegalController → pages/legal.tsx
app/Domain/Localization/Support/LocalizedUrls.php   page courante dans chaque langue (hreflang, switcher)
lang/{fr,en}/ui.php · routes.php       textes UI partagés au front · slugs d'URL traduits
resources/js/hooks/use-translation.ts  t() / tc() côté React
resources/js/hooks/use-scrolled.ts     header compact après 24px de scroll (SSR-safe)
resources/js/hooks/use-scroll-direction.ts  masque le header mobile au scroll bas, le ramène au scroll haut (hystérésis 8px)
resources/js/components/language-switcher.tsx
resources/js/layouts/public-layout.tsx  layout des pages publiques (SiteHeader + <main>) — toute page publique l'utilise
resources/js/components/page/page-backdrop.tsx  façade haussmannienne en hairlines SVG (toit à la Mansart + lucarnes, double corniche, balcon filant, travées de 192px) derrière l'en-tête de toute page publique **hors hero** (montée par `PublicLayout`) : `text-border`, `opacity-20`, fondue par l'utilitaire `backdrop-fade` (`app.css`, masque bas + côtés — les `mask-*` Tailwind n'existent qu'en 4.1), `hidden sm:block`, `aria-hidden`. Décision utilisateur 2026-08-27 : « très léger », filigrane, jamais un motif visible
resources/js/components/layout/        site-header (assemblage, Figma 137-2085 / 125-361 / 137-3488), site-footer (Figma 261-5543, variante « wordmark en tête » choisie), brand-logo
resources/js/components/home/hero.tsx   hero HP (Figma 123-304, `PublicLayout hero`) : bord à bord sur mobile / cadre 12px aligné sur le header en desktop, révélation au chargement (fondu + zoom 1.05→1, titre et CTA en cascade), passe-partout `border-white/15` inset 12px, photo responsive `public/images/home/hero-{800,1200,2000}.jpg` (srcSet), voile + dégradé, h1 Montserrat medium, CTA `variant="neutral" size="lg"`
resources/js/components/footer/        social-links (réseaux depuis config/seo.php `social`), contact-list (une seule phrase avec le téléphone, sans lien ni icône), footer-column, footer-nav (mêmes entrées que le header), legal-bar (© + liens légaux vers les vraies pages), brand-wordmark (wordmark contour pleine largeur en tête du footer)
resources/js/components/navigation/    nav-link (lien + hover ellipse + focus-ring), nav-divider, nav-items (entrées + useIsActive), menu-toggle-icon (3 traits → croix), mobile-menu-toggle (bouton 72×48, aria-expanded/controls), mobile-menu-panel (Figma 137-3968 : panneau **sous la barre** qui reste en place — `absolute top-full`, hauteur `100dvh − barre` (4.5rem / 4rem compact), glissement 700 ms + liens en cascade, CTA + LanguageLinks épinglés en bas, scroll body verrouillé, Échap, swipe haut, fermeture auto ≥ lg, focus sur le 1er lien). État `menuOpen` dans site-header. Hairline en dégradé sous la barre : **toujours visible sur mobile**, n'apparaît qu'au scroll en desktop (décision utilisateur 2026-08-27)
resources/js/components/seo/           seo-head (<SeoHead/>), seo-breadcrumbs, seo-image
resources/js/components/i18n/          language-links (« EN | FR » inline, Inter medium, inactif à 50 % — menu mobile, footer), language-switcher (DropdownMenu shadcn, ouverture au clic/clavier uniquement — pas au survol, décision utilisateur), flag (SVG)
resources/js/lib/hover-surface.ts      classes du hover « premium » (ellipse bas→haut, bg-background-05)
resources/js/components/ui/            composants shadcn (ajouter avec `npx shadcn@latest add <name>`)
resources/js/pages/                    une page Inertia = un fichier .tsx (nom = Inertia::render('nom'))
resources/views/app.blade.php          layout racine. Pas de <title> statique : il vient de <Head>/@inertiaHead. Google Tag Manager via `<x-analytics.gtm-head/>` (tout en haut du <head>) et `<x-analytics.gtm-body/>` (juste après <body>) — `resources/views/components/analytics/`, rendus uniquement si `services.gtm.id` (`GTM_ID`) est défini : jamais d'ID en dur, vide en local/tests. Conteneur prod : `GTM-NNPNBZTS` (à renseigner dans Laravel Cloud). Test `tests/Feature/GoogleTagManagerTest.php`
config/inertia.php                     ssr.enabled ← INERTIA_SSR_ENABLED (.env)
vite.config.js                         alias 'ziggy-js' → vendor/tightenco/ziggy (requis pour le build SSR)
```

## Architecture (DDD pragmatique, conventions Laravel)

Principe : **Laravel reste le cadre** (routing, Eloquent, validation, Inertia) ; la logique métier sort des contrôleurs
vers des modules de domaine explicites. Pas de couches abstraites inutiles (pas de repositories génériques, pas
d'interfaces à implémentation unique).

```
app/
├── Domain/<Contexte>/          un dossier par contexte métier (Search, Seo, plus tard Catalog, Billing…)
│   ├── Actions/                une classe = un cas d'usage, invocable (__invoke), injectée dans le contrôleur
│   ├── Data/                   DTO / value objects `final readonly`, fabriques `fromRequest()`
│   ├── Models/ (si propre au contexte — sinon app/Models pour les modèles partagés comme User)
│   ├── Queries/                query builders / Scout complexes réutilisables
│   ├── Events/, Listeners/, Policies/, Exceptions/ au besoin
│   └── Support/                helpers sans état (builders robots/llms/sitemap)
├── Http/                       couche de livraison : contrôleurs fins, FormRequests, Middleware, Resources
├── Console/Commands/           CLI fine, délègue au Domain
├── Models/                     modèles Eloquent partagés
└── Providers/
```

Règles :
1. **Contrôleur = orchestration** : construit un DTO depuis la requête, appelle une Action, rend Inertia. Aucune règle métier dedans.
2. **Action = un verbe** (`SearchContent`, `PublishArticle`). Retourne un objet de domaine ou un DTO, jamais une Response.
3. **DTO immuables** (`final readonly class`), validation dans les FormRequests, pas dans les DTO.
4. **Le front est miroir** : `resources/js/pages/<contexte>/…`, composants réutilisables dans `components/`, utilitaires dans `lib/`. Les types TS des props reflètent `toArray()` des DTO.
5. Un nouveau contexte = dossier `app/Domain/X` + tests `tests/Feature/X*Test.php` (PHPUnit classes, pas Pest).
6. Dépendances inter-contextes via Actions publiques ou Events, jamais en attaquant les modèles d'un autre contexte.

Exemples en place : `Domain/Search` (SearchQuery DTO → SearchContent action → SearchResults), `Domain/Seo/Support` (RobotsTxt, LlmsTxt, SitemapBuilder).

## Conventions front (React / TypeScript)

Arborescence `resources/js/` — **par responsabilité, jamais par type** :
```
app.tsx / ssr.tsx        entrées client / SSR
pages/<route>.tsx        une page Inertia = une route (nom = Inertia::render('home')) ; sous-dossiers = groupes de routes (auth/, settings/)
layouts/                 enveloppes de page : public-layout (SEO/SSR), app-layout (privé), auth-layout
components/ui/           shadcn uniquement (`components.json` : style **new-york**, Tailwind v4 → `"config": ""`) — jamais modifié à la main sauf variantes ; ajouter/mettre à jour via `npx shadcn@latest add <name> [--overwrite]`
components/<feature>/    composants métier groupés par feature : layout/, navigation/, seo/, i18n/ (+ racine = kit privé app-*, nav-*)
hooks/use-<x>.ts(x)      hooks React (`useX`)
lib/                     helpers purs sans React (json-ld, hover-surface, utils)
types/index.ts           types partagés Inertia (SharedData, props communes)
```

Nommage
- Fichiers **kebab-case** (`blog-post-card.tsx`), composant **PascalCase en export default** portant le même nom (`BlogPostCard`). Un composant par fichier.
- Props typées `type XxxProps = {...}` juste au-dessus du composant ; hooks `useXxx` ; constantes de classes `xxxClass` ; clés de traduction en `snake_case` (`blog.read_time`).
- Composants préfixés par leur domaine quand le nom seul est ambigu (`SeoHead`, `SeoImage`, `NavLink`, `BlogBody`, `BrandLogo`).

Blocs / composition
- **Une page = `<SeoHead/>` + un layout + du contenu**. Jamais de `<SiteHeader/>` ni de `<main>` dans une page : c'est le rôle de `PublicLayout`.
- Tout élément répété ou nommé dans le Figma a son composant (lien de nav, séparateur, colonne, carte promo, switcher…). Un fichier d'assemblage (`site-header.tsx`) ne contient que de la composition et de l'état.
- Texte : jamais en dur, toujours `t()` / `tc()` (FR + EN). Liens : `route('name')` (déjà localisé), `<Link prefetch>` pour la nav.
- **Échelle typographique du site public — les tailles Figma ne sont PAS les bonnes** (décision utilisateur 2026-08-27, référence = page contact) : `h1` de page `text-3xl font-semibold tracking-tight text-balance sm:text-4xl` ; `h2` de section `text-2xl font-medium tracking-tight` ; `h3` / titre de carte `text-lg font-medium` (ou `text-xl` max) ; paragraphe / intro `text-base/7 sm:text-sm/6` en `text-muted-foreground` (mobile plus grand que desktop), **`text-pretty` sur tout sous-titre / intro** (pas d'orphelin en fin de paragraphe ; `text-balance` réservé aux titres) ; eyebrow / surtitre (`<PageEyebrow>`) `text-xs font-medium uppercase tracking-wider text-muted-foreground` ; mentions `text-xs`. **Espacement de l'en-tête de page** (eyebrow → h1 → intro, référence = page newsletter, décision utilisateur 2026-08-27) : conteneur `flex flex-col gap-4`, identique mobile/desktop, sur toutes les pages (contact, newsletter, services…). **Espacement vertical des pages** : c'est `PublicLayout` qui le porte (`py-16 sm:py-20` — référence newsletter/contact, décision utilisateur 2026-08-27) ; une page n'ajoute jamais son propre `py-*` de haut/bas. Jamais `text-5xl`, `text-lg` pour un paragraphe ni les px de la maquette : on lit la hiérarchie du Figma, pas ses valeurs.
- **Figma = intention, pas pixel** : on arrondit toujours aux pas de l'échelle Tailwind (`p-6/10/12`, `min-h-96/112/128`, `text-5xl/6xl`…) et aux variantes shadcn existantes (`size="lg"`), jamais de valeur arbitraire (`h-[52px]`, `w-[220px]`) pour coller à la maquette.
- Style : **100 % classes Tailwind**, zéro `style=`, zéro hex dans le JSX. Couleurs via tokens sémantiques (`bg-card`, `text-foreground`, `bg-background-05`…), tailles sur l'échelle Tailwind (`h-10`, `h-18`, `w-85`), polices via `font-sans` / `font-heading`, tailles de texte par défaut (`text-sm`, `text-base`, `text-xl`).
- Variantes Button ajoutées/ajustées à la source (`ui/button.tsx`) : `variant="neutral"` (blanc sur photo, hover sable) ; `variant="outline"` = **bordure seule, fond transparent**, hover `bg-background-05` (décision utilisateur 2026-08-27, pour poser un bouton sur une surface teintée). Pas de taille custom : on reste sur `sm` / `default` / `lg`.
- **Angles : droits ou pleinement ronds, jamais entre les deux** (décision utilisateur, 2026-08-25). *Surfaces et contrôles = `rounded-none`* : boutons, champs (`input`, `select`, `textarea`), cartes, images, panneaux/menus, alertes, header, lien « Aller au contenu », focus rings. *Pilules = `rounded-full`* : badges de statut/tag (« Ouvert », « Siège », « Conseillers disponibles »), disques des réseaux sociaux, avatars, point de statut. Un `rounded-sm/md/lg/xl` n'a pas sa place sur le site public : si un composant shadcn ajouté en apporte un, le passer à `rounded-none` dans la variante (`ui/*.tsx`), sauf s'il s'agit d'un badge/avatar.
- **Séparateurs = hairline en dégradé** (décision utilisateur 2026-08-27) : entre des blocs de contenu (avantages newsletter, coordonnées contact, footer) on utilise `<GradientHairline>` (`components/layout/gradient-hairline.tsx`, 1px `via-border` fondu aux deux bouts ; prop `vertical` pour les colonnes desktop), jamais `divide-y` / `border-t` pleins.
- **Pas d'ombres** (`shadow-*`) sur le site public — **une exception** : la carte du formulaire de contact porte une ombre douce (`shadow-lg shadow-black/5`, Figma 261-7411, décision utilisateur 2026-08-27) — décision utilisateur « premium » : `shadow-xs` retiré des variantes de `ui/button.tsx`, `shadow-none` sur les panneaux (dropdown). Si un composant shadcn ajouté en apporte une, la retirer dans la variante, pas sur l'instance.
- Composants shadcn utilisés **tels quels** (`<Button size="lg">`) : pas de `h-12 px-4` sur une instance. Si le design diverge du composant, on change la variante dans `components/ui/`, une fois.
- États de nav : couleur/fond uniquement, jamais de changement de `font-weight` entre default/hover/actif.
- **Hover des liens texte = trait qui se dessine** (décision utilisateur 2026-08-27) : tout lien texte du site public (« Voir sur Google Maps », liens légaux, titres d'articles, fil d'Ariane, résultats de recherche…) utilise `linkClass` de `lib/hover-surface.ts` (hairline `after:` sous le texte, dessinée gauche→droite au hover/focus, sortie à droite) — jamais `hover:underline`. Les liens de nav gardent `hoverSurfaceClass` (même trait, avec le padding du bouton). Exception : les liens dans le corps des articles (`portable-text`) restent soulignés en permanence (lisibilité).
- Accessibilité clavier : utilitaire **`focus-ring`** (`app.css`, ring 3px `--ring/50`, visible uniquement au clavier via `focus-visible`) sur tout élément interactif custom (liens de nav, logo, items de menu) — les composants shadcn l'ont déjà. Lien « Aller au contenu » (`a11y.skip_to_content`) + `<main id="main" tabIndex={-1}>` dans `PublicLayout`. `aria-label` sur les `<nav>`, `aria-expanded/controls` sur les déclencheurs, `aria-current="page"`, `motion-reduce:` sur les animations. Les menus (Radix) gèrent flèches / Échap / Tab nativement.
- SEO des liens : un lien de nav doit pointer vers une vraie URL (`route()`), jamais `#` en prod. Pages de service `contact` / `estimate` / `sell` / `buy` (routes nommées, slugs SEO `contact`, `estimation-immobiliere-paris`, `vendre-immobilier-paris`, `acheter-immobilier-paris` ↔ `contact`, `property-valuation-paris`, `sell-property-paris`, `buy-property-paris`) : squelettes `pages/<key>.tsx` = `PublicLayout` + `<PageIntro page>` (`components/page/page-intro.tsx` : SeoHead + fil d'Ariane + h1 + phrase-réponse, textes `ui.pages.<key>.*`), **contenu à venir**. Pages légales : routes `privacy` / `legal` / `terms` (slugs traduits), contenu placeholder dans `lang/{fr,en}/legal.php` **à faire valider juridiquement**.
- **Icônes : `lucide-react` uniquement** (`import { X } from 'lucide-react'`), taille via classe `size-*` (défaut `size-4` dans les boutons shadcn). Jamais de SVG d'icône écrit à la main, jamais d'autre lib (Heroicons, FontAwesome, react-icons…). Exception : les **logos de marques** (réseaux sociaux) sont des fichiers SVG dans `public/images/social/` rendus en `<img>`, car ce sont des logos, pas des icônes — et Threads n'existe dans aucune lib. Les `<svg>` du kit (`app-logo-icon.tsx`, zone privée) sont à remplacer par nos assets si la zone privée est reprise.
- Ordre des classes géré par Prettier (plugin Tailwind) — ne pas le combattre.

Avant de livrer un composant : `npx tsc --noEmit`, `npm run lint`, `npm run format`, et si page publique : `curl` du HTML SSR.

## Internationalisation (FR / EN)

Package : `mcamara/laravel-localization` (config `config/laravellocalization.php`, locales `fr` (défaut) et `en`).

URLs
- **Français (défaut) à la racine, anglais sous `/en`** (`hideDefaultLocaleInURL = true`) : `/`, `/recherche`, `/mentions-legales` ↔ `/en`, `/en/search`, `/en/legal-notice`. Toute URL `/fr/...` → **301** vers la version sans préfixe (middleware `CanonicalUrl`, global, avant le routing — le package ne faisait qu'un 302).
- **Pas de redirection par `Accept-Language`** (`useAcceptLanguageHeader = false`) : `/` sert toujours le FR (Googlebot envoie souvent `en-US` et ne verrait jamais la home FR). **Aucune mémorisation cookie/session** (`localeCookieRedirect` retiré : il renvoyait `/` vers `/en` après un passage en anglais — bug rencontré). Le switcher est explicite, l'URL est la seule source de vérité ; `hreflang` + `x-default` (= FR) guident les moteurs.
- **Slugs traduits** dans `lang/{fr,en}/routes.php` (`'search' => 'recherche' | 'search'`), déclarés avec `LaravelLocalization::transRoute('routes.search')` dans le groupe localisé de `routes/web.php`. `/en/recherche` = 404 (pas de doublon).
- Les routes auth/settings/dashboard restent **sans préfixe** (zone privée, `no-ssr`) ; la langue y suit la session/cookie.
- `route('search')` (PHP **et** JS via Ziggy) génère déjà l'URL de la locale courante — ne jamais concaténer `/fr` à la main. Pour une autre locale : `LaravelLocalization::getLocalizedURL('en')` ou la prop partagée `localization.alternates`.
- ⚠️ `php artisan route:cache` ne marche pas avec les routes traduites : utiliser `php artisan route:trans:cache` (et `route:trans:clear`) en prod.
- Tests : les routes sont enregistrées avant la requête → `$this->withLocale('en')` (helper `tests/TestCase.php`) avant `get('/en/...')`. Pour le FR, `withLocale('fr')` (ou rien) = routes sans préfixe. Le helper compare à `app.fallback_locale` car le package mute `app.locale` à chaque requête.

Chaînes
- **UI** : `lang/fr/ui.php` + `lang/en/ui.php` (clés sémantiques imbriquées : `nav.search`, `search.results`…). Partagées au front par `HandleInertiaRequests` (`translations`) et lues via le hook **`useTranslation()`** : `t('nav.search')`, `t('search.title_with_term', { term })`, `tc('search.results', count)` (pluriel syntaxe Laravel `{0} …|{1} …|[2,*] …`). Côté PHP : `__('ui.nav.search')`. **Toujours ajouter la clé dans les deux fichiers.**
- **Système** (validation, auth, pagination…) : `lang/fr/*.php` + `lang/fr.json` installés par `laravel-lang/common` (`php artisan lang:update` après une montée de version Laravel).
- **Contenu BDD** (à venir) : `spatie/laravel-translatable` (colonnes JSON `{fr, en}`), un slug par langue.

SEO multilingue (automatique via `<SeoHead/>`)
- `<html lang>` suit la locale ; `og:locale` = regional courante (`fr_FR` / `en_GB`) + `og:locale:alternate`.
- `hreflang` `fr`, `en`, `x-default` (= fr) injectés par défaut depuis `localization.alternates` (page courante dans chaque langue, calculée par `Domain/Localization/Support/LocalizedUrls`). Omis sur les pages `noindex`. Surcharger avec la prop `alternates` si une page n'a pas de jumelle.
- Sitemap : chaque URL dans chaque langue + `xhtml:link` alternates (`SitemapBuilder`). `llms.txt` liste FR et EN. `robots.txt` bloque `/fr/recherche?*` et `/en/search?*`.
- Switcher de langue `<LanguageSwitcher/>` : vrais liens `<a hreflang lang>` vers la page jumelle (crawlable), présent dans le header desktop et mobile.
- Canonical = URL de la langue courante (jamais cross-langue).

Ajouter une page publique
1. Clé de slug dans `lang/fr/routes.php` et `lang/en/routes.php`.
2. Route dans le groupe localisé : `Route::get(LaravelLocalization::transRoute('routes.xxx'), …)->name('xxx')`.
3. Textes dans `ui.php` (fr + en), `<SeoHead>` avec `title`/`description` traduits.
4. Entrée dans `SitemapBuilder::pages()` (`'path' => 'routes.xxx'`).

## Règles SSR / SEO

1. **Pages publiques = SSR** (défaut). **Pages privées = `no-ssr`** : les groupes `auth` de `routes/web.php` et `routes/settings.php` portent déjà le middleware. Un crawler n'y entre jamais, inutile de les rendre côté serveur.
2. Chaque page publique utilise `<SeoHead title description [canonical] [noindex] [image] [jsonLd]>` au lieu de `<Head>` nu. `title` est suffixé automatiquement par " - {APP_NAME}".
3. Pas d'accès à `window` / `document` / `localStorage` au rendu (casse le SSR). Les mettre dans `useEffect`, ou isoler le widget dans un composant monté après hydratation.
4. `route()` fonctionne côté serveur grâce à la prop partagée `ziggy` ; ne pas la retirer de `HandleInertiaRequests`.
5. Sémantique : un seul `<h1>` par page, `<main>`, `<nav aria-label>`, liens texte dans le header (pas d'icônes).
6. Fonts **self-hosted** : `public/fonts/*.woff2` (sous-ensembles latin + latin-ext copiés de fontsource), déclarées dans `resources/css/fonts.css` (`font-display: swap`), les deux fichiers latin sont **préchargés** dans `app.blade.php`. Aucun appel Google/bunny, plus de dépendance fontsource : `font-sans` = **Inter** (texte), `font-heading` = **Montserrat** (appliqué par défaut à h1-h6 dans `app.css`). Tailles Tailwind standard, mobile plus grand que desktop (`text-base/7 sm:text-sm/6`).
7. Images : utiliser `<SeoImage alt width height [priority]>` (lazy/async par défaut, `priority` pour le LCP). `alt` obligatoire.
8. Liens internes : `<Link prefetch>` pour les liens de navigation (précharge au hover).

## Pattern « page de recherche » (`/recherche`)

- Premier hit en SSR : `<h1>`, title/meta dynamiques, résultats dans le HTML.
- Raffinement côté client : `router.get(route('search'), {q}, { only: ['results','seo'], preserveState, replace })` → **partial reload** (seuls `results` + `seo` sont renvoyés en JSON), debounce 300 ms, URL mise à jour et partageable.
- Indexation : seule `/recherche` vide page 1 est `index`. `?q=` ou `page>1` → `noindex, follow` (géré par la prop `seo.noindex` côté contrôleur). `rel="prev|next"` émis pour la pagination.
- `LocalizedUrls` appelle `getLocalizedURL($code, null, [], false)` : le 4e paramètre (`forceDefaultLocation`) à `true` réinjecterait `/fr` dans les hreflang — bug déjà rencontré.
- Les props d'indexation de la page s'appellent `indexing` (pas `seo`, réservé à la prop partagée globale — collision déjà rencontrée).
- Pour les listings SEO durables, créer des **URL propres** (`/recherche/{slug}`, `/categorie/{slug}/{ville}`) rendues en SSR et ajoutées au sitemap, plutôt que des query strings.
- Brancher les vraies données : remplacer le dataset placeholder de `SearchController` par un `Model::query()`/Scout + `paginate()`, garder la forme `{data,total,current_page,last_page}`.

## Logo & identité

- Assets de marque dans `public/brand/` : `logo-mark.svg` (pictogramme seul, footer), `wordmark-outline.svg` (filigrane footer), icônes sociales `public/images/social/*.svg` (12px blanc, Figma) ; lauriers dorés `public/images/laurel-{left,right}.svg` (repris du projet RIP, élément de confiance du hero) ; `logo_dark_desktop.svg` (213×24) et `logo_dark_mobile.svg` (112×28) = artwork foncé `#202832` pour fond clair (fournis par l'utilisateur). Les variantes `logo_light_*.svg` (dark mode) sont **générées** par `sed 's/#202832/#f0f1f3/g'` ; à régénérer si les logos changent.
- Composant **`<BrandLogo priority?>`** (`components/brand-logo.tsx`) choisit mobile/desktop (`sm:`) et dark/light (`dark:`). À utiliser partout, jamais un `<img>` direct.
- `favicon.svg` = **le pictogramme clé sur carré sable `#E3D0B5`** (généré depuis `brand/logo-mark.svg`, viewBox 64×64 — plus la copie du wordmark 112×28, illisible en favicon). JSON-LD Organization → `logo_dark_desktop.svg` (`config/seo.php`).
- **Favicons (fournis 2026-08-29, `public/`)** : `favicon.ico` (16/32/48 multi-tailles), `favicon-16x16.png`, `favicon-32x32.png`, `favicon.svg` (navigateurs modernes), `apple-touch-icon.png` (180×180, iOS), `android-chrome-{192,512}x{192,512}.png` + variantes **`-maskable`** (même artwork sur fond blanc avec la zone de sécurité de 20 %, générées par `sips`) référencées dans `site.webmanifest` (`name`/`theme_color` alignés sur `config/seo.php`, `purpose: any|maskable`, `start_url` `/`). Déclarés dans `app.blade.php` ; `FaviconTest` vérifie existence, tailles, `<link>` et manifest. Reste **`public/og-default.png` (1200×630) = placeholder à remplacer**.
- Le nom affiché (`alt`, titres) vient de `SEO_SITE_NAME` / `APP_NAME`.

## Design system (Figma Color Kit)

Source : Figma « Website » › Color Kit (node `62-435`). Tokens dans `resources/css/tokens.css` (`@theme static`) :

- Palettes 10→100 (clair→foncé) : `primary-*` (50 = Light, **60 = Main `#202832`**), `error-*`, `success-*`, `warning-*`, `info-*`, `grey-*` (+ `grey-5` surface). Utilitaires Tailwind directs : `bg-primary-60`, `text-grey-70`, `border-error-30`…
- Texte : `text-text-heading` `#0f1b29`, `text-text-body` `#545b67`, `text-text-disabled`.
- **Sémantique shadcn** (`bg-primary`, `bg-muted`, `text-muted-foreground`, `border-border`…) remappée sur la palette dans `app.css` (`:root` / `.dark`). **Toujours préférer les tokens sémantiques** dans les composants ; les nuances brutes servent aux cas précis (graphiques, états).
- Statuts ajoutés : `bg-success`, `bg-warning`, `bg-info` (+ `-foreground`), cohérents light/dark.
- Modifier une couleur = modifier `tokens.css` ou le mapping `app.css`, jamais un hex en dur dans un composant. Plus aucun hex hérité du kit dans les pages publiques.
- Pour ré-extraire la palette : `get_variable_defs` + `get_design_context` par groupe (`62:1542` Primary, `62:2468` Error, `62:2727` Success, `62:2985` Warning, `62:3243` Info, `62:4016` Grey).

## SEO / GEO — checklist complète (état actuel)

Infrastructure
- [x] SSR Inertia (HTML complet au premier hit), `no-ssr` sur les zones privées
- [x] URL canoniques : middleware `CanonicalUrl` (prod) → 301 vers host/scheme d'`APP_URL`, sans trailing slash ; `URL::forceScheme('https')` en prod
- [x] Bilingue FR/EN : URLs préfixées + slugs traduits, `hreflang` + `x-default`, `og:locale(:alternate)`, sitemap multilingue (voir Internationalisation)
- [x] Pages d'erreur 403/404/500/503 via Inertia (`pages/error.tsx`) avec **vrai code HTTP** et `noindex`
- [x] `robots.txt` et `llms.txt` dynamiques (`SeoController` ← `Domain/Seo/Support`), sitemap XML avec `lastmod` régénéré chaque jour
- [x] Favicons (ico + svg), `apple-touch-icon`, `site.webmanifest`, `theme-color`

Meta title & description — conventions (testées par `tests/Feature/SeoMetaLengthTest.php`)
- Chaque page publique a ses clés **`<page>.seo_title`** et **`<page>.seo_description`** dans `lang/{fr,en}/ui.php` (distinctes du `title` utilisé pour le `<h1>` / la nav). Les passer à `<SeoHead>`.
- **Title : 50-60 caractères max (jamais > 60), 30 minimum**, suffixe ` · Estate in Paris` **compris** (sauf home, `withSuffix={false}`, où la marque ouvre le titre). Mot-clé principal au début, bénéfice/lieu ensuite, pas de suite de mots-clés, pas de « Accueil » / « Bienvenue ». Unique sur tout le site. Format : `{Mot-clé principal} {à Paris / précision} · Estate in Paris`.
- **Description : 120-160 caractères**, une phrase active qui répond à l'intention de recherche, contient le mot-clé principal + « Paris » de façon naturelle, se termine par une incitation (« découvrez », « trouvez », « contactez »). Jamais tronquée par Google (< 160), jamais dupliquée entre pages, jamais identique au title.
- Pages dynamiques (bien, article) : construire le title depuis les données (`{Type} {pièces} {quartier} · Estate in Paris`) et **tronquer proprement** à 60 (couper sur un mot, `…`) ; description générée depuis le résumé, même règle 120-160.
- Pages `noindex` (résultats filtrés, pagination > 1) : title/description quand même renseignés (affichés dans l'onglet, partagés sur les réseaux).
- OG/Twitter : `og:title` = title sans suffixe si > 60 ; `og:description` = description. Vérifier au `curl` : une seule balise `<title>`, une seule `meta description`.

Par page (`<SeoHead/>`)
- [x] `<title>` unique suffixé ` · Site` (`withSuffix={false}` sur la home), `meta description`, `canonical`
- [x] `robots` : `index, follow, max-image-preview:large, max-snippet:-1` ou `noindex, follow`
- [x] Open Graph complet + Twitter `summary_large_image`, image par défaut `public/og-default.png` (**placeholder 1200×630 à remplacer**)
- [x] `rel=prev/next` pagination, `hreflang` automatique (surchargeable via `alternates`)
- [x] JSON-LD via `lib/json-ld.ts` : `siteGraph()` (**RealEstateAgent**+Organization avec adresse, téléphone, e-mail, `openingHours`, `areaServed`, `priceRange`, `aggregateRating` + WebSite/SearchAction — home uniquement), `breadcrumbList()`, `faqPage()`, `article()`, `itemList()`
- [x] BreadcrumbList JSON-LD sur toute page (`breadcrumbList()` dans `<SeoHead>`) ; le fil d'Ariane **visible** (`<SeoBreadcrumbs/>`) uniquement sur les pages à ≥ 2 niveaux (article de blog, fiche de bien) — jamais sur une page de premier niveau (contact, services : décision utilisateur 2026-08-27)

GEO (Generative Engine Optimization — être cité par ChatGPT/Perplexity/AI Overviews) — **règle absolue, chaque page**
- **Réponse d'abord** : le premier paragraphe sous le `<h1>` répond directement à l'intention de la page en 1-2 phrases factuelles, autonomes (citables hors contexte : nom de la marque + sujet + lieu). Pas de « Bienvenue ».
- **H2 formulés en questions** quand c'est naturel (« Comment acheter un hôtel particulier à Paris ? »), suivis d'une réponse courte puis du détail. Sections courtes, listes, tableaux pour les chiffres.
- **Faits datés et sourcés** : chiffres, prix, délais, dates, sources nommées ; `dateModified` visible sur les contenus éditoriaux.
- **FAQ** en fin de page dès qu'il y a ≥ 3 questions, balisée avec `faqPage()` (JSON-LD) et visible dans le HTML.
- **E-E-A-T** : auteur identifiable (nom, rôle) sur les articles via `article()`, page « À propos » / équipe, mentions légales réelles, `Organization`/`RealEstateAgent` complet (`sameAs`, adresse, téléphone, horaires, avis).
- **Entités cohérentes** : même nom de marque, même adresse, même téléphone partout (HTML, JSON-LD, `llms.txt`, footer). Aucune valeur placeholder ne doit atteindre la prod (test `SeoTest::test_llms_txt…` vérifie l'absence de texte d'exemple).
- **`/llms.txt`** tenu à jour : résumé FR + EN, pages principales dans les deux langues, contact, horaires. Toute nouvelle page publique indexable y est ajoutée (`LlmsTxt::build()`) en plus du sitemap.
- **Crawlers IA** autorisés sur le public (`RobotsTxt`), jamais bloqués par un rate-limit ou un challenge JS ; le contenu doit être dans le HTML SSR (pas injecté après hydratation).
- **Tests** : une page publique = test Feature qui vérifie la présence du `<h1>`, du paragraphe réponse et du JSON-LD attendu dans les props Inertia.
- [x] Crawlers IA explicitement autorisés sur le contenu public (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended)
- [x] `/llms.txt` (llmstxt.org) — **remplir `SEO_LLMS_SUMMARY`** : 2-3 phrases factuelles (quoi, pour qui, où)
- [x] Données structurées riches (Organization `sameAs`, FAQPage, Article avec auteur/dates)
- [ ] Contenu : répondre directement à la question dans les 1-2 premières phrases de chaque page, titres H2 formulés en questions, FAQ en fin de page (utiliser `faqPage()`), chiffres/dates/sources citées, page « À propos » + auteur identifiable (E-E-A-T)
- [ ] Renseigner `config/seo.php` / `.env` : `SEO_ORG_*`, `SEO_ORG_SAME_AS` (LinkedIn, X, etc.), `SEO_TWITTER`

Performance (Core Web Vitals)
- [x] Fonts self-hosted, Vite code-splitting + preload headers (`AddLinkHeadersForPreloadedAssets`), `<Link prefetch>`
- [x] `<SeoImage>` : dimensions explicites (pas de CLS), lazy/async, `priority` pour le LCP, `srcSet`/`sizes` (défaut `100vw`) pour les images de contenu
- [ ] En prod : HTTP/2 + compression (Brotli/gzip) et cache immuable sur `/build/*` côté serveur (Nginx/Forge), CDN pour les images
- [ ] Mesurer : Lighthouse / PageSpeed sur `/` et `/recherche` après chaque refonte de page

Variables d'environnement SEO (`.env`)
```
SEO_OPENING_HOURS="Mo-Sa 09:00-19:00" (+ SEO_OPENING_HOURS_FR/EN libellés)   # footer + JSON-LD openingHours
SEO_GOOGLE_RATING=4.9 / SEO_GOOGLE_REVIEW_COUNT=128 / SEO_GOOGLE_REVIEWS_URL=   # AggregateRating JSON-LD uniquement (plus de badge visible) — UNIQUEMENT des chiffres réels
SEO_ORG_EMAIL= / SEO_ORG_PHONE= / SEO_ORG_STREET= / SEO_ORG_POSTAL_CODE= / SEO_ORG_CITY=   # footer + JSON-LD
SEO_SOCIAL_LINKEDIN= / SEO_SOCIAL_INSTAGRAM=   # vide = icône masquée
MAIL_MAILER=resend / RESEND_KEY= / MAIL_FROM_ADDRESS=contact@estate-in-paris.fr   # e-mails transactionnels via Resend (package resend/resend-php, transport natif Laravel) ; domaine estate-in-paris.fr vérifié dans Resend
SANITY_PROJECT_ID= / SANITY_DATASET=production / SANITY_API_VERSION= / SANITY_TOKEN= / SANITY_BLOG_TYPE=estateBlog / SANITY_USE_CDN=false   # blog (config/services.php › sanity) ; USE_CDN=true en prod ; le token ne quitte jamais le serveur
APP_URL=https://www.exemple.fr        # base des canonical, sitemap, robots
APP_LOCALE=fr
INERTIA_SSR_ENABLED=true
SEO_SITE_NAME="Mon site"
SEO_DESCRIPTION="…"
SEO_DEFAULT_IMAGE=/og-default.png
SEO_TWITTER=@handle
SEO_ORG_NAME= / SEO_ORG_EMAIL= / SEO_ORG_PHONE= / SEO_ORG_SAME_AS=https://linkedin.com/…,https://x.com/…
SEO_LLMS_SUMMARY="…"
GTM_ID=GTM-XXXXXXX                   # Google Tag Manager, prod uniquement (vide = rien d'injecté)
```

## robots / sitemap

- `/robots.txt` et `/llms.txt` sont des **routes** (`SeoController`), pas des fichiers : l'URL du sitemap suit `APP_URL` automatiquement. Listes de chemins privés et d'agents IA dans `Domain/Seo/Support/RobotsTxt.php`.
- `public/sitemap*.xml` (index + sous-sitemaps) sont générés par `SitemapBuilder`, ignorés par git, régénérés quotidiennement par le scheduler (`php artisan schedule:run` via cron en prod). Pages statiques dans `SitemapBuilder::pageList()`, articles via `blog()`. `robots.txt` ne référence que l'index.

## Déploiement — Laravel Cloud

Hébergement : **Laravel Cloud** (déploiement automatique à chaque `git push` sur `main`). Le push ne suffit pas seul : la configuration ci-dessous doit être en place dans le dashboard Cloud.

- **Build** : `npm ci && npm run build:ssr` (pas `npm run build` : le SSR a besoin de `bootstrap/ssr/ssr.js`).
- **Deploy commands** : `php artisan migrate --force`, `php artisan config:cache`, `php artisan view:cache`, `php artisan event:cache`, `php artisan route:trans:cache`. ⚠️ Jamais `route:cache` / `optimize` (casse les routes traduites — voir Internationalisation).
- **SSR** : vérifier dans Cloud qu'un process/worker Inertia SSR est disponible pour l'app (`php artisan inertia:start-ssr`, port 13714) et le redémarrer après chaque déploiement. Si Cloud n'offre pas ce process, mettre `INERTIA_SSR_ENABLED=false` : le site rend côté client sans erreur, mais on perd le SSR (SEO) — à traiter en priorité.
- **Scheduler** : activer le scheduler Cloud (`schedule:run` chaque minute) pour la régénération quotidienne du sitemap.
- **Base / cache** : MySQL Cloud (les variables `DB_*` sont injectées par Cloud) ; le cache est en table BDD (`CACHE_STORE=database`) → les migrations doivent être passées avant le premier hit.
- **Variables d'environnement** à renseigner dans Cloud (valeurs réelles, aucun placeholder) : `APP_URL` (https, www ou non selon le domaine canonique), `APP_ENV=production`, `APP_DEBUG=false`, **`APP_LOCALE=fr` et `APP_FALLBACK_LOCALE=fr`** (bug rencontré 2026-08-29 : sans `APP_LOCALE`, l'app démarrait en anglais → URLs anglaises à la racine et françaises sous `/fr` ; `config/app.php` a désormais `fr` en défaut, test `LocalizationTest`), `INERTIA_SSR_ENABLED`, tout le bloc `SEO_*` (org, téléphone, adresse, réseaux, horaires, avis), `MAIL_*`, `GTM_ID`.
- Après le déploiement, vérifier : `curl -s https://<domaine>/ | grep '<h1'` (SSR), `/robots.txt`, `/sitemap.xml`, `/llms.txt`, redirection `/fr/...` → `/...` (301) et http → https.
- En local, `make start` / `make clean` (Makefile).

## Historique des choix

- `@inertiajs/react` épinglé en `^2` (2.3.x) : la v3 casse `createInertiaApp`, la 2.0.3 d'origine avait un typage `useForm` trop strict.
- La page démo `welcome.tsx` du kit a été remplacée par `pages/home.tsx` (PublicLayout, textes `home.*`), en attente du design Figma de la HP.
- Le callback `title:` de `createInertiaApp` a été retiré (app.tsx + ssr.tsx) : le suffixe est géré par `<SeoHead>` pour éviter « Titre - Laravel - Laravel ».
- Fonts : Instrument Sans (kit) → Inter + Montserrat self-hosted (décision utilisateur, perf), d'abord via fontsource puis en `@font-face` maison latin-only + preload.
- Header : 64px (compact 56px au scroll) ; le mega-menu « Nos biens » (mega-menu-column/-promo/-properties) a été construit puis **supprimé** (jamais branché, décision utilisateur) ; le header transparent « overlay » sur le hero a été essayé puis retiré (décision utilisateur). Header mobile : se cache au scroll bas / revient au scroll haut ; menu sous la barre (header conservé, icône → croix) avec swipe vers le haut pour fermer et fermeture auto au passage en desktop.
- Tests : PHPUnit classique, pas Pest (le kit n'installe pas Pest).
- `ui/dropdown-menu.tsx` et `ui/button.tsx` mis à jour vers le shadcn actuel (new-york / Tailwind v4 : `default h-9 px-4`, `sm h-8`, `lg h-10 px-6`, `icon size-9`, `data-slot`, icônes `size-4` par défaut sauf classe `size-*` explicite). Les autres composants `ui/` sont encore ceux du kit (style « default », Tailwind v3) : les mettre à jour un par un avec `--overwrite` quand on y touche, en vérifiant les usages du kit (auth, settings, sidebar).
- Git initialisé le 2026-08-23, remote `origin` = https://github.com/benjaminroche4/eip (branche `main`).
