<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1830c3ca-7fb7-4d78-a998-a1c70374d937

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies: `npm install`
2. Create an ignored `.dev.vars` file containing `GEMINI_API_KEY=...`.
3. Build the frontend: `npm run build`.
4. Run the frontend and Worker API together: `npx wrangler dev`.

Do not expose the key through a Vite variable or `vite.config.ts`. All browser AI
requests go to the same-origin `/api/ai/generate` Worker route.

## Deploy

1. Rotate any Gemini key that has previously been included in a frontend build.
2. Store the replacement as an encrypted Worker secret: `npx wrangler secret put GEMINI_API_KEY`.
3. Deploy with `npx wrangler deploy`.

Production must additionally protect `/api/ai/generate` with the application's
real authenticated session and rate limiting. Origin validation prevents
cross-site browser calls but is not a substitute for authentication.
