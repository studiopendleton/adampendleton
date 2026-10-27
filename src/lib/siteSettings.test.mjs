import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
const { toSiteSettings } = await server.ssrLoadModule('/src/lib/siteSettings.ts');

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

  it('uses the static homepage when Sanity has no document', () => {
    const settings = toSiteSettings(null);
    const html = settings.mainText.map((block) => block.html).join('\n');
    assert.match(html, /central figure/);
    assert.equal(settings.title, 'Adam Pendleton');
    assert.equal(settings.desktopBackgroundImage, '/images/background-desktop.jpg');
  });
});
