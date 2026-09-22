import { teamNodes, teamOrganizationNode } from '@/lib/json-ld';
import { describe, expect, it } from 'vitest';
import { sharedProps } from '../inertia';

const MEMBERS = [
    { name: 'Alexandre Moreau', role: 'Conseiller senior', flags: ['FR', 'GB'], photo: '/images/team/member-1.jpg' },
    { name: 'Sophie Dubois', role: 'Spécialiste acquéreurs internationaux', flags: ['FR'], photo: 'https://cdn.example/sophie.jpg' },
];

describe('team JSON-LD (About page E-E-A-T)', () => {
    it('describes each advisor as a Person working for the organisation, with languages from the flags', () => {
        const nodes = teamNodes(MEMBERS, 'https://example.test');
        expect(nodes).toHaveLength(2);
        expect(nodes[0]).toMatchObject({
            '@type': 'Person',
            '@id': 'https://example.test/#person-1',
            name: 'Alexandre Moreau',
            jobTitle: 'Conseiller senior',
            image: 'https://example.test/images/team/member-1.jpg',
            knowsLanguage: ['fr', 'en'],
            worksFor: { '@id': 'https://example.test/#organization' },
        });
        expect(nodes[1].image).toBe('https://cdn.example/sophie.jpg'); // absolute URLs kept as is
        expect(nodes[1].knowsLanguage).toEqual(['fr']);
    });

    it('lists the advisors as employees of the organisation node', () => {
        const org = teamOrganizationNode(sharedProps().seo, 'https://example.test', 2);
        expect(org['@id']).toBe('https://example.test/#organization');
        expect(org.employee).toEqual([{ '@id': 'https://example.test/#person-1' }, { '@id': 'https://example.test/#person-2' }]);
    });
});
