import { teamNodes, teamOrganizationNode } from '@/lib/json-ld';
import { describe, expect, it } from 'vitest';
import { sharedProps } from '../inertia';

const MEMBERS = [
    { name: 'Julien L.', role: 'Conseiller senior', photo: '/images/team/member-1.jpg' },
    { name: 'Eva B.', role: 'Conseillère clientèle internationale', photo: 'https://cdn.example/eva.jpg' },
];

describe('team JSON-LD (About page E-E-A-T)', () => {
    it('describes each advisor as a Person working for the organisation, bilingual fr + en', () => {
        const nodes = teamNodes(MEMBERS, 'https://example.test');
        expect(nodes).toHaveLength(2);
        expect(nodes[0]).toMatchObject({
            '@type': 'Person',
            '@id': 'https://example.test/#person-1',
            name: 'Julien L.',
            jobTitle: 'Conseiller senior',
            image: 'https://example.test/images/team/member-1.jpg',
            knowsLanguage: ['fr', 'en'],
            worksFor: { '@id': 'https://example.test/#organization' },
        });
        expect(nodes[1].image).toBe('https://cdn.example/eva.jpg'); // absolute URLs kept as is
        expect(nodes[1].knowsLanguage).toEqual(['fr', 'en']); // the whole team is bilingual
    });

    it('lists the advisors as employees of the organisation node', () => {
        const org = teamOrganizationNode(sharedProps().seo, 'https://example.test', 2);
        expect(org['@id']).toBe('https://example.test/#organization');
        expect(org.employee).toEqual([{ '@id': 'https://example.test/#person-1' }, { '@id': 'https://example.test/#person-2' }]);
    });
});
