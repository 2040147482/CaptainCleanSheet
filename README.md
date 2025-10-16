<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Next.js and Supabase Starter Kit - the fastest way to build apps with Next.js and Supabase" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Next.js and Supabase Starter Kit</h1>
</a>

<p align="center">
 The fastest way to build apps with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Middleware
  - Client
  - Server
  - It just works!
- supabase-ssr. A package to configure Supabase Auth to use cookies
- Password-based authentication block installed via the [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
  ```
  > [!NOTE]
  > This example uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which refers to Supabase's new **publishable** key format.
  > Both legacy **anon** keys and new **publishable** keys can be used with this variable name during the transition period. Supabase's dashboard may show `NEXT_PUBLIC_SUPABASE_ANON_KEY`; its value can be used in this example.
  > See the [full announcement](https://github.com/orgs/supabase/discussions/29260) for more information.

  Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)

## Plugin Integration (MVP)

This project includes initial building blocks to integrate a plugin/extension with unified account and permissions.

Environment variables (see `.env.example`):

- `PLUGIN_JWT_SECRET`: secret to sign short-lived plugin JWTs.
- `PLUGIN_TOKEN_TTL_MINUTES`: token TTL in minutes (default 15).
- `PLUGIN_JWT_TTL_SECONDS`: TTL in seconds for `/api/auth/sync-token` issued cookie token (default 3600).
- `CREEM_API_KEY`: Creem API key.
- `CREEM_WEBHOOK_SECRET`: Creem webhook signing secret.

API routes:

- `POST /api/plugin/issue-token`: issues short-lived JWT for the logged-in user (reads Supabase session cookies).
- `GET /api/plugin/entitlements`: verifies plugin JWT and returns current entitlements.
- `POST /api/usage`: verifies plugin JWT and stores usage events (expects `event_type`, optional `event_id`, `installation_id`, `units`).
- `POST /api/webhooks/creem`: receives Creem billing/subscription events.

Login/Logout Sync:

- `GET /api/auth/me`: returns `{ authenticated, user, entitlements }` for the current session (reads Supabase cookies).
- `POST /api/auth/sync-token`: issues a short-lived plugin JWT (audience `plugin`, includes `user_id`) and sets `captain_token` HttpOnly cookie for the site domain. TTL is controlled by `PLUGIN_JWT_TTL_SECONDS`.
- `DELETE /api/auth/sync-token`: clears `captain_token` (and optional `captain_refresh`) cookies to signal logout to extensions.

Recommended browser extension flow (WXT/Chrome):

- On startup, read cookies for your site domain, e.g. `chrome.cookies.getAll({ domain: "captaincleansheet.com" })`, to obtain `captain_token`.
- Attach the token on every API call: `Authorization: Bearer <captain_token>`.
- Listen for cookie changes: `chrome.cookies.onChanged.addListener(({ cookie, removed }) => { if (cookie.name === 'captain_token' && removed) {/* clear local token */} })`.
- Alternatively, call `GET /api/auth/me` to detect session state and adjust UI.

Entitlements:

- Implemented in `lib/entitlements.ts`. It reads a `subscriptions` table (if present) and falls back to a `free` plan.

### Phase 2: Device Code Login, Refresh Token & PAT, Rate Limiting

New APIs:

- `POST /api/device/start`: start device login, returns `device_code`, `verification_uri`, `expires_at`.
- `POST /api/device/confirm`: confirm device login with `code` by a logged-in user.
- `GET /api/device/token?code=...`: exchange approved device code for `access_token` and `refresh_token`.
- `POST /api/plugin/token`: exchange `refresh_token` or `pat` for a short-lived plugin `access_token`.
- `POST /api/pat/create`: create a PAT for the logged-in user; plaintext key returned only at creation.
- `GET /api/pat/list`: list PATs for current user (masked).
- `POST /api/pat/revoke`: revoke PAT by `key_id`.
- `GET /api/auth/me`: return current logged-in user and entitlements.
- `POST /api/auth/sync-token` and `DELETE /api/auth/sync-token`: set/clear `captain_token` cookie to synchronize login/logout with extensions.

Rate limiting & quotas:

- Implemented in `lib/rate-limit.ts` and enforced in `/api/usage`.
- Uses an entitlement limit `dailyRequests` to cap daily usage; returns `429` when exceeded.
- Recommended schema update for `usage_events`: add `created_at timestamptz default now()` to support daily aggregation.

PAT Management UI:

- Under `/[lang]/profile` → Account tab, a PAT panel allows creating, copying, listing, and revoking PATs.

Environment variables (see `.env.example`):

- `PLUGIN_JWT_SECRET`: secret to sign plugin JWTs.
- `PLUGIN_TOKEN_TTL_MINUTES`: TTL for plugin tokens.
- `PLUGIN_JWT_TTL_SECONDS`: TTL in seconds for `/api/auth/sync-token` issued cookie token.
- `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`: Creem integration.

Suggested tables (minimum viable):

- `device_codes`: `code`, `status`, `user_id`, `expires_at`, `approved_at`, `claimed_at`.
- `refresh_tokens`: `token`, `user_id`, `expires_at`.
- `api_keys`: `id`, `user_id`, `status`, `plaintext_key`, `created_at`, `last_used_at`.
- `usage_events`: `event_id`, `user_id`, `org_id`, `installation_id`, `event_type`, `units`, `created_at`.
 - Optional: `refresh_tokens` for long-lived plugin refresh flow.

Tables suggested for production:

- `subscriptions` (user/org scoped): `plan`, `status`, `current_period_end`.
- `usage_events`: `event_id`, `user_id`, `org_id`, `installation_id`, `event_type`, `units`.

Example: issue a plugin token (client must be logged in on the website):

```bash
curl -X POST -b "<your session cookies>" http://localhost:3000/api/plugin/issue-token
```

Example: read entitlements with plugin token:

```bash
curl -H "Authorization: Bearer <plugin_jwt>" http://localhost:3000/api/plugin/entitlements
```

## Database Schema & RLS

- A full SQL schema with tables, constraints, indexes, triggers, and RLS policies is provided at `docs/supabase-schema.sql`.
- Apply it in your Supabase project (SQL editor or migration tool). The script covers:
  - `profiles` (auto-created via trigger on `auth.users`, owner-readable/updatable).
  - `subscriptions` (synced via Creem webhooks, owner-readable).
  - `usage_events` (for rate limiting, owner-readable; indexes on `(user_id, created_at)` and `(org_id, created_at)`).
  - `refresh_tokens` (admin-only).
  - `api_keys` (PATs, owner CRUD; `status` check constraint).
  - `device_codes` (admin-only, status lifecycle).
  - `webhooks_log` (idempotency by `digest`, admin-only).

Migration steps:

1. Open your Supabase project dashboard → SQL editor.
2. Paste the contents of `docs/supabase-schema.sql` and run.
3. Verify tables exist and RLS policies are enabled as intended.
4. Create users via the app; `profiles` rows will be auto-created.
5. Configure environment variables in `.env.local` (see `.env.example`) including Creem keys and optional test base `CREEM_API_BASE=https://test-api.creem.io`.

Notes:

- Service role operations in API routes bypass RLS (intended for webhooks and device/PAT flows).
- Owner-select policies are required for `/api/auth/me`, `lib/entitlements.ts`, and `lib/rate-limit.ts` to read `subscriptions` and `usage_events` via user session.
- If you later add org memberships, extend `subscriptions` and `usage_events` policies to allow access based on org membership.
