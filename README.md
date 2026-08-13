# I See What You See AR

AI-powered camera/WebAR prototype: point your phone at something, capture it, and get an AI-generated identification card over the camera view. Ask follow-up questions about the same image.

## What it does

- Mobile-first camera UI with front/rear camera switching
- Capture a live camera frame or choose an image
- Server-side OpenAI vision analysis
- AR-style result overlay on top of the live camera
- Follow-up questions about the captured object
- Demo fallback when the AI endpoint is not configured
- No API key is shipped to the browser

## Run with AI

The frontend is static, but the `/api/analyze` endpoint needs a server runtime because an OpenAI API key must stay private. Vercel is the easiest deployment target.

1. Import this repository into Vercel.
2. Add an environment variable named `OPENAI_API_KEY`.
3. Optionally set `OPENAI_MODEL` (defaults to `gpt-4.1-mini`).
4. Deploy.
5. Open the deployed HTTPS URL on a phone and allow camera access.

For local development, install Vercel CLI and run `vercel dev`.

## GitHub Pages note

GitHub Pages can host the static frontend, but it cannot securely execute `/api/analyze` or hold an OpenAI secret. If this repo is published with GitHub Pages alone, the app intentionally falls back to a demo identification card. Use Vercel or another serverless backend for live AI.

## Architecture

`camera -> JPEG data URL -> /api/analyze -> OpenAI Responses API (image input) -> JSON result -> AR-style overlay`

The first version deliberately uses a camera overlay rather than requiring WebXR immersive AR. This makes the experience usable on a much wider range of phones and browsers. A later version can add optional world anchoring with WebXR/MindAR.

## Privacy

The captured image is sent to the configured AI endpoint only when the user presses the capture/analyze button. Do not deploy the API with a client-exposed API key.
