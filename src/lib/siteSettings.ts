import { toHTML } from '@portabletext/to-html';
import seedFile from '../sanity/seed/siteSettings.json';
import { backgroundImageUrl } from './image';
import { siteSettingsQuery } from './queries';
import { sanityClient } from './sanity';

export type HomeTextBlock = {
  html: string;
};

export type SiteSettings = {
  title: string;
  mainText: HomeTextBlock[];
  frameHeight: number;
  footerHtml: string;
  desktopBackgroundImage?: string;
  mobileBackgroundImage?: string;
  backgroundPosition: 'top' | 'center' | 'bottom';
  bodyTextColor: string;
  backgroundColor: string;
  fontSize: string;
  mobileFontSize: number;
  blend: boolean;
  font: string;
  fontWeight: '400' | '500' | '700';
};

type PortableTextSpan = {
  _type?: string;
  _key?: string;
  text?: string;
  marks?: string[];
};

type PortableTextBlock = {
  _type: string;
  _key?: string;
  style?: string;
  listItem?: string;
  level?: number;
  markDefs?: { _key: string; _type: string; href?: string }[];
  children?: PortableTextSpan[];
};

type SeedDocument = {
  title: string;
  mainText: { content?: PortableTextBlock[] }[];
  frameHeight: number;
  footerText: PortableTextBlock[];
  backgroundPosition: SiteSettings['backgroundPosition'];
  bodyTextColor: string;
  backgroundColor: string;
  fontSize: string;
  mobileFontSize: number;
  blend: boolean;
  font: string;
  fontWeight?: string;
};

const seed = seedFile as SeedDocument;

const localBackgrounds = {
  desktopBackgroundImage: '/images/background-desktop.jpg',
  mobileBackgroundImage: '/images/background-mobile.jpg',
} as const;

export async function getSiteSettings(): Promise<SiteSettings> {
  const fallback = settingsFromSeed();

  try {
    const settings = await sanityClient.fetch(siteSettingsQuery);
    if (!settings) return fallback;

    const mainText =
      settings.mainText
        ?.map((block) => ({ html: portableTextToHtml(block.content) }))
        .filter((block) => block.html.length > 0) ?? [];

    const footerFromPt = normalizeFooterHtml(portableTextToHtml(settings.footerText));
    const font = settings.font ?? fallback.font;

    return {
      title: settings.title ?? fallback.title,
      frameHeight: settings.frameHeight ?? fallback.frameHeight,
      backgroundPosition:
        (settings.backgroundPosition as SiteSettings['backgroundPosition']) ??
        fallback.backgroundPosition,
      bodyTextColor: settings.bodyTextColor ?? fallback.bodyTextColor,
      backgroundColor: settings.backgroundColor ?? fallback.backgroundColor,
      fontSize: settings.fontSize ?? fallback.fontSize,
      mobileFontSize: settings.mobileFontSize ?? fallback.mobileFontSize,
      blend: settings.blend ?? fallback.blend,
      font,
      fontWeight: fontWeightFor(font, settings.fontWeight),
      mainText: mainText.length > 0 ? mainText : fallback.mainText,
      footerHtml: footerFromPt || fallback.footerHtml,
      desktopBackgroundImage:
        backgroundImageUrl(settings.desktopBackgroundImage) ?? fallback.desktopBackgroundImage,
      mobileBackgroundImage:
        backgroundImageUrl(settings.mobileBackgroundImage) ?? fallback.mobileBackgroundImage,
    };
  } catch {
    return fallback;
  }
}

function settingsFromSeed(): SiteSettings {
  const mainText = seed.mainText
    .map((block) => ({ html: portableTextToHtml(block.content) }))
    .filter((block) => block.html.length > 0);

  return {
    title: seed.title,
    mainText,
    frameHeight: seed.frameHeight,
    footerHtml: normalizeFooterHtml(portableTextToHtml(seed.footerText)),
    ...localBackgrounds,
    backgroundPosition: seed.backgroundPosition,
    bodyTextColor: seed.bodyTextColor,
    backgroundColor: seed.backgroundColor,
    fontSize: seed.fontSize,
    mobileFontSize: seed.mobileFontSize,
    blend: seed.blend,
    font: seed.font,
    fontWeight: fontWeightFor(seed.font, seed.fontWeight),
  };
}

function fontWeightFor(font: string, value?: string | null): SiteSettings['fontWeight'] {
  if (font !== 'ABCMonumentGrotesk') return '400';
  if (value === '400' || value === '500' || value === '700') return value;
  return '400';
}

function normalizeFooterHtml(html: string): string {
  if (!html) return '';

  // Portable Text hard breaks become <br/>. The live footer hides the break
  // after "For more information," and the break after the email sentence on
  // desktop, and keeps one always-visible break before the Instagram link.
  return html
    .replace(/(For more information,\s*)<br\s*\/?>/i, '$1<br class="mobile-break">')
    .replace(/(<\/a>\.\s*)<br\s*\/?>(\s*<br\s*\/?>)/i, '$1<br class="mobile-break">$2');
}

function portableTextToHtml(value?: PortableTextBlock[] | null): string {
  if (!value?.length) return '';

  return toHTML(value as Parameters<typeof toHTML>[0], {
    components: {
      listItem: {
        bullet: ({ children }) => `<li><p>${children}</p></li>`,
        number: ({ children }) => `<li><p>${children}</p></li>`,
      },
      marks: {
        link: ({ children, value: link }) => {
          const href = typeof link?.href === 'string' ? link.href : '#';
          const attrs = opensInNewTab(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
          return `<a href="${escapeAttribute(href)}"${attrs}>${children}</a>`;
        },
      },
    },
  });
}

function opensInNewTab(href: string): boolean {
  if (!href.startsWith('http://') && !href.startsWith('https://')) return false;

  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    // The live footer Instagram link stays in the same tab. Press links do not.
    return host !== 'instagram.com';
  } catch {
    return true;
  }
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
