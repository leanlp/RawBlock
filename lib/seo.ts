import type { Metadata } from "next";

export const SITE_NAME = "Raw Block";
export const SITE_URL = "https://www.rawblock.net";
export const SITE_DESCRIPTION =
  "Bitcoin analysis and learning workspace with live explorer tools, protocol labs, research registries, and source-aware fallbacks.";

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  /** Bilingual hreflang pair when /es mirror exists */
  locales?: { enPath: string; esPath: string };
};

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
  image = "/icon.png",
  locales,
}: MetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const alternates: Metadata["alternates"] = { canonical: url };
  if (locales) {
    alternates.languages = {
      en: absoluteUrl(locales.enPath),
      es: absoluteUrl(locales.esPath),
      "x-default": absoluteUrl(locales.enPath),
    };
  }
  return {
    title,
    description,
    alternates,
    keywords,
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${SITE_NAME} preview` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@rawblocknet",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon.png"),
    sameAs: [
      "https://github.com/leanlp/rawblock",
      "https://x.com/rawblocknet",
      "https://linkedin.com/company/rawblock",
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: ["en", "es"],
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/explorer/decoder?query={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type FaqItem = { question: string; answer: string };

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

type SoftwareApplicationInput = {
  name: string;
  description: string;
  path: string;
  applicationCategory?: string;
};

export function softwareApplicationJsonLd({
  name,
  description,
  path,
  applicationCategory = "DeveloperApplication",
}: SoftwareApplicationInput) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: absoluteUrl(path),
    applicationCategory,
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

type TechArticleInput = {
  headline: string;
  description: string;
  path: string;
  dateModified?: string;
  datePublished?: string;
  about?: string[];
};

export function techArticleJsonLd({
  headline,
  description,
  path,
  dateModified,
  datePublished,
  about = [],
}: TechArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    datePublished: datePublished ?? "2026-01-01",
    dateModified: dateModified ?? "2026-02-22",
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.png"),
      },
    },
    about: about.map((name) => ({ "@type": "Thing", name })),
    inLanguage: ["en", "es"],
  };
}

type CollectionPageInput = {
  name: string;
  description: string;
  path: string;
};

export function collectionPageJsonLd({ name, description, path }: CollectionPageInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}
