import { defineCliConfig } from 'sanity/cli';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'tftrnrna';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

export default defineCliConfig({
  api: { projectId, dataset },
  deployment: {
    appId: 'jxttu1qo1entgmzakeh2x575',
  },
  typegen: {
    enabled: true,
    path: './src/**/*.{ts,tsx,astro}',
    schema: 'schema.json',
    generates: './sanity.types.ts',
    overloadClientMethods: true,
  },
});
