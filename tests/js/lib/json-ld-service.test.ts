import { serviceNode } from '@/lib/json-ld';
import { describe, expect, it } from 'vitest';

describe('serviceNode', () => {
    it('describes a free service of the organisation served in Paris', () => {
        const node = serviceNode(
            {
                name: 'Estimation immobilière gratuite à Paris',
                description: 'Estate in Paris estime…',
                url: 'https://example.test/estimation',
                serviceType: 'Estimation',
            },
            'https://example.test',
        );
        expect(node).toMatchObject({
            '@type': 'Service',
            '@id': 'https://example.test/estimation#service',
            name: 'Estimation immobilière gratuite à Paris',
            provider: { '@id': 'https://example.test/#organization' },
            areaServed: { '@type': 'City', name: 'Paris' },
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        });
    });
});
