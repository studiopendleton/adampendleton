import { CogIcon } from '@sanity/icons';
import type { StructureResolver } from 'sanity/structure';

export const SITE_SETTINGS_DOCUMENT_ID = 'siteSettings';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Homepage')
        .id(SITE_SETTINGS_DOCUMENT_ID)
        .icon(CogIcon)
        .schemaType('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId(SITE_SETTINGS_DOCUMENT_ID)),
    ]);
