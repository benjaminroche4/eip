# Audit SEO / GEO / performance de la marketplace — 2026-10-14

Périmètre : « Nos biens » (`/nos-biens`, `/en/properties`), pages d'arrondissement, landing location, fiche de bien (vente, location, vendu), porte off-market, sélection off-market, page filtrée. Méthode : rendu SSR de 13 URL avec le jeu de la fixture (Sanity n'a que des brouillons), analyse du HTML produit (meta, plan des titres, images, JSON-LD, liens, poids), lecture du code des composants, mesure des bundles.

## Vérifié conforme

| Point                    | Constat                                                                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<title>`                | Un seul par page, 27 à 57 caractères, marque en tête sur les listes ; fiche sans la marque quand elle dépasserait 60 (« Appartement 5 pièces, Champ-de-Mars · Paris 7e », 46)                                                                        |
| `meta description`       | 139 à 154 caractères, une seule par page, construite depuis les données sur les fiches                                                                                                                                                               |
| `robots`                 | `index, follow, max-image-preview:large…` sur liste, arrondissements, location, fiches ; `noindex, follow` sur page filtrée, bien vendu, porte et sélection off-market                                                                               |
| `canonical` / `hreflang` | Présents et cohérents FR / EN / x-default sur toute page indexable, absents sur les pages `noindex`, jumeaux de fiche par `translation.metadata` ou `uniqueId`                                                                                       |
| Open Graph / Twitter     | `og:title`, `og:url`, `og:image` (première photo en 1600), `og:image:alt`, `summary_large_image`                                                                                                                                                     |
| `h1`                     | Un seul par page, porteur de l'intention (« Nos biens à vendre à Paris 6e », titre éditorial du bien)                                                                                                                                                |
| Plan des titres          | Aucun saut de niveau : h1 → h2 (compte, sections numérotées) → h3 (cartes, sous-rubriques)                                                                                                                                                           |
| GEO : réponse d'abord    | Paragraphe factuel sous chaque h1 (« À la vente : appartement de 5 pièces (165 m², 3 chambres) à Champ-de-Mars, Paris 7e, au prix de… »), sans la marque                                                                                             |
| Dates                    | `<time>` sur la fiche, `datePosted` + `dateModified` dans le JSON-LD, `lastmod` du sitemap = dernier changement de prix                                                                                                                              |
| JSON-LD                  | `BreadcrumbList` partout, `ItemList` + un `RealEstateListing` par bien sur les listes (`offers`, `GeoCoordinates`, `provider`), `RealEstateListing` complet avec `ImageObject` légendés sur la fiche ; aucun bloc invalide                           |
| Images                   | 100 % avec `alt`, `width` / `height`, `srcset` + `sizes` sur toutes les photos de contenu, `loading="lazy"` sous la ligne de flottaison, `fetchpriority="high"` + `<link rel="preload">` sur l'image LCP ; logos décoratifs `alt=""`                 |
| Sémantique               | `<main>` unique, `<nav aria-label>` nommées (principale, mobile, arrondissements, fil d'Ariane, voisins, langue, pied), un seul `id` par élément                                                                                                     |
| Liens                    | 34 à 39 liens par page, internes en `<a href>` absolus, externes `rel="noopener noreferrer"`, aucun `href="#"`                                                                                                                                       |
| Confidentialité          | Aucune donnée d'un bien confidentiel dans le HTML de la porte (prix, extrait, position) ; un prix sur demande n'apparaît nulle part                                                                                                                  |
| Poids                    | HTML gzip : liste 31 Ko, fiche 28 Ko (dont ~36 Ko de props Inertia non compressés) ; JS : app 126 Ko gz (commun au site), page liste 13 Ko, fiche 11 Ko, carte Google 4 Ko chargée après hydratation, icônes 13 Ko ; CSS 26 Ko ; polices préchargées |
| Sitemap / llms           | `sitemap.properties.xml` avec `<image:image>` légendées, landing location et pages d'arrondissement listées, `llms.txt` FR + EN                                                                                                                      |

## Corrigé pendant l'audit

1. **`og:image` cassée avec Sanity** : les deux pages préfixaient la photo par l'origine du site ; une URL `cdn.sanity.io` devenait `https://site/https://cdn…`. Helper `absolute()` sur la liste et la fiche.
2. **Alt par photo perdu** : Sanity exige un `alt` sur chaque photo, le site n'en gardait qu'un et numérotait les autres. Nouveau `photo_alts[]` dans le DTO, lu par les cartes, la galerie, la bande de photos de la description, le JSON-LD (`caption`) et le sitemap d'images.
3. **Dimensions réelles des photos** : la galerie déclarait 1600 × 1067 pour toute photo, un portrait Sanity (1086 × 1448) provoquait un décalage de mise en page. `photo_sizes[]` lu depuis la référence d'asset.
4. **Description meta des locations** : « 6 500 € honoraires inclus » devient « à louer à Marais, Paris 4e, 6 500 € par mois » (`seo_description_rent` / `_short_rent` FR + EN).
5. **Numéros de section dans le texte des h2** : « 01Le bien » pour les robots ; le numéro passe en CSS (`before:content-[attr(data-number)]`), le h2 lit « Le bien ».
6. **« Nos biens par arrondissement » en h3 sous le h2 du décompte** : passe en h2, c'est un bloc à part entière.
7. **Serveur SSR local sur un ancien build** : les pages à code d'accès rendaient côté client (module introuvable dans le log) ; redémarré. Rappel : en prod, le process SSR doit redémarrer après chaque déploiement.

## Recommandations (non faites)

- **FAQ en fin de fiche** (règle GEO, ≥ 3 questions) : le bloc a quitté la page avant cet audit, le `FAQPage` avec ; remettre quatre questions du thème « Acheter » / « Louer » sous les biens similaires.
- **h2 en questions** sur la fiche (« Combien vaut le m² dans le quartier ? », « Comment se rendre au bien ? ») : aujourd'hui des libellés (« Le bien », « Le quartier »).
- **Préchargement** : les quatre premières cartes de la liste sont en `fetchpriority="high"` + `preload` ; sur mobile une seule est visible, deux suffiraient (gain ~200 Ko sur mobile, à mesurer en prod avec Lighthouse une fois des biens publiés).
- **Champ quartier dans le Studio** : sans lui, la première station de métro tient lieu de quartier dans le title, la description, le fil de la fiche et le filtre « quartier » ; un champ `neighbourhood` donnerait de vrais mots-clés (« Saint-Germain-des-Prés »).
- **Mesure en prod** : Lighthouse / PageSpeed sur `/nos-biens` et une fiche après publication des premiers biens ; vérifier le `Cache-Control` des statiques Cloud (déjà noté le 2026-10-12) et le cache CDN de `cdn.sanity.io` (immuable, pas de souci).
- **Canonical des pages filtrées** : Laravel sérialise `city%5B0%5D=8` alors que les liens du site écrivent `city[]=8` ; sans effet SEO (`noindex`), mais deux formes d'URL pour la même page.
