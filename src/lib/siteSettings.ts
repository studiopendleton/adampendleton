import { toHTML } from '@portabletext/to-html';
import { backgroundImageUrl } from './image';
import { sanityClient } from './sanity';
import { siteSettingsQuery } from './queries';

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

const fallbackSiteSettings: SiteSettings = {
  title: 'Adam Pendleton',
  mainText: [
    {
      html: '<p>Adam Pendleton is a leading figure in contemporary art. Working primarily as a painter, his work has redefined the boundaries of abstraction through a sustained engagement with process, language, and conceptual form. In 2008, he began to define the working method for which he is now widely recognized as Black Dada—a critical framework that explores the relationship between Blackness, abstraction, and avant-garde movements. His work has been featured in solo exhibitions at leading museums and galleries around the world, including the Museum of Modern Art in New York and the Hirshhorn Museum and Sculpture Garden in Washington, DC.</p>',
    },
    {
      html: '<p>In 2024, he was honored with the Rosenthal Family Foundation Award for Painting from the American Academy of Arts and Letters.</p>',
    },
    {
      html: '<p>Pendleton’s work is held in major public collections worldwide, including the Museum of Modern Art; the Solomon R. Guggenheim Museum; the Whitney Museum of American Art; the Studio Museum in Harlem; Tate; and the Pinakothek der Moderne, among many others.</p>',
    },
    {
      html: '<ul><li><p><a href="https://www.nytimes.com/2026/09/23/arts/design/adam-pendleton-amsterdam-artist.html" target="_blank" rel="noreferrer">“Adam Pendleton Is Painting the White Cube Black”<br><em>New York Times </em>→</a></p></li><li><p><a href="https://www.frieze.com/article/adam-pendleton-celebrates-poetry-wildness-and-black-resistance" target="_blank" rel="noreferrer">“Adam Pendleton Celebrates Poetry, Wildness, and Black Resistance”<br><em>Frieze </em>→</a></p></li><li><p><a href="https://www.nytimes.com/2024/06/07/t-magazine/adam-pendleton-pace-gallery.html" target="_blank" rel="noreferrer">“Adam Pendleton Holds Our Attention”<br><em>New York Times T Magazine </em>→</a></p></li><li><p><a href="https://www.nytimes.com/2025/04/24/arts/design/adam-pendleton-hirshhorn-museum.html" target="_blank" rel="noreferrer">“In the Heart of Washington, Adam Pendleton’s Work Demands Deep Thought”<br><em>New York Times </em>→</a></p></li></ul>',
    },
  ],
  frameHeight: 100,
  footerHtml:
    '<p>For more information, <br class="mobile-break"><a href="mailto:info@adampendleton.net">email the studio</a>.<br class="mobile-break"><br><a href="https://www.instagram.com/pendleton.adam/" target="_blank" rel="noreferrer">IG</a></p>',
  desktopBackgroundImage: '/images/background-desktop.jpg',
  mobileBackgroundImage: '/images/background-mobile.jpg',
  backgroundPosition: 'top',
  bodyTextColor: '#232323',
  backgroundColor: '#ffffff',
  fontSize: '3rem',
  mobileFontSize: 0.5,
  blend: true,
  font: 'ABCMonumentGrotesk',
  fontWeight: '500',
};

type RawTextBlock = {
  content?: unknown[] | null;
};

type RawSettings = {
  title?: string | null;
  mainText?: RawTextBlock[] | null;
  frameHeight?: number | null;
  footerText?: unknown[] | null;
  desktopBackgroundImage?: Parameters<typeof backgroundImageUrl>[0];
  mobileBackgroundImage?: Parameters<typeof backgroundImageUrl>[0];
  backgroundPosition?: string | null;
  bodyTextColor?: string | null;
  backgroundColor?: string | null;
  fontSize?: string | null;
  mobileFontSize?: number | null;
  blend?: boolean | null;
  font?: string | null;
  fontWeight?: string | null;
};

function isRawSettings(value: unknown): value is RawSettings {
  return typeof value === 'object' && value !== null;
}

export function toSiteSettings(settings: unknown): SiteSettings {
  if (!isRawSettings(settings)) return fallbackSiteSettings;

  const mainText =
    settings.mainText
      ?.map((block) => ({ html: portableTextToHtml(block.content) }))
      .filter((block) => block.html.length > 0) ?? [];

  const footerFromPt = portableTextToHtml(settings.footerText);

  return {
    title: settings.title ?? fallbackSiteSettings.title,
    frameHeight: settings.frameHeight ?? fallbackSiteSettings.frameHeight,
    backgroundPosition:
      (settings.backgroundPosition as SiteSettings['backgroundPosition']) ??
      fallbackSiteSettings.backgroundPosition,
    bodyTextColor: settings.bodyTextColor ?? fallbackSiteSettings.bodyTextColor,
    backgroundColor: settings.backgroundColor ?? fallbackSiteSettings.backgroundColor,
    fontSize: settings.fontSize ?? fallbackSiteSettings.fontSize,
    mobileFontSize: settings.mobileFontSize ?? fallbackSiteSettings.mobileFontSize,
    blend: settings.blend ?? fallbackSiteSettings.blend,
    font: settings.font ?? fallbackSiteSettings.font,
    fontWeight: normalizeFontWeight(settings.fontWeight),
    mainText: mainText.length > 0 ? mainText : fallbackSiteSettings.mainText,
    footerHtml: footerFromPt || fallbackSiteSettings.footerHtml,
    desktopBackgroundImage:
      backgroundImageUrl(settings.desktopBackgroundImage) ??
      fallbackSiteSettings.desktopBackgroundImage,
    mobileBackgroundImage:
      backgroundImageUrl(settings.mobileBackgroundImage) ??
      fallbackSiteSettings.mobileBackgroundImage,
  };
}

// A production build that cannot reach Sanity fails, so Cloudflare keeps the
// last good deploy live instead of publishing the static fallback.
export async function getSiteSettings(): Promise<SiteSettings> {
  let settings: unknown;
  try {
    settings = await sanityClient.fetch(siteSettingsQuery);
  } catch (error) {
    if (import.meta.env.PROD) {
      throw new Error('Could not fetch siteSettings from Sanity.', { cause: error });
    }
    return fallbackSiteSettings;
  }
  return toSiteSettings(settings);
}

function normalizeFontWeight(value?: string | null): SiteSettings['fontWeight'] {
  if (value === '400' || value === '500' || value === '700') return value;
  return fallbackSiteSettings.fontWeight;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMobileOnlyBreak(child: Record<string, unknown>): boolean {
  const key = typeof child._key === 'string' ? child._key : '';
  return child._type === 'span' && child.text === '\n' && key.includes('mobile');
}

function markMobileBreaks(value: unknown[]): unknown[] {
  return value.map((node) => {
    if (!isRecord(node) || !Array.isArray(node.children)) return node;
    return {
      ...node,
      children: node.children.map((child) => {
        if (!isRecord(child) || !isMobileOnlyBreak(child)) return child;
        return { _type: 'mobileBreak', _key: child._key };
      }),
    };
  });
}

function portableTextToHtml(value?: unknown[] | null): string {
  if (!value?.length) return '';

  return toHTML(markMobileBreaks(value) as Parameters<typeof toHTML>[0], {
    components: {
      types: {
        mobileBreak: () => '<br class="mobile-break">',
      },
      listItem: ({ children }) => `<li><p>${children}</p></li>`,
      hardBreak: () => '<br>',
      marks: {
        link: ({ children, value: link }) => {
          const href = typeof link?.href === 'string' ? link.href : '#';
          const target = href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : '';
          return `<a href="${href}"${target}>${children}</a>`;
        },
      },
    },
  });
}
