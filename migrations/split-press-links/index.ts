import { at, defineMigration, set } from 'sanity/migrate';
import { migrateMainText } from '../../src/lib/pressLinks';

export default defineMigration({
  title: 'Split the homepage press list into press links',
  documentTypes: ['siteSettings'],
  migrate: {
    document(doc) {
      const next = migrateMainText(doc.mainText);
      if (JSON.stringify(next) === JSON.stringify(doc.mainText)) return;
      return [at('mainText', set(next))];
    },
  },
});
