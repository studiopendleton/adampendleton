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
};

const fallbackSiteSettings: SiteSettings = {
  title: 'Adam Pendleton',
  mainText: [
    {
      html: '<p>Adam Pendleton, a central figure in contemporary abstract painting, is known for works that push the boundaries of the medium through a sustained engagement with process, language, and form. He extends non-linear compositional traditions that are rooted in twentieth- and twenty-first-century painting. His work, a distilled layering of gesture and fragment, is marked by a precision reminiscent of Conceptual and Minimal art. In 2008, he began to define the working method for which he is now widely recognized as Black Dada—a critical framework that explores the relationship between Blackness, abstraction, and the historical avant-gardes.</p>',
    },
    {
      html: '<p>In 2024, he was honored with the Rosenthal Family Foundation Award for Painting from the American Academy of Arts and Letters.</p>',
    },
    {
      html: '<p>Pendleton’s work is held in numerous public collections, including The Museum of Modern Art, New York; the Solomon R. Guggenheim Museum, New York; the Whitney Museum of American Art, New York; the Studio Museum in Harlem, New York; the Carnegie Museum of Art, Pittsburgh; the Museum of Contemporary Art Chicago; the Los Angeles County Museum of Art; the Museum of Contemporary Art San Diego; the Virginia Museum of Fine Arts, Richmond; the Montreal Museum of Fine Arts; the National Gallery of Canada, Ottawa; Tate, London; and the Pinakothek der Moderne, Munich.</p>',
    },
    {
      html: '<ul><li><p><a href="https://www.nytimes.com/2021/09/10/arts/design/adam-pendleton-moma-who-is-queen.html#:~:text=%E2%80%9CWho%20Is%20Queen%3F%E2%80%9D%20at,the%20museum%2C%E2%80%9D%20he%20said." target="_blank">“Adam Pendleton is Rethinking the Museum”<br><em>New York Times </em>→</a></p></li><li><p><a href="https://www.frieze.com/article/adam-pendleton-celebrates-poetry-wildness-and-black-resistance" target="_blank">“Adam Pendleton Celebrates Poetry, Wildness, and Black Resistance”<br><em>Frieze </em>→</a></p></li><li><p><a href="https://www.nytimes.com/2024/06/07/t-magazine/adam-pendleton-pace-gallery.html" target="_blank">“Adam Pendleton Holds Our Attention”<br><em>New York Times T Magazine </em>→</a></p></li><li><p><a href="https://www.nytimes.com/2025/04/24/arts/design/adam-pendleton-hirshhorn-museum.html" target="_blank" title="In the Heart of Washington, Adam Pendleton’s Work Demands Deep Thought">“In the Heart of Washington, Adam Pendleton’s Work Demands Deep Thought”<em><br>New York Times </em>→</a></p></li></ul>',
    },
  ],
  frameHeight: 100,
  footerHtml:
    'For more information, <br class="mobile-break"><a href="mailto:info@adampendleton.net">email the studio</a>.<br> <a href="https://www.instagram.com/pendleton.adam/">IG</a>',
  desktopBackgroundImage: '/images/background-desktop.jpg',
  mobileBackgroundImage: '/images/background-mobile.jpg',
  backgroundPosition: 'top',
  bodyTextColor: '#232323',
  backgroundColor: '#ffffff',
  fontSize: '3rem',
  mobileFontSize: 0.5,
  blend: true,
  font: 'ABCMonumentGrotesk',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await sanityClient.fetch(siteSettingsQuery);
    if (!settings) return fallbackSiteSettings;

    const mainText =
      settings.mainText
        ?.map((block) => ({ html: portableTextToHtml(block.content) }))
        .filter((block) => block.html.length > 0) ?? [];

    const footerFromPt = normalizeFooterHtml(portableTextToHtml(settings.footerText));

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
      mainText: mainText.length > 0 ? mainText : fallbackSiteSettings.mainText,
      footerHtml: footerFromPt || fallbackSiteSettings.footerHtml,
      desktopBackgroundImage:
        backgroundImageUrl(settings.desktopBackgroundImage) ??
        fallbackSiteSettings.desktopBackgroundImage,
      mobileBackgroundImage:
        backgroundImageUrl(settings.mobileBackgroundImage) ??
        fallbackSiteSettings.mobileBackgroundImage,
    };
  } catch {
    return fallbackSiteSettings;
  }
}

function normalizeFooterHtml(html: string): string {
  if (!html) return '';

  // PT hard breaks become <br>; first break before the email link stays mobile-only.
  return html.replace(
    /(For more information,\s*)<br\s*\/?>/i,
    '$1<br class="mobile-break">',
  );
}

function portableTextToHtml(value?: unknown[] | null): string {
  if (!value?.length) return '';

  return toHTML(value as Parameters<typeof toHTML>[0], {
    components: {
      marks: {
        link: ({ children, value }) => {
          const href = typeof value?.href === 'string' ? value.href : '#';
          const target = href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : '';
          return `<a href="${href}"${target}>${children}</a>`;
        },
      },
    },
  });
}
