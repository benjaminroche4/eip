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
app/Domain/Blog/                       blog Sanity (projet partagé avec Relocation in Paris `ks9vwq45`, types `estateBlog`/`estateAuthor`/`estateCategory` via `SANITY_BLOG_TYPE`) : Support/SanityClient (GROQ, token serveur, cache 5 min), SanityImage, PortableText, SeoText (title ≤ 60 avec/sans suffixe, description ≤ 160) ; Actions ListBlogPosts / ShowBlogPost / ListBlogUrls / ListBlogCategoryUrls ; Data BlogQuery / BlogPostSummary / BlogPost / BlogListing → décisions et détails : docs/decisions.md
app/Http/Controllers/BlogController.php /blog (+ ?page, noindex > 1, 404 au-delà), /blog/categorie/{slug} (indexable, 404 si inconnue), /blog/{slug} → pages/blog/index.tsx (article à la une, filtre par catégorie, pagination) et show.tsx (JSON-LD Article + breadcrumb + FAQPage, sommaire, carte auteur, CTA, articles liés) ; hreflang/switcher suivent le slug traduit via LocalizedUrls::override() → décisions et détails : docs/decisions.md
resources/js/components/blog/          types.ts (miroir des DTO), portable-text, blog-body (blocs Sanity), blog-post-card (cadre léger, pilule catégorie verre, avatar auteur), blog-featured-post, blog-category-filter, blog-pagination, blog-toc, blog-author-card, blog-cta, blog-tags, blog-related, blog-table, blog-faq, youtube-embed, reading-progress → décisions et détails : docs/decisions.md
app/Domain/Valuation/                  demande d'estimation : Data/Valuation (PROPERTY_TYPES, CONTACT_METHODS, FLOORS, FEATURES, CONDITIONS), Actions/SendValuationRequest (stocke + mail agence + confirmation, référence `VAL-{année}-{id}`), Models/ValuationRequest ; `EstimateController` show/store (`throttle:estimate`, `EstimateRequest`) → `pages/estimate.tsx` + `components/estimate/` : `estimate-form.tsx` (**~130 lignes, composition seule** — découpage 2026-09-22 : `useForm` + soumission + assemblage), `types.ts` (`EstimateFormData`, `EstimateStepProps`, `FIELD_ORDER`, `FORM_ID`, `MESSAGE_MAX`, `DRAFT_KEY`), **une étape = un composant** dans `steps/` (`property-type-step`, `contact-step`, `details-step`, `contact-method-step`, `more-step`, chacun reçoit `{ data, setData, errors, complete }` + ses options ; les `GradientHairline` restent dans le formulaire), `estimate-error-summary.tsx`, `estimate-mobile-bar.tsx` (barre sticky + `Sheet` du récap + voile, `matchMedia`), `estimate-recap.tsx`, `estimate-success.tsx` ; hooks `use-estimate-draft.ts` (brouillon `sessionStorage` `estimate-draft`, restauré sans consentement ni honeypot, `clearDraft()` après envoi) et `use-estimate-validation.ts` (validité e-mail / téléphone / adresse, `complete` par étape, erreurs serveur + flags locaux, `flagMissing()` = premier champ requis manquant marqué + focalisé) ; tests `estimate-form.test.tsx` + `tests/js/hooks/use-estimate-{draft,validation}.test.tsx` → décisions et détails : docs/decisions.md
app/Domain/Newsletter/                 inscription newsletter : SubscribeToNewsletter (une ligne par adresse, ré-activation, adresse déjà active = même succès sans fuite), NewsletterSubscriber ; NewsletterController (`throttle:newsletter`, honeypot, flash `newsletter_success`), hebdomadaire le lundi ; `pages/newsletter.tsx`, `components/newsletter/`, bloc compact dans le footer, mail de bienvenue `NewsletterWelcomeMail` → décisions et détails : docs/decisions.md
app/Http/Controllers/AboutController.php page « À propos » (`/a-propos` ↔ `/en/about-us`) → `pages/about.tsx` = hero photo + carte verre (`about-hero`), bandeau d'engagements (`values-marquee`), manifeste + chiffres (`agency-manifesto`), équipe (`team-grid`), témoignages de la home, valeurs (`values-list`), carte CTA ; JSON-LD AboutPage ; portraits `public/images/team/` = placeholders → décisions et détails : docs/decisions.md
app/Http/Controllers/BuyController.php page « Acheter » (`/acheter-immobilier-paris` ↔ `/en/buy-property-paris`) → `pages/buy.tsx` = `buy-hero` (photo, vidéo optionnelle `SEO_VIDEO_BUY`, chiffres clés), `buy-advantages`, `buy-strategies`, `buy-districts` (cartes style blog, prix moyen sourcé), `buy-record`, `buy-faq` (6 questions du thème Acheter), carte CTA ; photos `public/images/buy/` = placeholders, prix à vérifier avant release → décisions et détails : docs/decisions.md
app/Http/Controllers/FaqController.php page FAQ (`/questions-frequentes` ↔ `/en/faq`) : `faq.categories` (4 thèmes × 10 questions) → `pages/faq.tsx` = `faq-tabs` (Radix Tabs, accordéon `ui/accordion`), recherche client `faq-search` (touche `/`), ancres `#slug`, `faq-cta` ; mini-markup `[libellé](nom.de.route)` dans les réponses (`lib/faq-markup.ts`, `faq-answer.tsx`) ; JSON-LD faqPage + breadcrumb → décisions et détails : docs/decisions.md
app/Domain/Legal/Data/LegalPage.php    pages légales (privacy/legal/terms) depuis lang/{locale}/legal.php → LegalController → pages/legal.tsx (sections séparées par le seul espacement, hairlines retirées sur décision utilisateur 2026-09-15)
app/Domain/Content/                    contenu éditorial de `lang/{locale}/ui.php` typé et validé (refactor 2026-09-22) : Data = DTO `final readonly` `Arrayable` (TeamMember ← `team.members`, Testimonial ← `testimonials.items` (photo optionnelle : clé omise si absente), SuccessStory ← `stories.items`, Stat ← `about.stats`, District ← `buy.districts.items`, Strategy ← `buy.strategies.items`, FaqCategory / FaqItem ← `faq.categories` (slugs `Str::slug` calculés dans `fromArray`, `take(n)`), FaqExcerpt {slug, items} pour le bloc FAQ de la page Acheter) ; `fromArray()` passe par `Support/ArrayShape::validate()` = **le garde-fou que ui.php n'a pas** : clé manquante ou type faux → `InvalidArgumentException` nommant la clé ; `toArray()` = forme exacte envoyée au front. Actions invocables `__invoke(?string $locale = null)` (locale courante par défaut) : ListTeamMembers, ListTestimonials, ListSuccessStories, ListStats, ListDistricts, ListStrategies, ListFaqCategories, ExcerptFaqCategory(key, limit = 6) (6 premières questions d'un thème, repli vide si clé inconnue). Les contrôleurs About / Buy / Home / Faq n'orchestrent plus que `ContentList::toArray($action())`. Tests `tests/Unit/Domain/Content/{ContentData,ContentActions}Test.php`. Ajouter une liste éditoriale = un DTO + une Action + une entrée dans ces tests, jamais un `__('ui.x.items')` brut dans un contrôleur.
app/Domain/Localization/Support/LocalizedUrls.php   page courante dans chaque langue (hreflang, switcher)
lang/{fr,en}/ui.php · routes.php       textes UI partagés au front · slugs d'URL traduits
resources/js/hooks/use-translation.ts  t() / tc() côté React
resources/js/hooks/use-reveal.ts       `useReveal(ref, offset)` : vrai une fois l'élément entré dans le viewport (voir Animations)
resources/js/hooks/use-scrolled.ts     header compact après 24px de scroll (SSR-safe)
resources/js/hooks/use-scroll-direction.ts  masque le header mobile au scroll bas, le ramène au scroll haut (hystérésis 8px)
resources/js/components/language-switcher.tsx
resources/js/layouts/public-layout.tsx  layout des pages publiques (SiteHeader + <main>) — toute page publique l'utilise
resources/js/components/page/page-backdrop.tsx façade haussmannienne en hairlines SVG derrière l'en-tête de toute page publique (montée par `PublicLayout`, `backdrop={false}` pour la désactiver) : filigrane très léger, `hidden sm:block`, `aria-hidden`, fondu `backdrop-fade` → décisions et détails : docs/decisions.md
resources/js/components/layout/        site-header (assemblage, Figma 137-2085 / 125-361 / 137-3488), site-footer (Figma 261-5543, variante « wordmark en tête » choisie), brand-logo
resources/js/pages/home.tsx              home = en-tête standard (`<PageEyebrow>` `home.title` + h1 `home.headline` + intro `home.intro`, centré, `max-w-3xl`) ; le hero photo (Figma 123-304, `components/home/hero.tsx`, `public/images/home/hero-*.jpg`, prop `hero` de `PublicLayout`) a été **supprimé le 2026-09-16** (décision utilisateur) ; test `HomeTest`
resources/js/components/footer/        social-links, contact-card (avatars + téléphone + disponibilité, tout le bloc est un lien contact), footer-column, footer-nav (« Nos services » / « À propos » ; contact en premier sur mobile), legal-bar, brand-wordmark, newsletter-signup → décisions et détails : docs/decisions.md
resources/js/components/navigation/    nav-link, nav-divider, nav-items (+ useIsActive), menu-toggle-icon, mobile-menu-toggle, mobile-menu-panel (voile flouté jamais transitionné, rangées `animate-menu-in`, badge « Sous 24 h », liens secondaires dans un puits sable, Échap / swipe / focus) ; état `menuOpen` dans site-header ; barre blanche opaque, jamais de blur → décisions et détails : docs/decisions.md
resources/js/components/home/cta-card.tsx appel à l'action de fin de page (home, À propos, Acheter) : carte sable du site, anneaux `RingsBackdrop` (partagé avec le manifeste), 3 avatars conseillers, h2 `cta.title`, bouton → contact → décisions et détails : docs/decisions.md
resources/js/components/seo/           seo-head (<SeoHead/>), seo-breadcrumbs, seo-image
resources/js/components/i18n/          language-links (« EN | FR » inline, Inter medium, inactif à 50 % — menu mobile, footer), language-switcher (DropdownMenu shadcn, ouverture au clic/clavier uniquement — pas au survol, décision utilisateur), flag (SVG)
resources/js/lib/hover-surface.ts      classes du hover « premium » (ellipse bas→haut, bg-background-05)
resources/js/components/ui/            composants shadcn (ajouter avec `npx shadcn@latest add <name>`)
resources/js/pages/                    une page Inertia = un fichier .tsx (nom = Inertia::render('nom'))
resources/views/app.blade.php          layout racine. Pas de <title> statique (vient de `<SeoHead>`). Google Tag Manager via `<x-analytics.gtm-head/>` / `<x-analytics.gtm-body/>` rendus seulement si `GTM_ID` est défini (jamais d'ID en dur ; prod `GTM-NNPNBZTS`), test `GoogleTagManagerTest` → décisions et détails : docs/decisions.md
config/inertia.php                     ssr.enabled ← INERTIA_SSR_ENABLED ; `ssr.connect_timeout` 1 s / `ssr.timeout` 5 s appliqués par `app/Http/Ssr/ResilientHttpGateway.php` : un SSR injoignable rend côté client en ~1 s au lieu de bloquer 30 s (incident Laravel Cloud 2026-09-16) → décisions et détails : docs/decisions.md
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

Exemples en place : `Domain/Search` (SearchQuery DTO → SearchContent action → SearchResults), `Domain/Seo/Support` (RobotsTxt, LlmsTxt, SitemapBuilder), `Domain/Content` (listes éditoriales de `ui.php` → DTO validés par `ArrayShape` → Actions `List*` / `ExcerptFaqCategory`, contrôleurs réduits à `ContentList::toArray($action())`).

## Conventions front (React / TypeScript)

Arborescence `resources/js/` — **par responsabilité, jamais par type** :
```
app.tsx / ssr.tsx        entrées client / SSR
pages/<route>.tsx        une page Inertia = une route (nom = Inertia::render('home')) ; sous-dossiers = groupes de routes (auth/, settings/)
layouts/                 enveloppes de page : public-layout (SEO/SSR), app-layout (privé), auth-layout
components/ui/           shadcn uniquement (`components.json` : style **new-york**, Tailwind v4 → `"config": ""`) — jamais modifié à la main sauf variantes ; ajouter/mettre à jour via `npx shadcn@latest add <name> [--overwrite]`. ⚠️ `--overwrite` réécrit aussi les **dépendances** (button, input, separator, sheet…) : sauvegarder `ui/` avant, puis restaurer les composants à variantes maison (2026-09-22 : dialog, navigation-menu, sidebar, skeleton, toggle, toggle-group, tooltip passés en new-york / v4 ; button, input, separator, sheet restaurés ; checkbox, select, sheet, command gardent leurs variantes maison en style v3 — à migrer à la main le jour où on y touche)
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
- **Échelle typographique du site public — les tailles Figma ne sont PAS les bonnes** (décision utilisateur 2026-08-27, référence = page contact) : `h1` de page `text-3xl font-semibold tracking-tight text-balance sm:text-4xl` ; `h2` de section `text-2xl font-medium tracking-tight` ; `h3` / titre de carte `text-lg font-medium` (ou `text-xl` max) ; paragraphe / intro `text-base/7 sm:text-sm/6` en `text-muted-foreground` (mobile plus grand que desktop), **`text-pretty` sur tout sous-titre / intro** (pas d'orphelin en fin de paragraphe ; `text-balance` réservé aux titres) ; eyebrow / surtitre (`<PageEyebrow>`) `text-xs font-medium uppercase tracking-wider text-muted-foreground` ; mentions `text-xs`. **Espacement de l'en-tête de page** (eyebrow → h1 → intro, référence = page newsletter, décision utilisateur 2026-08-27) : conteneur `flex flex-col gap-4`, identique mobile/desktop, sur toutes les pages (contact, newsletter, services…). **Espacement vertical des pages** : c'est `PublicLayout` qui le porte (`py-16 sm:py-20` — référence newsletter/contact, décision utilisateur 2026-08-27) ; une page n'ajoute jamais son propre `py-*` de haut/bas. **Marges latérales : `px-6` dès le mobile** (`lg:px-8` ; footer `lg:px-15`) sur `PublicLayout`, les sections pleine largeur de la HP (services, témoignages, carte CTA) et le footer ; une rangée qui déborde au bord (`snap-x`) compense avec `-mx-6` — décision utilisateur 2026-09-16 (le `px-4 sm:px-6` d'origine est abandonné). Jamais `text-5xl`, `text-lg` pour un paragraphe ni les px de la maquette : on lit la hiérarchie du Figma, pas ses valeurs.
- **Figma = intention, pas pixel** : on arrondit toujours aux pas de l'échelle Tailwind (`p-6/10/12`, `min-h-96/112/128`, `text-5xl/6xl`…) et aux variantes shadcn existantes (`size="lg"`), jamais de valeur arbitraire (`h-[52px]`, `w-[220px]`) pour coller à la maquette.
- Style : **100 % classes Tailwind**, zéro `style=`, zéro hex dans le JSX. Couleurs via tokens sémantiques (`bg-card`, `text-foreground`, `bg-background-05`…), tailles sur l'échelle Tailwind (`h-10`, `h-18`, `w-85`), polices via `font-sans` / `font-heading`, tailles de texte par défaut (`text-sm`, `text-base`, `text-xl`).
- Variantes Button ajoutées/ajustées à la source (`ui/button.tsx`) : `variant="neutral"` (blanc sur photo, hover sable) ; `variant="outline"` = **bordure seule, fond transparent**, hover `bg-background-05` (décision utilisateur 2026-08-27, pour poser un bouton sur une surface teintée). Pas de taille custom : on reste sur `sm` / `default` / `lg`.
- **Angles : droits ou pleinement ronds, jamais entre les deux** (décision utilisateur, 2026-08-25). *Surfaces et contrôles = `rounded-none`* : boutons, champs (`input`, `select`, `textarea`), cartes, images, panneaux/menus, alertes, header, lien « Aller au contenu », focus rings. *Pilules = `rounded-full`* : badges de statut/tag (« Ouvert », « Siège », « Conseillers disponibles »), disques des réseaux sociaux, avatars, point de statut. Un `rounded-sm/md/lg/xl` n'a pas sa place sur le site public : si un composant shadcn ajouté en apporte un, le passer à `rounded-none` dans la variante (`ui/*.tsx`), sauf s'il s'agit d'un badge/avatar.
- **Séparateurs = hairline en dégradé** (décision utilisateur 2026-08-27) : entre des blocs de contenu (avantages newsletter, coordonnées contact, footer) on utilise `<GradientHairline>` (`components/layout/gradient-hairline.tsx`, 1px `via-border` fondu aux deux bouts ; prop `vertical` pour les colonnes desktop — la hauteur vient de `self-stretch` dans une rangée flex, jamais de `h-full` (il donnait 0 : bug 2026-09-16, les hairlines verticales des chiffres clés / témoignages / newsletter étaient invisibles)), jamais `divide-y` / `border-t` pleins.
- **Pas d'ombres** (`shadow-*`) sur le site public, **aucune exception** (l'ombre douce des cartes contact / estimation / blog a été retirée le 2026-09-15, décision utilisateur) — décision utilisateur « premium » : `shadow-xs` retiré des variantes de `ui/button.tsx`, `shadow-none` sur les panneaux (dropdown). Si un composant shadcn ajouté en apporte une, la retirer dans la variante, pas sur l'instance.
- **Champs de formulaire à fond blanc** (décision utilisateur 2026-09-21) : `Input`, `Textarea`, `SelectTrigger`, `Checkbox` portent `bg-card` dans `ui/*.tsx` (plus de `bg-transparent`), ainsi que les conteneurs composés `contact/phone-input.tsx` et `estimate/stepper-input.tsx` — un champ posé sur une surface sable reste blanc, jamais de `bg-*` sur l'instance.
- Composants shadcn utilisés **tels quels** (`<Button size="lg">`) : pas de `h-12 px-4` sur une instance. Si le design diverge du composant, on change la variante dans `components/ui/`, une fois.
- États de nav : couleur/fond uniquement, jamais de changement de `font-weight` entre default/hover/actif.
- **Hover des liens texte = trait qui se dessine** (décision utilisateur 2026-08-27) : tout lien texte du site public (« Voir sur Google Maps », liens légaux, titres d'articles, fil d'Ariane, résultats de recherche…) utilise `linkClass` de `lib/hover-surface.ts` (hairline `after:` sous le texte, dessinée gauche→droite au hover/focus, sortie à droite) — jamais `hover:underline`. Les liens de nav gardent `hoverSurfaceClass` (même trait, avec le padding du bouton). Exception : les liens dans le corps des articles (`portable-text`) restent soulignés en permanence (lisibilité).
- Accessibilité clavier : utilitaire **`focus-ring`** (`app.css`, ring 3px `--ring/50`, visible uniquement au clavier via `focus-visible`) sur tout élément interactif custom (liens de nav, logo, items de menu) — les composants shadcn l'ont déjà. Lien « Aller au contenu » (`a11y.skip_to_content`) + `<main id="main" tabIndex={-1}>` dans `PublicLayout`. `aria-label` sur les `<nav>`, `aria-expanded/controls` sur les déclencheurs, `aria-current="page"`, `motion-reduce:` sur les animations. Les menus (Radix) gèrent flèches / Échap / Tab nativement.
- SEO des liens : un lien de nav doit pointer vers une vraie URL (`route()`), jamais `#` en prod. Pages de service `contact` / `estimate` / `sell` / `buy` (`buy` a désormais son hero, voir `BuyController` ; **`sell`** = `PublicLayout max-w-7xl` avec l'intro en `max-w-3xl` puis **une section photo** `components/sell/sell-photo.tsx` (photo nue à angles droits, bord à bord sur mobile en 16/9, 21/9 dès `lg`, zoom d'entrée `animate-hero-photo`, `alt` `sell.photo_alt` ; `public/images/sell/photo-{800,1600}.jpg` = export Figma « intérieur vue tour Eiffel », **placeholder à remplacer**), puis une **mosaïque de 4 photos** `components/sell/sell-gallery.tsx` (prop `gallery` = alt `sell.gallery` via `SellController` ; `grid-cols-2` sur mobile, 3 colonnes × 2 rangées dès `lg` avec la 1ʳᵉ photo sur 2 colonnes et 2 rangées, photos nues 3/2 lazy, rien d'interactif ; `public/images/sell/gallery-{1..4}-{800,1600}.jpg` = copies des photos de quartier du Figma, **placeholders à remplacer par des biens vendus**) — 2026-09-22, tests `sell-photo.test.tsx` + `sell-gallery.test.tsx` + `SellTest` ; routes nommées, slugs SEO `contact`, `estimation-immobiliere-paris`, `vendre-immobilier-paris`, `acheter-immobilier-paris` ↔ `contact`, `property-valuation-paris`, `sell-property-paris`, `buy-property-paris`) : squelettes `pages/<key>.tsx` = `PublicLayout` + `<PageIntro page>` (`components/page/page-intro.tsx` : SeoHead + fil d'Ariane + h1 + phrase-réponse, textes `ui.pages.<key>.*`), **contenu à venir**. Pages légales : routes `privacy` / `legal` / `terms` (slugs traduits), contenu placeholder dans `lang/{fr,en}/legal.php` **à faire valider juridiquement**.
- **Icônes : `lucide-react` uniquement** (`import { X } from 'lucide-react'`), taille via classe `size-*` (défaut `size-4` dans les boutons shadcn). Jamais de SVG d'icône écrit à la main, jamais d'autre lib (Heroicons, FontAwesome, react-icons…). Exception : les **logos de marques** (réseaux sociaux) sont des fichiers SVG dans `public/images/social/` rendus en `<img>`, car ce sont des logos, pas des icônes — et Threads n'existe dans aucune lib. Les `<svg>` du kit (`app-logo-icon.tsx`, zone privée) sont à remplacer par nos assets si la zone privée est reprise.
- Ordre des classes géré par Prettier (plugin Tailwind) — ne pas le combattre.

Avant de livrer un composant : `npx tsc --noEmit`, `npm run lint`, `npm run format`, et si page publique : `curl` du HTML SSR.

## Animations & transitions — règles et inventaire

Toute animation ou transition du site public suit ces règles (décision utilisateur 2026-09-16 : tout ce qui bouge est documenté ici) :

- **Une seule courbe « premium »** : `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) pour tout ce qui entre, monte ou se déploie ; `linear` réservé aux rotations continues, `ease-in-out` aux respirations. Durées : micro-retours 200-300 ms, entrées 350-900 ms, ambiances 10-60 s.
- **`motion-reduce:` sur tout** : `motion-reduce:animate-none` sur chaque `animate-*`, `motion-reduce:transition-none` sur chaque `transition-*` non triviale ; un élément animé en entrée reste **visible** sans animation (`opacity-0` uniquement dans l'état « pas encore révélé », avec `motion-reduce:opacity-100`). Rien ne clignote, rien ne défile seul sans contrôle (pas d'autoplay : le carrousel du hero À propos et les rangées `snap-x` attendent l'utilisateur).
- **Cascade = variable CSS `--stagger`** (seul `style=` dynamique toléré, avec `--progress`, `--category-color`, `--indicator-x/-w`) lue par `[animation-delay:var(--stagger)]` ; pas de `setTimeout`, pas de librairie d'animation.
- **Déclenchement à l'entrée dans le viewport** = le hook **`useReveal(ref, '-10%' | '-15%')`** (`hooks/use-reveal.ts`, refactor 2026-09-22 : il remplace huit copies du même `IntersectionObserver`) — `useEffect` SSR-safe, une seule fois puis `disconnect`, repli « tout visible » si l'API manque ; utilisé par le manifeste, les valeurs, les avantages, les quartiers, le hero et le bilan Acheter, la citation des success stories. Les observateurs qui font autre chose (stratégie / valeur active au milieu de l'écran, prefetch des articles liés, sommaire actif, pause des témoignages) restent locaux.
- **Jamais de transition sur `backdrop-filter`** (le flou se rasterise en retard et apparaît en deux temps : bug du menu mobile) ; on transitionne l'opacité d'une couche de teinte séparée.
- **Retour à l'appui** des boutons fléchés : `active:scale-90` + chevron qui glisse de 2px dans le sens du défilement (`group-active:translate-x-0.5`).
- **Hover** : couleur / fond / bordure uniquement en `transition-colors duration-300`, jamais de changement de graisse ; le trait des liens texte se dessine gauche → droite (`linkClass`).
- Tout nouveau mouvement = une entrée `--animate-*` + `@keyframes` dans `resources/css/app.css` (`@theme`), nommée d'après son usage, et une ligne dans l'inventaire ci-dessous.

Inventaire (`resources/css/app.css`) :

| Animation | Usage | Durée / courbe |
|---|---|---|
| `hero-photo` | photo du hero HP et du hero À propos : zoom 1.05 → 1 au chargement | 1.6 s expo-out |
| `hero-rise` | cascade eyebrow / h1 / phrase / bouton / rangée du hero HP, valeurs À propos, message de la carte verre | 0.8 s expo-out, `--stagger` 300 + 120·n ms (hero), 80·n ms (valeurs) |
| `manifesto-in` | titre, deux phrases et pictogramme du manifeste À propos, citation + bouton des success stories HP (mot à mot, 40 ms/mot) : léger basculement 3D + flou qui se dissipe | 0.9 s expo-out, `--stagger` 150·n ms |
| `menu-in` | rangées du menu mobile qui montent de 12px en fondu à l'ouverture (fermeture instantanée) | 0.35 s expo-out, `--stagger` 35·n ms |
| `slot-in/out-up/down` | rouleau de slot du stepper pièces / chambres (direction selon le sens) | 0.3 s expo-out |
| `pop` | pastilles radio et coches vertes du formulaire d'estimation | 0.3 s expo-out |
| `value-lock` + `value-ring` | valeurs À propos : le numéro de la valeur qui atteint le milieu du viewport **se verrouille** (atterrit depuis une sur-échelle **1.08** avec flou 2px qui se dissipe, dépassement 0.99, se pose — **retenu, jamais de rebond**, décision utilisateur 2026-09-21 « garder un aspect premium ») et le point du fil émet un anneau ténu (opacité 0.35 → 0, ×3 ; monté à chaque verrouillage, `motion-reduce:hidden`) ; rien n'est actif avant le premier scroll | 0.6 s / 0.9 s expo-out |
| `fade-in` | apparitions simples (états, badges) | 0.2 s ease-out |
| `rings` + `rings-breathe` | anneaux concentriques de `RingsBackdrop` (carte CTA, bandeau manifeste) : rotation + respiration | 60 s linear infini + 10 s ease-in-out infini |
| `border-shimmer` | liseré de la carte newsletter : deux passages puis immobile | 8 s linear ×2 |
| `price-shimmer` | chip du prix au m² des quartiers (page Acheter) : bande de lumière sable `via-secondary-30/60` qui balaie le chip en 1,8 s puis repos, `motion-reduce:hidden` (décision utilisateur 2026-09-22) | 6 s linear infini |
| `accordion-down/up` | accordéons FAQ / blog (Radix) | 0.2 s ease-out |
| `marquee` | bandeau d'engagements À propos : piste qui glisse de -50 % en boucle, pause au survol, immobile en `motion-reduce` | 120 s linear infini (45 s jugé trop rapide, décision utilisateur 2026-09-16) |

Transitions CSS notables : `SiteHeader` hauteur / padding 500 ms expo-out au scroll ; teinte du voile du menu mobile 200 ms à l'ouverture ; cartes blog / services / équipe `transition-colors duration-300` (bordure) et zoom photo `scale-105` 700 ms ; filigrane des cartes services `transition-opacity duration-500` ; `scroll-behavior: smooth` seulement via `scrollTo({ behavior })` conditionné à `prefers-reduced-motion` dans les hooks (`useDragScroll`, carrousels) ; barre de lecture des articles (`--progress`) sans transition.

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

- Palettes 10→100 (clair→foncé) : `primary-*` (50 = Light, **60 = Main `#202832`**), `secondary-*` sable (30 / 40 / 50 / **60 = Main `#E3D0B5`** (ajouté le 2026-09-16 : il manquait, les points et étoiles en `secondary-60` étaient transparents) / 80), `error-*`, `success-*`, `warning-*`, `info-*`, `grey-*` (+ `grey-5` surface). Utilitaires Tailwind directs : `bg-primary-60`, `text-grey-70`, `border-error-30`…
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
SEO_VIDEO_BUY=                       # id YouTube de la vidéo de présentation du hero « Acheter » (vide = photo seule, pas de bouton lecture)
```

## robots / sitemap

- `/robots.txt` et `/llms.txt` sont des **routes** (`SeoController`), pas des fichiers : l'URL du sitemap suit `APP_URL` automatiquement. Listes de chemins privés et d'agents IA dans `Domain/Seo/Support/RobotsTxt.php`.
- `public/sitemap*.xml` (index + sous-sitemaps) sont générés par `SitemapBuilder`, ignorés par git, régénérés quotidiennement par le scheduler (`php artisan schedule:run` via cron en prod). Pages statiques dans `SitemapBuilder::pageList()`, articles via `blog()`. `robots.txt` ne référence que l'index.

## Déploiement — Laravel Cloud

Hébergement : **Laravel Cloud** (déploiement automatique à chaque `git push` sur `main`). Le push ne suffit pas seul : la configuration ci-dessous doit être en place dans le dashboard Cloud.

- **Build** : `npm ci && npm run build:ssr` (pas `npm run build` : le SSR a besoin de `bootstrap/ssr/ssr.js`).
- **Deploy commands** : `php artisan migrate --force`, `php artisan config:cache`, `php artisan view:cache`, `php artisan event:cache`, `php artisan route:trans:cache`. ⚠️ Jamais `route:cache` / `optimize` (casse les routes traduites — voir Internationalisation).
- **SSR** : vérifier dans Cloud qu'un process/worker Inertia SSR est disponible pour l'app (`php artisan inertia:start-ssr`, port 13714) et le redémarrer après chaque déploiement. **Tant que ce process n'existe pas, `INERTIA_SSR_ENABLED=false` est obligatoire** (le 2026-09-16, `true` sans process a rendu tout le site injoignable : « upstream connect error … connection timeout ») : le site rend côté client sans erreur, mais on perd le SSR (SEO) — à traiter en priorité. Le gateway maison limite désormais les dégâts à ~1 s par requête, mais ce n'est pas une raison pour laisser `true` sans process.
- **Scheduler** : activer le scheduler Cloud (`schedule:run` chaque minute) pour la régénération quotidienne du sitemap.
- **Base / cache** : MySQL Cloud (les variables `DB_*` sont injectées par Cloud) ; le cache est en table BDD (`CACHE_STORE=database`) → les migrations doivent être passées avant le premier hit.
- **Variables d'environnement** à renseigner dans Cloud (valeurs réelles, aucun placeholder) : `APP_URL` (https, www ou non selon le domaine canonique), `APP_ENV=production`, `APP_DEBUG=false`, **`APP_LOCALE=fr` et `APP_FALLBACK_LOCALE=fr`** (bug rencontré 2026-08-29 : sans `APP_LOCALE`, l'app démarrait en anglais → URLs anglaises à la racine et françaises sous `/fr` ; `config/app.php` a désormais `fr` en défaut, test `LocalizationTest`), `INERTIA_SSR_ENABLED`, tout le bloc `SEO_*` (org, téléphone, adresse, réseaux, horaires, avis), `MAIL_*`, `GTM_ID`.
- Après le déploiement, vérifier : `curl -s https://<domaine>/ | grep '<h1'` (SSR), `/robots.txt`, `/sitemap.xml`, `/llms.txt`, redirection `/fr/...` → `/...` (301) et http → https.
- En local, `make start` / `make clean` (Makefile).

## Historique des choix

Le journal daté des décisions (produit, UI, technique) vit dans **`docs/decisions.md`** : y ajouter toute décision utilisateur (date + composant), ici on ne garde que les règles et la carte du code.
