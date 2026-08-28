import { type Faq } from '@/lib/json-ld';

/** Mirror of FaqController: lang `faq.categories` + a slug (URL anchor) per topic and per question. */
export type FaqItem = Faq & { slug: string };
export type FaqCategory = { key: string; slug: string; title: string; items: FaqItem[] };
