import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
const { toSiteSettings } = await server.ssrLoadModule('/src/lib/siteSettings.ts');
const { migrateMainText } = await server.ssrLoadModule('/src/lib/pressLinks.ts');

after(async () => {
  await server.close();
});

const cmsText = {
  title: 'From CMS',
  frameHeight: 120,
  backgroundPosition: 'center',
  bodyTextColor: '#111111',
  backgroundColor: '#eeeeee',
  fontSize: '2.5rem',
  mobileFontSize: 0.33,
  blend: false,
  font: 'Unica',
  fontWeight: '700',
  mainText: [
    {
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: 'White Cube probe', marks: [] }],
        },
      ],
    },
  ],
  footerText: [
    {
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', text: 'Footer from CMS', marks: [] }],
    },
  ],
};

function pressItem(key, mark, href, title, publication) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    markDefs: [{ _key: mark, _type: 'link', href }],
    children: [
      { _type: 'span', _key: `${key}a`, marks: [mark], text: title },
      { _type: 'span', _key: `${key}b`, marks: [mark, 'em'], text: publication },
      { _type: 'span', _key: `${key}c`, marks: [mark], text: '→' },
    ],
  };
}

describe('toSiteSettings', () => {
  it('keeps CMS copy when a background image cannot be resolved', () => {
    const settings = toSiteSettings({
      ...cmsText,
      desktopBackgroundImage: { asset: { _id: 'not-an-image' } },
      mobileBackgroundImage: null,
    });

    assert.equal(settings.title, 'From CMS');
    assert.equal(settings.font, 'Unica');
    assert.equal(settings.blend, false);
    assert.equal(settings.frameHeight, 120);
    assert.match(settings.mainText[0].html, /White Cube probe/);
    assert.match(settings.footerHtml, /Footer from CMS/);
    assert.equal(settings.desktopBackgroundImage, '/images/background-desktop.jpg');
    assert.equal(settings.mobileBackgroundImage, '/images/background-mobile.jpg');
  });

  it('renders press links as list items with paragraphs', () => {
    const settings = toSiteSettings({
      ...cmsText,
      mainText: [
        {
          content: [
            {
              _type: 'block',
              _key: 'press1',
              style: 'normal',
              listItem: 'bullet',
              level: 1,
              markDefs: [{ _key: 'nyt', _type: 'link', href: 'https://example.com/story' }],
              children: [
                { _type: 'span', _key: 'press1a', marks: ['nyt'], text: 'Title' },
                { _type: 'span', _key: 'press1br', marks: ['nyt'], text: '\n' },
                { _type: 'span', _key: 'press1b', marks: ['nyt', 'em'], text: 'Paper ' },
              ],
            },
          ],
        },
      ],
    });

    assert.match(settings.mainText[0].html, /<li><p><a href="https:\/\/example.com\/story"/);
    assert.match(settings.mainText[0].html, /Title<br><em>Paper <\/em>/);
  });

  it('keeps every mobile line break hidden on desktop', () => {
    const settings = toSiteSettings({
      ...cmsText,
      footerText: [
        {
          _type: 'block',
          style: 'normal',
          markDefs: [
            { _type: 'link', _key: 'email', href: 'mailto:info@adampendleton.net' },
            { _type: 'link', _key: 'ig', href: 'https://www.instagram.com/pendleton.adam/' },
          ],
          children: [
            { _type: 'span', _key: 'footer1a', marks: [], text: 'For more information, ' },
            { _type: 'span', _key: 'footer1mobile', marks: [], text: '\n' },
            { _type: 'span', _key: 'footer1b', marks: ['email'], text: 'email the studio' },
            { _type: 'span', _key: 'footer1c', marks: [], text: '.' },
            { _type: 'span', _key: 'footer1mobile2', marks: [], text: '\n' },
            { _type: 'span', _key: 'footer1ig', marks: [], text: '\n' },
            { _type: 'span', _key: 'footer1e', marks: ['ig'], text: 'IG' },
          ],
        },
      ],
    });

    const mobileBreaks = settings.footerHtml.match(/<br class="mobile-break">/g) ?? [];
    assert.equal(mobileBreaks.length, 2);
    assert.match(
      settings.footerHtml,
      /<br class="mobile-break"><br><a href="https:\/\/www.instagram.com\/pendleton.adam\/"/,
    );
  });

  it('renders reordered press links as the same list', () => {
    const pressList = {
      _key: 'presslinks',
      _type: 'homeTextBlock',
      content: [
        pressItem('press2', 'frieze', 'https://www.frieze.com/article/adam-pendleton-celebrates-poetry-wildness-and-black-resistance', '“Adam Pendleton Celebrates Poetry, Wildness, and Black Resistance”\n', 'Frieze '),
        pressItem('press3', 'nytT', 'https://www.nytimes.com/2024/06/07/t-magazine/adam-pendleton-pace-gallery.html', '“Adam Pendleton Holds Our Attention”\n', 'New York Times T Magazine '),
        pressItem('press4', 'nytHirsh', 'https://www.nytimes.com/2025/04/24/arts/design/adam-pendleton-hirshhorn-museum.html', '“In the Heart of Washington, Adam Pendleton’s Work Demands Deep Thought”\n', 'New York Times '),
        pressItem('press1', 'nytQueen', 'https://www.nytimes.com/2026/09/23/arts/design/adam-pendleton-amsterdam-artist.html', '“Adam Pendleton Is Painting the White Cube Black”\n', 'New York Times '),
      ],
    };
    const bio = {
      _key: 'bio',
      _type: 'homeTextBlock',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: 'Biography stays put', marks: [] }],
        },
      ],
    };
    const before = toSiteSettings({ ...cmsText, mainText: [bio, pressList] });
    const migrated = migrateMainText([bio, pressList]);
    const after = toSiteSettings({ ...cmsText, mainText: migrated });

    assert.deepEqual(
      migrated.map((item) => item._key),
      ['bio', 'press2', 'press3', 'press4', 'press1'],
    );
    assert.equal(migrated[1].publication, 'Frieze');
    assert.equal(migrated[1].url, pressList.content[0].markDefs[0].href);
    assert.equal(
      after.mainText.map((block) => block.html).join('\n'),
      before.mainText.map((block) => block.html).join('\n'),
    );
  });

  it('leaves a press block unchanged when an item is missing a url', () => {
    const block = {
      _key: 'presslinks',
      content: [
        {
          _type: 'block',
          _key: 'press2',
          listItem: 'bullet',
          children: [{ _type: 'span', text: 'Title\n', marks: [] }],
        },
      ],
    };

    assert.deepEqual(migrateMainText([block]), [block]);
  });

  it('uses the static homepage when Sanity has no document', () => {
    const settings = toSiteSettings(null);
    const html = settings.mainText.map((block) => block.html).join('\n');
    assert.match(html, /leading figure/);
    assert.equal(settings.title, 'Adam Pendleton');
    assert.equal(settings.desktopBackgroundImage, '/images/background-desktop.jpg');
  });
});
