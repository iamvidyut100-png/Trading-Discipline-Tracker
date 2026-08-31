# Trading Discipline Tracker

## Supabase authentication on Netlify

The dashboard is protected by Supabase authentication and supports email/password accounts and Google sign-in. Before deploying, configure the following **Netlify environment variables** (Site configuration → Environment variables):

- `VITE_SUPABASE_URL` — the Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` — the Supabase publishable (or legacy anon) key.

In Supabase, enable **Email** and **Google** providers under Authentication → Providers. Set the Authentication URL Configuration **Site URL** to the production Netlify URL and add both the production URL and any required deploy-preview/local URLs to **Redirect URLs**. Google must also be configured with the Google OAuth credentials in Supabase.

The `VITE_` values are included at build time, so trigger a new Netlify build after changing them. See `artifacts/trading-discipline/.env.example` for local development variable names.
