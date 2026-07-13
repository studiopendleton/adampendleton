import { getCliClient } from 'sanity/cli';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const client = getCliClient({ apiVersion: '2026-06-04' });

const images = [
  {
    field: 'desktopBackgroundImage',
    path: 'public/images/background-desktop.jpg',
    alt: 'Adam Pendleton site background (desktop)',
  },
  {
    field: 'mobileBackgroundImage',
    path: 'public/images/background-mobile.jpg',
    alt: 'Adam Pendleton site background (mobile)',
  },
] as const;

async function uploadBackgroundImages() {
  const patch = client.patch('siteSettings');

  for (const image of images) {
    const filePath = resolve(process.cwd(), image.path);
    const asset = await client.assets.upload('image', readFileSync(filePath), {
      filename: image.path.split('/').pop(),
    });

    patch.set({
      [image.field]: {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
        alt: image.alt,
      },
    });

    console.log(`Uploaded ${image.field}: ${asset._id}`);
  }

  await patch.commit();
  console.log('Updated siteSettings with background images.');
}

uploadBackgroundImages().catch((error) => {
  console.error(error);
  process.exit(1);
});
