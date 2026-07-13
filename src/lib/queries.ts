import { defineQuery } from 'groq';

const imageProjection = /* groq */ `{
  asset->{
    _id,
    url,
    metadata {
      lqip,
      dimensions { width, height }
    }
  },
  alt,
  hotspot,
  crop
}`;

export const siteSettingsQuery = defineQuery(/* groq */ `*[_id == "siteSettings"][0]{
  title,
  mainText[]{
    _key,
    content,
    html
  },
  frameHeight,
  footerText,
  footerHtml,
  desktopBackgroundImage ${imageProjection},
  mobileBackgroundImage ${imageProjection},
  backgroundPosition,
  bodyTextColor,
  backgroundColor,
  fontSize,
  mobileFontSize,
  blend,
  font
}`);
