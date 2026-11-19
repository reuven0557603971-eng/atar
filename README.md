# Atar AI

A Hebrew/English AI chat application built with Node.js, Express and Cloudflare Workers AI. Designed to deploy on Render and to remain usable in Chromium 81+.

## Run locally

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`.
5. Run `npm start` and open http://localhost:3000.

## Deploy to Render

1. Create a **Web Service** and connect this GitHub repository.
2. Set **Build Command** to `npm install`.
3. Set **Start Command** to `npm start`.
4. Add environment variables in Render:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
   - optionally `CLOUDFLARE_MODEL`
5. Deploy. The service listens on Render's `PORT` environment variable.

## Cloudflare setup

Create a Cloudflare API token with permission to run Workers AI, and copy your Account ID from the Cloudflare dashboard. Never put credentials in frontend files or commit a real `.env` file.

The default model is `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Override it with `CLOUDFLARE_MODEL` if needed.

## Features

- Hebrew RTL and English support
- Multi-turn conversations
- New chat and local session history
- Loading indicator and copy-response action
- Server-side Cloudflare credentials
- Health endpoint at `/api/health`

## Browser support

The frontend intentionally uses broadly supported browser APIs and CSS, avoids relying on backdrop-filter, and is targeted at Chromium 81 and newer.
