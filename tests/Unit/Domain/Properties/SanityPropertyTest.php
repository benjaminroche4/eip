<?php

namespace Tests\Unit\Domain\Properties;

use App\Domain\Blog\Support\SanityImage;
use App\Domain\Properties\Data\Property;
use App\Domain\Properties\Support\SanityProperty;
use Tests\TestCase;

/** The Sanity `estateProperty` document → the `Property` row (the Studio's own test listing, 2026-10-14). */
class SanityPropertyTest extends TestCase
{
    /** The projection of `FetchSanityProperties::PROJECTION` for the Studio's « [TEST] 4 pièces haussmannien » document. @return array<string, mixed> */
    public static function doc(array $overrides = []): array
    {
        return $overrides + [
            '_id' => 'estateProperty-test-fr', '_updatedAt' => '2026-10-14T12:29:15Z', 'language' => 'fr', 'status' => 'forSale', 'confidential' => false, 'featured' => true,
            'title' => '[TEST] 4 pièces haussmannien avec balcon, Paris 7e', 'slug' => 'test-4-pieces-haussmannien-avec-balcon-paris-7e', 'uniqueId' => 'EP0001',
            'createdAt' => '2026-10-02T17:35:48.445Z',
            'agent' => ['fullName' => 'Charles Mata', 'slug' => 'charles-mata', 'photo' => ['asset' => ['_ref' => 'image-2300b8e331cbf6da056b2f5acb3106ccf84778dd-1024x1024-webp']]],
            'categories' => [['slug' => 'exclusivite', 'name' => 'Exclusivité'], ['slug' => 'haussmannien', 'name' => 'Haussmannien'], ['slug' => 'familial', 'name' => 'Familial'], ['slug' => 'investissement-locatif', 'name' => 'Investissement locatif']], 'propertyType' => 'appartement',
            'description' => [
                ['_type' => 'block', 'children' => [['_type' => 'span', 'text' => 'Au troisième étage avec ascenseur, '], ['_type' => 'span', 'text' => 'appartement familial.']]],
                ['_type' => 'block', 'children' => [['_type' => 'span', 'text' => 'Parquet point de Hongrie.']]],
                ['_type' => 'image', 'asset' => ['_ref' => 'image-x']],
            ],
            'main' => ['rooms' => 4, 'bedrooms' => '3', 'bathrooms' => 2], 'surfaces' => ['carrez' => 118.4, 'living' => 121], 'floors' => ['floor' => '3', 'totalFloors' => '6'],
            'equipment' => ['balcony' => true, 'cellar' => true, 'concierge' => true, 'elevator' => true, 'fireplace' => true, 'parking' => false], 'condition' => 'good',
            'address' => ['number' => '14', 'street' => 'Avenue Bosquet', 'postalCode' => '75007', 'city' => 'Paris'], 'hideExactAddress' => true, 'arrondissement' => 7,
            'location' => ['lat' => 48.8585, 'lng' => 2.3031], 'metro' => ['École Militaire', 'La Tour-Maubourg'],
            'mainPhoto' => ['alt' => 'Double séjour haussmannien avec cheminée', 'asset' => ['_ref' => 'image-0d0f3c13ae6aa78d6f4bed72d5a05cb333435019-1448x1086-webp']],
            'photos' => [['alt' => 'Salon', 'asset' => ['_ref' => 'image-49e5893e0c28938c1a234e853f418eb1e9aa5c19-1448x1086-webp']], ['alt' => 'Cuisine', 'asset' => ['_ref' => 'broken']]],
            'price' => 1890000, 'priceOnRequest' => false, 'fees' => ['amount' => 20000, 'paidBy' => 'buyer'],
            'dpe' => ['notRequired' => false, 'energyClass' => 'D', 'energyConsumption' => 215, 'gesClass' => 'D', 'gesEmissions' => 44], 'condominium' => null,
            'metaDescription' => 'Appartement haussmannien 4 pièces de 118 m² Carrez avec balcon, 3 chambres, Paris 7e Invalides.',
            'translations' => null,
        ];
    }

    private function mapper(): SanityProperty
    {
        return new SanityProperty(new SanityImage('ks9vwq45', 'production'));
    }

    public function test_the_studio_document_maps_to_the_row_the_site_reads(): void
    {
        $row = $this->mapper()->row(self::doc(), ['fr' => 'test-4-pieces-haussmannien-avec-balcon-paris-7e', 'en' => 'test-4-rooms']);
        $property = Property::fromArray($row); // the row passes the DTO's shape check

        $this->assertSame('test-4-pieces-haussmannien-avec-balcon-paris-7e', $property->slug);
        $this->assertSame(7, $property->arrondissement);
        $this->assertSame('École Militaire', $property->area, 'the first metro station stands for the quartier the schema lacks');
        $this->assertSame('apartment', $property->type);
        $this->assertSame('sale', $property->transaction);
        $this->assertSame(1890000, $property->price);
        $this->assertSame(118, $property->surface, 'Carrez, rounded');
        $this->assertSame(4, $property->rooms);
        $this->assertSame(3, $property->bedrooms);
        $this->assertStringStartsWith('Appartement haussmannien 4 pièces', $property->excerpt);
        $this->assertSame([
            'https://cdn.sanity.io/images/ks9vwq45/production/0d0f3c13ae6aa78d6f4bed72d5a05cb333435019-1448x1086.webp?w={w}&auto=format&fit=max',
            'https://cdn.sanity.io/images/ks9vwq45/production/49e5893e0c28938c1a234e853f418eb1e9aa5c19-1448x1086.webp?w={w}&auto=format&fit=max',
        ], $property->photos, 'main photo first, the unresolvable one dropped');
        $this->assertSame('Double séjour haussmannien avec cheminée', $property->photoAlt);
        $this->assertSame(['Double séjour haussmannien avec cheminée', 'Salon'], $property->photoAlts, 'each photo keeps its own alt');
        $this->assertSame([['width' => 1448, 'height' => 1086], ['width' => 1448, 'height' => 1086]], $property->photoSizes, 'intrinsic sizes from the asset references');
        $this->assertSame('Salon', $property->photoAlt(1));
        $this->assertSame('Charles Mata', $property->advisor['name']);
        $this->assertStringContainsString('2300b8e331cbf6da056b2f5acb3106ccf84778dd-1024x1024.webp?w=64&h=64&fit=crop', (string) $property->advisor['photo']);
        $this->assertTrue($property->available);
        $this->assertNull($property->soldAt);
        $this->assertSame(SanityProperty::CENTROIDS[7], [$property->lat, $property->lng], 'the Studio hides the address: the centroid, never the geopoint (review 2026-10-14)');
        $this->assertSame([48.8585, 2.3031], (fn ($p) => [$p->lat, $p->lng])(Property::fromArray($this->mapper()->row(self::doc(['hideExactAddress' => false])))), 'the geopoint once the address is shown');
        $this->assertFalse($property->offMarket);
        $this->assertTrue($property->featured);
        $this->assertSame(['elevator', 'balcony', 'concierge', 'cellar', 'fireplace'], $property->features, 'equipment flags in the FEATURES order, the third floor of six is not the top');
        $this->assertSame('good', $property->condition);
        $this->assertSame(3, $property->floor);
        $this->assertSame('2026-10-02', $property->publishedAt);
        $this->assertSame(['Au troisième étage avec ascenseur, appartement familial.', 'Parquet point de Hongrie.'], $property->description);
        $this->assertSame(['energy' => 'D', 'climate' => 'D', 'cost_min' => null, 'cost_max' => null, 'year' => null, 'consumption' => 215, 'emissions' => 44], $property->dpe);
        $this->assertSame([2, 121, 6], [$property->bathrooms, $property->surfaceLiving, $property->totalFloors]);
        $this->assertSame(['Exclusivité', 'Haussmannien', 'Familial', 'Investissement locatif'], $property->tags);
        $this->assertSame([['date' => '2026-10-02', 'price' => 1890000]], $property->priceHistory);
        $this->assertSame([['name' => 'École Militaire', 'kind' => 'metro', 'lines' => [], 'minutes' => null], ['name' => 'La Tour-Maubourg', 'kind' => 'metro', 'lines' => [], 'minutes' => null]], $property->transport);
        $this->assertSame('EP0001', $property->reference);
        $this->assertSame(['fr' => 'test-4-pieces-haussmannien-avec-balcon-paris-7e', 'en' => 'test-4-rooms'], $property->slugs);
        $this->assertFalse($property->priceOnRequest);
        $this->assertSame(['paid_by' => 'buyer', 'amount' => 20000], $property->fees);
        $this->assertNull($property->address, 'hidden by hideExactAddress');
        $this->assertNull($property->procedure);
    }

    public function test_status_categories_floors_and_address_drive_the_flags(): void
    {
        $sold = Property::fromArray($this->mapper()->row(self::doc(['status' => 'sold'])));
        $this->assertFalse($sold->available);
        $this->assertSame('2026-10-14', $sold->soldAt, 'the document update stands for the sale date');
        $this->assertTrue($sold->isSold());

        $offer = Property::fromArray($this->mapper()->row(self::doc(['status' => 'underOffer'])));
        $this->assertFalse($offer->available);
        $this->assertNull($offer->soldAt);

        $top = Property::fromArray($this->mapper()->row(self::doc([
            'floors' => ['floor' => '6', 'totalFloors' => '6'], 'categories' => [['slug' => 'vue-degagee', 'name' => 'Vue dégagée'], ['slug' => 'coup-de-cur', 'name' => 'Coup de cœur']], 'featured' => false, 'confidential' => true, 'accessCode' => '4821',
            'hideExactAddress' => false, 'condition' => 'toRenovate', 'priceOnRequest' => true, 'propertyType' => 'hotel-particulier', 'main' => ['rooms' => 9, 'bedrooms' => '9+'],
            'equipment' => [], 'location' => null, 'metro' => [], 'dpe' => ['notRequired' => true, 'energyClass' => 'D', 'gesClass' => 'D'], 'condominium' => ['ongoingProcedure' => false],
        ])));
        $this->assertSame(['top_floor', 'view'], $top->features);
        $this->assertTrue($top->featured, 'the « Coup de cœur » category');
        $this->assertTrue($top->offMarket);
        $this->assertSame('4821', $top->accessCode);
        $this->assertArrayNotHasKey('access_code', $top->toArray(), 'the code never leaves the server');
        $this->assertArrayNotHasKey('access_code', $top->toCard());
        $this->assertNull(Property::fromArray($this->mapper()->row(self::doc(['accessCode' => '12'])))->accessCode, 'four digits or nothing');
        $this->assertSame('14 Avenue Bosquet, 75007 Paris', $top->address);
        // The address hidden: neither the address nor the exact position reach the site (review 2026-10-14)
        $hidden = Property::fromArray($this->mapper()->row(self::doc(['hideExactAddress' => true, 'location' => ['lat' => 48.8565, 'lng' => 2.3035]])));
        $this->assertNull($hidden->address);
        $this->assertSame(SanityProperty::CENTROIDS[7], [$hidden->lat, $hidden->lng], 'a hidden address sits on the arrondissement centroid');
        $this->assertSame('to_renovate', $top->condition);
        $this->assertTrue($top->priceOnRequest);
        $this->assertSame('mansion', $top->type);
        $this->assertSame(9, $top->bedrooms);
        $this->assertSame(SanityProperty::CENTROIDS[7], [$top->lat, $top->lng], 'no geopoint: the arrondissement centroid');
        $this->assertSame('Paris 7e', $top->area, 'no station: the arrondissement');
        $this->assertNull($top->dpe, 'DPE not required');
        $this->assertFalse($top->procedure);

        $studio = Property::fromArray($this->mapper()->row(self::doc(['propertyType' => 'studio', 'main' => ['rooms' => 1, 'bedrooms' => 'studio'], 'surfaces' => ['living' => 24.6]])));
        $this->assertSame(['studio', 0, 25, 1], [$studio->type, $studio->bedrooms, $studio->surface, $studio->rooms]);
        $this->assertSame(1, Property::fromArray($this->mapper()->row(self::doc(['propertyType' => 'studio', 'main' => ['bedrooms' => 'studio']])))->rooms, 'a studio without a room count is one room, never « 0 pièce »');
        $bare = Property::fromArray($this->mapper()->row(self::doc(['main' => ['rooms' => 2], 'surfaces' => ['carrez' => 40], 'floors' => null, 'categories' => null, 'dpe' => null])));
        $this->assertSame([null, null, null, [], null, null], [$bare->bathrooms, $bare->surfaceLiving, $bare->totalFloors, $bare->tags, $bare->floor, $bare->dpe], 'unfilled fields stay null, never 0');
        $this->assertSame('apartment', Property::fromArray($this->mapper()->row(self::doc(['propertyType' => 'yurt'])))->type, 'unknown type = apartment');
        // No agent in the Studio: no name (the card says « Votre conseiller »), never the brand as a person (review 2026-10-14)
        $this->assertSame(['name' => '', 'photo' => null], Property::fromArray($this->mapper()->row(self::doc(['agent' => null])))->advisor);
        // A building sold without a room count is complete; an apartment is not
        $this->assertNull(SanityProperty::missing($b = self::doc(['propertyType' => 'immeuble', 'main' => ['rooms' => null]]), $this->mapper()->row($b, [])));
    }

    public function test_a_listing_missing_a_fact_the_pages_need_is_named(): void
    {
        $missing = fn (array $over) => SanityProperty::missing($doc = self::doc($over), $this->mapper()->row($doc, []));
        $this->assertNull($missing([]));
        $this->assertSame('photo', $missing(['mainPhoto' => null, 'photos' => []]));
        $this->assertSame('arrondissement', $missing(['arrondissement' => null]));
        $this->assertSame('arrondissement', $missing(['arrondissement' => 21]));
        $this->assertSame('rooms', $missing(['main' => ['rooms' => null, 'bedrooms' => '2']]));
        $this->assertSame('surface', $missing(['surfaces' => null]));
        $this->assertSame('price', $missing(['price' => 0]));
        $this->assertNull($missing(['price' => 0, 'priceOnRequest' => true]), 'no price needed when it is on request');
    }

    public function test_portable_text_keeps_the_text_blocks_only(): void
    {
        // Lists become plain paragraphs, images and unknown blocks are dropped (documented behaviour, review 2026-10-14)
        $this->assertSame(['Un point', 'Deux', 'Suite'], SanityProperty::paragraphs([
            ['_type' => 'block', 'listItem' => 'bullet', 'children' => [['_type' => 'span', 'text' => 'Un point']]],
            ['_type' => 'block', 'listItem' => 'bullet', 'children' => [['_type' => 'span', 'text' => 'Deux']]],
            ['_type' => 'image', 'asset' => ['_ref' => 'image-x']],
            ['_type' => 'callout', 'text' => 'ignored'],
            ['_type' => 'block', 'children' => [['_type' => 'span', 'text' => 'Suite', 'marks' => ['strong']]]],
            'not a block',
        ]));
    }

    public function test_only_published_documents_with_a_clean_slug_and_a_language_are_usable(): void
    {
        $this->assertTrue(SanityProperty::publishable(self::doc()));
        $this->assertFalse(SanityProperty::publishable(self::doc(['language' => null])));
        $this->assertFalse(SanityProperty::publishable(self::doc(['slug' => 'Pas Un Slug'])));
        $this->assertFalse(SanityProperty::publishable(self::doc(['slug' => null])));
    }
}
