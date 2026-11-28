import { useEffect } from 'react';

export const SITE_URL = 'https://maxywalk.com';
export const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

function upsertMeta(attrName, attrValue, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(url) {
  if (!url) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function toAbsoluteUrl(urlOrPath) {
  if (!urlOrPath) return DEFAULT_IMAGE;
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  return `${SITE_URL}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`;
}

/**
 * Updates document title, meta tags, canonical link, OpenGraph, Twitter Cards,
 * and optional page-level JSON-LD structured data.
 */
export function useSeo({
  title,
  description,
  keywords,
  path = '/',
  image,
  type = 'website',
  noindex = false,
  jsonLd = null,
}) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const resolvedImage = toAbsoluteUrl(image);

    if (title) {
      document.title = title;
      upsertMeta('property', 'og:title', title);
      upsertMeta('name', 'twitter:title', title);
    }

    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
      upsertMeta('name', 'twitter:description', description);
    }

    if (keywords) {
      upsertMeta('name', 'keywords', keywords);
    }

    upsertMeta(
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    upsertCanonical(canonicalUrl);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:image', resolvedImage);
    upsertMeta('name', 'twitter:image', resolvedImage);

    // Manage dynamic page-specific JSON-LD
    const existing = document.head.querySelector('script[data-seo-jsonld="true"]');
    if (existing) existing.remove();

    let script = null;
    if (jsonLdKey) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = jsonLdKey;
      document.head.appendChild(script);
    }

    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [title, description, keywords, path, image, type, noindex, jsonLdKey]);
}
