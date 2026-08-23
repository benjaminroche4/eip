# Laravel App — guide du projet

Laravel 12 + Inertia 2 + React 19 + TypeScript + Tailwind 4 + shadcn/ui, rendu **SSR** pour le SEO.
Basé sur le starter kit officiel `laravel/react-starter-kit`. Pas de Next.js, pas de front séparé : tout vit dans ce repo.

## Environnement local

- PHP 8.4 (Homebrew), Composer 2.8, Node 20 — **MySQL via MAMP** (port 8889, root/root, base `laravel_app`). MAMP doit être lancé.
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
| `php artisan sitemap:generate` | régénère `public/sitemap.xml` (planifié chaque jour dans `routes/console.php`) |

Avant de livrer : `tsc`, `eslint`, `pint`, `php artisan test` doivent passer. Pint `--dirty` ne marche pas (pas de git pour l'instant).

## Structure utile

```
app/Http/Middleware/NoSsr.php          alias 'no-ssr' : désactive le SSR pour une route/groupe
app/Http/Middleware/HandleInertiaRequests.php  props partagées : auth, name, ziggy (routes + location)
app/Http/Controllers/SearchController.php      page /recherche (orchestration → Domain/Search)
app/Http/Controllers/SeoController.php         robots.txt, llms.txt
app/Http/Middleware/CanonicalUrl.php           301 vers l'URL canonique en prod
app/Console/Commands/GenerateSitemap.php       sitemap (délègue à Domain/Seo/Support/SitemapBuilder)
resources/js/app.tsx / ssr.tsx         entrées client / serveur
resources/js/lib/json-ld.ts            builders JSON-LD (siteGraph, breadcrumbList, faqPage, article, itemList)
resources/css/tokens.css               palette Figma (voir Design system)
config/seo.php                         défauts SEO/GEO partagés au front via la prop `seo`
app/Domain/                            logique métier (voir Architecture)
app/Domain/Localization/Support/LocalizedUrls.php   page courante dans chaque langue (hreflang, switcher)
lang/{fr,en}/ui.php · routes.php       textes UI partagés au front · slugs d'URL traduits
resources/js/hooks/use-translation.ts  t() / tc() côté React
resources/js/hooks/use-scrolled.ts     header compact après 24px de scroll (SSR-safe)
resources/js/hooks/use-scroll-direction.ts  masque le header mobile au scroll bas, le ramène au scroll haut (hystérésis 8px)
resources/js/components/language-switcher.tsx
resources/js/layouts/public-layout.tsx  layout des pages publiques (SiteHeader + <main>) — toute page publique l'utilise
resources/js/components/layout/        site-header (assemblage, Figma 137-2085 / 125-361 / 137-3488), site-footer (Figma 261-5543, variante « wordmark en tête » choisie), brand-logo
resources/js/components/footer/        social-links (réseaux depuis config/seo.php `social`), contact-list (tel/mail/adresse depuis `organization`, icône lucide dans un carré bordé 32px — variante « Outlined squares » choisie), footer-column, footer-nav (mêmes entrées que le header), legal-bar (© + liens légaux `#`), brand-wordmark (wordmark contour pleine largeur en tête du footer)
resources/js/components/navigation/    nav-link (lien + hover ellipse + focus-ring), nav-divider, nav-items (entrées + useIsActive), menu-toggle-icon (3 traits → croix), mobile-menu-toggle (bouton 72×48, aria-expanded/controls), mobile-menu-panel (Figma 137-3968 : panneau **sous la barre** qui reste en place — `absolute top-full`, hauteur `100dvh − barre` (4.5rem / 4rem compact), glissement 700 ms + liens en cascade, CTA + LanguageLinks épinglés en bas, scroll body verrouillé, Échap, swipe haut, fermeture auto ≥ lg, focus sur le 1er lien). État `menuOpen` dans site-header
                                       mega-menu-column / -promo / -properties : mega-menu « Nos biens » prêt mais **non branché** (décision utilisateur)
resources/js/components/seo/           seo-head (<SeoHead/>), seo-breadcrumbs, seo-image
resources/js/components/i18n/          language-links (« EN | FR » inline, Inter medium, inactif à 50 % — menu mobile, footer), language-switcher (DropdownMenu shadcn, ouverture au clic/clavier uniquement — pas au survol, décision utilisateur), flag (SVG)
resources/js/lib/hover-surface.ts      classes du hover « premium » (ellipse bas→haut, bg-background-05)
resources/js/components/ui/            composants shadcn (ajouter avec `npx shadcn@latest add <name>`)
resources/js/pages/                    une page Inertia = un fichier .tsx (nom = Inertia::render('nom'))
resources/views/app.blade.php          layout racine. Pas de <title> statique : il vient de <Head>/@inertiaHead
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
- Fichiers **kebab-case** (`mega-menu-promo.tsx`), composant **PascalCase en export default** portant le même nom (`MegaMenuPromo`). Un composant par fichier.
- Props typées `type XxxProps = {...}` juste au-dessus du composant ; hooks `useXxx` ; constantes de classes `xxxClass` ; clés de traduction en `snake_case` (`nav.mega.promo_title`).
- Composants préfixés par leur domaine quand le nom seul est ambigu (`SeoHead`, `SeoImage`, `NavLink`, `MegaMenuColumn`, `BrandLogo`).

Blocs / composition
- **Une page = `<SeoHead/>` + un layout + du contenu**. Jamais de `<SiteHeader/>` ni de `<main>` dans une page : c'est le rôle de `PublicLayout`.
- Tout élément répété ou nommé dans le Figma a son composant (lien de nav, séparateur, colonne, carte promo, switcher…). Un fichier d'assemblage (`site-header.tsx`) ne contient que de la composition et de l'état.
- Texte : jamais en dur, toujours `t()` / `tc()` (FR + EN). Liens : `route('name')` (déjà localisé), `<Link prefetch>` pour la nav.
- Style : **100 % classes Tailwind**, zéro `style=`, zéro hex dans le JSX. Couleurs via tokens sémantiques (`bg-card`, `text-foreground`, `bg-background-05`…), tailles sur l'échelle Tailwind (`h-10`, `h-18`, `w-85`), polices via `font-sans` / `font-heading`, tailles de texte par défaut (`text-sm`, `text-base`, `text-xl`).
- Composants shadcn utilisés **tels quels** (`<Button size="lg">`) : pas de `h-12 px-4` sur une instance. Si le design diverge du composant, on change la variante dans `components/ui/`, une fois.
- États de nav : couleur/fond uniquement, jamais de changement de `font-weight` entre default/hover/actif.
- Accessibilité clavier : utilitaire **`focus-ring`** (`app.css`, ring 3px `--ring/50`, visible uniquement au clavier via `focus-visible`) sur tout élément interactif custom (liens de nav, logo, items de menu) — les composants shadcn l'ont déjà. Lien « Aller au contenu » (`a11y.skip_to_content`) + `<main id="main" tabIndex={-1}>` dans `PublicLayout`. `aria-label` sur les `<nav>`, `aria-expanded/controls` sur les déclencheurs, `aria-current="page"`, `motion-reduce:` sur les animations. Les menus (Radix) gèrent flèches / Échap / Tab nativement.
- SEO des liens : un lien de nav doit pointer vers une vraie URL (`route()`), jamais `#` en prod — les `#` actuels (« Estimation », « Notre groupe », CTA) sont des placeholders à remplacer dès que les pages existent.
- **Icônes : `lucide-react` uniquement** (`import { X } from 'lucide-react'`), taille via classe `size-*` (défaut `size-4` dans les boutons shadcn). Jamais de SVG d'icône écrit à la main, jamais d'autre lib (Heroicons, FontAwesome, react-icons…). Exception : les **logos de marques** (réseaux sociaux) sont des fichiers SVG dans `public/images/social/` rendus en `<img>`, car ce sont des logos, pas des icônes — et Threads n'existe dans aucune lib. Les `<svg>` du kit (`app-logo-icon.tsx`, zone privée) sont à remplacer par nos assets si la zone privée est reprise.
- Ordre des classes géré par Prettier (plugin Tailwind) — ne pas le combattre.

Avant de livrer un composant : `npx tsc --noEmit`, `npm run lint`, `npm run format`, et si page publique : `curl` du HTML SSR.

## Internationalisation (FR / EN)

Package : `mcamara/laravel-localization` (config `config/laravellocalization.php`, locales `fr` (défaut) et `en`).

URLs
- **Toutes les pages publiques sont préfixées** : `/fr/...` et `/en/...`. `/` (et toute URL sans préfixe) → 302 vers la locale négociée (session → cookie → `Accept-Language` → `fr`). Jamais de redirection sur une URL déjà préfixée.
- **Slugs traduits** dans `lang/{fr,en}/routes.php` (`'search' => 'recherche' | 'search'`), déclarés avec `LaravelLocalization::transRoute('routes.search')` dans le groupe localisé de `routes/web.php`. `/en/recherche` = 404 (pas de doublon).
- Les routes auth/settings/dashboard restent **sans préfixe** (zone privée, `no-ssr`) ; la langue y suit la session/cookie.
- `route('search')` (PHP **et** JS via Ziggy) génère déjà l'URL de la locale courante — ne jamais concaténer `/fr` à la main. Pour une autre locale : `LaravelLocalization::getLocalizedURL('en')` ou la prop partagée `localization.alternates`.
- ⚠️ `php artisan route:cache` ne marche pas avec les routes traduites : utiliser `php artisan route:trans:cache` (et `route:trans:clear`) en prod.
- Tests : les routes sont enregistrées avant la requête → appeler `$this->withLocale('fr')` (helper `tests/TestCase.php`) avant `get('/fr/...')`. La négociation `Accept-Language` est désactivée par le package en console : non testable, vérifier au `curl`.

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
6. Fonts **self-hosted** : `public/fonts/*.woff2` (sous-ensembles latin + latin-ext copiés de fontsource), déclarées dans `resources/css/fonts.css` (`font-display: swap`), les deux fichiers latin sont **préchargés** dans `app.blade.php`. Aucun appel Google/bunny, plus de dépendance fontsource : `font-sans` = **Inter** (texte), `font-heading` = **Montserrat** (appliqué par défaut à h1–h6 dans `app.css`). Tailles Tailwind standard, mobile plus grand que desktop (`text-base/7 sm:text-sm/6`).
7. Images : utiliser `<SeoImage alt width height [priority]>` (lazy/async par défaut, `priority` pour le LCP). `alt` obligatoire.
8. Liens internes : `<Link prefetch>` pour les liens de navigation (précharge au hover).

## Pattern « page de recherche » (`/recherche`)

- Premier hit en SSR : `<h1>`, title/meta dynamiques, résultats dans le HTML.
- Raffinement côté client : `router.get(route('search'), {q}, { only: ['results','seo'], preserveState, replace })` → **partial reload** (seuls `results` + `seo` sont renvoyés en JSON), debounce 300 ms, URL mise à jour et partageable.
- Indexation : seule `/recherche` vide page 1 est `index`. `?q=` ou `page>1` → `noindex, follow` (géré par la prop `seo.noindex` côté contrôleur). `rel="prev|next"` émis pour la pagination.
- Les props d'indexation de la page s'appellent `indexing` (pas `seo`, réservé à la prop partagée globale — collision déjà rencontrée).
- Pour les listings SEO durables, créer des **URL propres** (`/recherche/{slug}`, `/categorie/{slug}/{ville}`) rendues en SSR et ajoutées au sitemap, plutôt que des query strings.
- Brancher les vraies données : remplacer le dataset placeholder de `SearchController` par un `Model::query()`/Scout + `paginate()`, garder la forme `{data,total,current_page,last_page}`.

## Logo & identité

- Assets de marque dans `public/brand/` : `logo-mark.svg` (pictogramme seul, footer), `wordmark-outline.svg` (filigrane footer), icônes sociales `public/images/social/*.svg` (12px blanc, Figma) ; `logo_dark_desktop.svg` (213×24) et `logo_dark_mobile.svg` (112×28) = artwork foncé `#202832` pour fond clair (fournis par l'utilisateur). Les variantes `logo_light_*.svg` (dark mode) sont **générées** par `sed 's/#202832/#f0f1f3/g'` ; à régénérer si les logos changent.
- Composant **`<BrandLogo priority?>`** (`components/brand-logo.tsx`) choisit mobile/desktop (`sm:`) et dark/light (`dark:`). À utiliser partout, jamais un `<img>` direct.
- `favicon.svg` = copie du logo mobile. JSON-LD Organization → `logo_dark_desktop.svg` (`config/seo.php`).
- Déclinaisons à fournir : `public/favicon.svg`, `public/favicon.ico` (32×32), `public/apple-touch-icon.png` (180×180), `public/og-default.png` (1200×630, image de partage par défaut).
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

Par page (`<SeoHead/>`)
- [x] `<title>` unique suffixé ` · Site` (`withSuffix={false}` sur la home), `meta description`, `canonical`
- [x] `robots` : `index, follow, max-image-preview:large, max-snippet:-1` ou `noindex, follow`
- [x] Open Graph complet + Twitter `summary_large_image`, image par défaut `public/og-default.png` (**placeholder 1200×630 à remplacer**)
- [x] `rel=prev/next` pagination, `hreflang` automatique (surchargeable via `alternates`)
- [x] JSON-LD via `lib/json-ld.ts` : `siteGraph()` (Organization + WebSite/SearchAction — home uniquement), `breadcrumbList()`, `faqPage()`, `article()`, `itemList()`
- [x] Fil d'Ariane visible (`<SeoBreadcrumbs/>`) + BreadcrumbList

GEO (Generative Engine Optimization — être cité par ChatGPT/Perplexity/AI Overviews)
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
SEO_ORG_EMAIL= / SEO_ORG_PHONE= / SEO_ORG_STREET= / SEO_ORG_POSTAL_CODE= / SEO_ORG_CITY=   # footer + JSON-LD
SEO_SOCIAL_LINKEDIN= / SEO_SOCIAL_THREADS= / SEO_SOCIAL_FACEBOOK=   # vide = icône masquée
APP_URL=https://www.exemple.fr        # base des canonical, sitemap, robots
APP_LOCALE=fr
INERTIA_SSR_ENABLED=true
SEO_SITE_NAME="Mon site"
SEO_DESCRIPTION="…"
SEO_DEFAULT_IMAGE=/og-default.png
SEO_TWITTER=@handle
SEO_ORG_NAME= / SEO_ORG_EMAIL= / SEO_ORG_PHONE= / SEO_ORG_SAME_AS=https://linkedin.com/…,https://x.com/…
SEO_LLMS_SUMMARY="…"
```

## robots / sitemap

- `/robots.txt` et `/llms.txt` sont des **routes** (`SeoController`), pas des fichiers : l'URL du sitemap suit `APP_URL` automatiquement. Listes de chemins privés et d'agents IA dans `Domain/Seo/Support/RobotsTxt.php`.
- `public/sitemap.xml` est généré par `SitemapBuilder`, ignoré par git, régénéré quotidiennement par le scheduler (`php artisan schedule:run` via cron en prod). Ajouter les pages dynamiques dans `SitemapBuilder::build()`.

## Déploiement (à prévoir)

- `APP_URL` réel (utilisé pour canonical/sitemap), `INERTIA_SSR_ENABLED=true`.
- `npm run build:ssr` dans le pipeline, puis `php artisan inertia:start-ssr` supervisé. Redémarrer le SSR après chaque déploiement (`php artisan inertia:stop-ssr`).
- Fonts : envisager le self-hosting (supprime une requête externe, meilleur LCP).

## Historique des choix

- `@inertiajs/react` épinglé en `^2` (2.3.x) : la v3 casse `createInertiaApp`, la 2.0.3 d'origine avait un typage `useForm` trop strict.
- La page démo `welcome.tsx` du kit a été remplacée par `pages/home.tsx` (PublicLayout, textes `home.*`), en attente du design Figma de la HP.
- Le callback `title:` de `createInertiaApp` a été retiré (app.tsx + ssr.tsx) : le suffixe est géré par `<SeoHead>` pour éviter « Titre - Laravel - Laravel ».
- Fonts : Instrument Sans (kit) → Inter + Montserrat self-hosted (décision utilisateur, perf), d'abord via fontsource puis en `@font-face` maison latin-only + preload.
- Header mobile : se cache au scroll bas / revient au scroll haut ; menu sous la barre (header conservé, icône → croix) avec swipe vers le haut pour fermer et fermeture auto au passage en desktop.
- Tests : PHPUnit classique, pas Pest (le kit n'installe pas Pest).
- `ui/dropdown-menu.tsx` et `ui/button.tsx` mis à jour vers le shadcn actuel (new-york / Tailwind v4 : `default h-9 px-4`, `sm h-8`, `lg h-10 px-6`, `icon size-9`, `data-slot`, icônes `size-4` par défaut sauf classe `size-*` explicite). Les autres composants `ui/` sont encore ceux du kit (style « default », Tailwind v3) : les mettre à jour un par un avec `--overwrite` quand on y touche, en vérifiant les usages du kit (auth, settings, sidebar).
- Git non initialisé (décision utilisateur en attente).
