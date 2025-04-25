# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Config

For deployment purposes, the config object is a json file `config.json` lying in the `src/static` folder.
When needing a config parameter, you can import the `store` defined in `src/config.ts`. 

However, since that store is set in the top `+layout.ts`, svelte offers no guarantee it will be before things in `src/lib` are imported. To work with it in those files, it is preferable to go through the `window.config` object set in `app.html`.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

### Deployment

To prepare for the build pipeline in Jenkinsfile, it is recommended to get a static version of the
schema from a running server:

```
curl ${SRV}/schema -o schema.json
```

Then you should set it as input in the `openapi-ts.config.ts` file.
