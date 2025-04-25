import { defineConfig } from '@hey-api/openapi-ts';



export default defineConfig({
  client: '@hey-api/client-fetch',
  input:
    (await import('./static/config.json')).endpoint + '/schema',
    // "./schema.json",
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './src/client',
  },
  // experimentalParser: true,
  plugins: [
    '@hey-api/schemas',
    '@hey-api/services',
  ],
});
// npx @hey-api/openapi-ts
