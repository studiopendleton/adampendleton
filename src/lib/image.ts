import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { sanityClient } from './sanity';

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export function backgroundImageUrl(
  source: SanityImageSource | null | undefined,
): string | undefined {
  if (!source || typeof source !== 'object' || !('asset' in source) || !source.asset) {
    return undefined;
  }

  // Request the uploaded width. A larger width makes the Sanity CDN upscale
  // the portrait past the file the live site serves.
  const width = uploadedWidth(source);
  const image = urlFor(source).auto('format');
  return (width ? image.width(width) : image).url();
}

function uploadedWidth(source: SanityImageSource): number | undefined {
  if (!source || typeof source !== 'object' || !('asset' in source)) return undefined;
  const asset = source.asset;
  if (!asset || typeof asset !== 'object' || !('metadata' in asset)) return undefined;
  const metadata = asset.metadata;
  if (!metadata || typeof metadata !== 'object' || !('dimensions' in metadata)) return undefined;
  const dimensions = metadata.dimensions;
  if (!dimensions || typeof dimensions !== 'object' || !('width' in dimensions)) return undefined;
  const width = dimensions.width;
  return typeof width === 'number' && width > 0 ? Math.round(width) : undefined;
}
