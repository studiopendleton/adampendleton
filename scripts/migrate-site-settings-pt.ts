import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-06-04' });

type SeedSiteSettings = {
  _id: string;
  _type: string;
  title: string;
  mainText: unknown[];
  frameHeight: number;
  footerText: unknown[];
  backgroundPosition: string;
  bodyTextColor: string;
  backgroundColor: string;
  fontSize: string;
  mobileFontSize: number;
  blend: boolean;
  font: string;
};

async function migrateSiteSettingsToPortableText() {
  const seedPath = resolve(process.cwd(), 'src/sanity/seed/siteSettings.json');
  const seed = JSON.parse(readFileSync(seedPath, 'utf8')) as SeedSiteSettings;

  const existing = await client.fetch<{ _id?: string } | null>(
    `*[_id == "siteSettings"][0]{ _id }`,
  );

  if (!existing?._id) {
    throw new Error('siteSettings document not found in the target dataset');
  }

  await client
    .patch('siteSettings')
    .set({
      title: seed.title,
      mainText: seed.mainText,
      frameHeight: seed.frameHeight,
      footerText: seed.footerText,
      backgroundPosition: seed.backgroundPosition,
      bodyTextColor: seed.bodyTextColor,
      backgroundColor: seed.backgroundColor,
      fontSize: seed.fontSize,
      mobileFontSize: seed.mobileFontSize,
      blend: seed.blend,
      font: seed.font,
    })
    .unset(['footerHtml'])
    .commit();

  console.log('Patched siteSettings to Portable Text and cleared legacy HTML fields.');
}

migrateSiteSettingsToPortableText().catch((error) => {
  console.error(error);
  process.exit(1);
});
