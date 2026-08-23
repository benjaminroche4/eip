import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    locale: string;
    year: number;
    localization: Localization;
    translations: Translations;
    seo: SeoShared;
    ziggy: { location: string; url: string };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface SeoShared {
    siteName: string;
    separator: string;
    description: string;
    image: string;
    locale: string;
    twitter: string | null;
    organization: {
        name: string;
        logo: string;
        sameAs: string[];
        email: string | null;
        phone: string | null;
        address: { street?: string; city?: string; postal_code?: string; country?: string };
    };
    social: Partial<Record<'linkedin' | 'threads' | 'facebook', string>>;
}

export interface LocaleInfo {
    code: string;
    native: string;
    regional: string;
    url: string;
    current: boolean;
}

export interface Localization {
    current: string;
    default: string;
    regional: string;
    locales: LocaleInfo[];
    /** Current page in every locale + 'x-default' — feeds hreflang and the language switcher. */
    alternates: Record<string, string>;
}

export type Translations = { [key: string]: string | Translations };
