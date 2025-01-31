import { defineConfig } from '@hey-api/openapi-ts';
import { endpoint } from './src/lib/config'

export default defineConfig({
  client: '@hey-api/client-fetch',
  input:
    endpoint + '/schema',
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './src/client',
  },
  // experimentalParser: true,
  plugins: [
    '@hey-api/schemas',
    '@hey-api/services',
    // '@tanstack/svelte-query',
    // 'zod'
    // {
    //   dates: true,
    //   name: '@hey-api/transformers',
    // },
    // {
    //   enums: 'javascript',
    //   name: '@hey-api/types',
    // },
  ],
});
// npx @hey-api/openapi-ts
