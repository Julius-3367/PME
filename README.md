## Created with Capacitor Create App

This app was created using [`@capacitor/create-app`](https://github.com/ionic-team/create-capacitor-app),
and comes with a very minimal shell for building an app.

### Running this example

To run the provided example, you can use `npm start` command.

```bash
npm start
```

## Authentication & multi-instance configuration

This project includes a small auth flow and supports multiple API instances (domains). Key points:

- Login page: `src/login.html` — allows adding/selecting API domains and signing in.
- API base management: stored in localStorage under `api_base` and a list of recent instances under `api_instances`.
- Token storage: by default the app uses Capacitor Secure Storage (if the plugin is available at runtime) to persist tokens securely on-device; it falls back to `localStorage`/`sessionStorage` in web environments.

How to configure and test locally

1. Start the dev server:

```bash
npm install
npm start
```

2. Open the app in your browser at `http://localhost:5173/login.html`.
3. Add your API domain (e.g. `https://api.example.com`) in the API field and click Add.
4. Select the instance and sign in. The app will POST to `{api_base}/api/login`.

Notes for QA and handover

- The auth helper is in `src/js/api.js`. It exports `login`, `getUser`, `logout`, and helpers `getApiBase`, `setApiBase`, `getInstances`, `addInstance`.
- Token operations are async and use `src/js/secure-storage.js` to prefer Capacitor Secure Storage on native platforms.
- If you intend to test on a real device, install and configure a Secure Storage plugin (for example `cordova-plugin-secure-storage-echo` or the Capacitor community equivalent) and ensure it is exposed as `Capacitor.Plugins.SecureStorage` at runtime.

If you want, I can also add automated tests or a small end-to-end script that runs against a local API mock to validate the full login/logout flow.

## Local mock API and automated test

I added a small mock API and a script to run a minimal end-to-end API test.

- Mock API: `server/mock-api.cjs` (Express) — default port 4000. It implements `/api/login`, `/api/user`, `/api/logout`.
- Start it:

```bash
npm run mock-api
# or: node server/mock-api.cjs
```

- Run the automated API end-to-end test:

```bash
npm run test:e2e
```

The test starts the mock API if it's not already running, performs login/getUser/logout flows, and exits with non-zero status on failure. This is a lightweight test useful for QA automation; it verifies API integration (not the UI interactions).

For a full UI-driven E2E (browser automation) I can add a Playwright/Puppeteer test, but note those require downloading browser binaries and take longer to set up — I left that out to keep the repository light and easy for QA to run.

## Capacitor Secure Storage plugin (Android/iOS) wiring

The code is prepared to use a Secure Storage plugin at runtime. To enable secure native token storage:

1. Install a Capacitor-compatible secure storage plugin, for example the community plugin:

```bash
npm install @capacitor-community/secure-storage
npx cap sync
```

2. On native code ensure the plugin is registered (Capacitor 5 usually auto-registers plugins installed via npm).

3. At runtime our wrapper will try to call `Capacitor.Plugins.SecureStorage` methods `get`, `set`, `remove`.
	- If your plugin exposes different method names, adapt `src/js/secure-storage.js` accordingly.

4. Rebuild your native projects and run on device/emulator.

Example plugin integration notes (Android/iOS):

- Android: after `npx cap sync android` open Android Studio and build. The plugin should be linked automatically.
- iOS: after `npx cap sync ios` open the workspace in Xcode and build; ensure the plugin is present in the Pods and frameworks.

If you'd like, I can add exact shell commands and modify `secure-storage.js` to support whichever plugin you prefer (I can add explicit support for `@capacitor-community/secure-storage` or other common plugins).
