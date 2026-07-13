import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { sanityClient } from './sanity';

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export function backgroundImageUrl(
  source: SanityImageSource | null | undefined,
  width = 2560,
): string | undefined {
  if (!source || typeof source !== 'object' || !('asset' in source) || !source.asset) {
    return undefined;
  }

  return urlFor(source).width(width).auto('format').url();
}
