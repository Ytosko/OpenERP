# Full Coolify Self-Hosting Guide (App + Supabase / PostgreSQL Container)

Yes! You can host **both** the POS Web Application AND **Supabase** (or PostgreSQL) entirely inside Coolify on your own VPS server.

---

## 1. Hosting Supabase / PostgreSQL in Coolify

### Option A: One-Click Supabase Stack in Coolify (Recommended)

Coolify has built-in one-click support for self-hosting the full Supabase stack (PostgreSQL, Auth, Storage, Studio, Kong API Gateway).

1. In your Coolify dashboard, select **+ New Resource** -> **Service**.
2. Search for **Supabase** and select it.
3. Coolify will automatically launch the official Supabase stack containers:
   - PostgreSQL 15/16
   - Supabase Auth (GoTrue)
   - Supabase Storage
   - Supabase Studio Dashboard (`https://studio.yourdomain.com`)
   - Kong Gateway (`https://supabase-api.yourdomain.com`)
4. Once deployed, Coolify displays your keys:
   - `NEXT_PUBLIC_SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

> **Note:** The app requires the full Supabase stack (Auth + PostgREST), not a
> bare PostgreSQL container — the migrations reference the `auth` schema
> (`auth.users`, `auth.uid()`) and the frontend talks to Supabase Auth and the
> REST API. Use Option A (or hosted supabase.com); a standalone Postgres
> database is NOT sufficient on its own.

---

## 2. Applying SQL Migrations

Once your Supabase service is running (Coolify one-click or supabase.com):

1. Open **Supabase Studio** -> **SQL Editor** (or use `supabase db push` with the CLI).
2. Run the 4 migration scripts from `supabase/migrations/` **in order**:
   - `202607230001_initial_schema.sql`
   - `202607230002_rls_policies.sql`
   - `202607230003_complete_sale_function.sql`
   - `202607230004_bootstrap_functions.sql`

## 3. (Optional) AI Features — Edge Function

The Gemini API key is a **server-side secret**, never a frontend variable:

```bash
supabase functions deploy ai-gateway
supabase secrets set GEMINI_API_KEY=your-gemini-key
```

Without this, the app still works — AI forecasting/layout features fall back
to local heuristics.

---

## 4. Full 1-Click Topology in Coolify

```text
┌─────────────────────────────────────────────────────────────┐
│                       COOLIFY VPS                           │
│                                                             │
│  ┌────────────────────────┐     ┌────────────────────────┐  │
│  │ POS Frontend App       │     │ Self-Hosted Supabase   │  │
│  │ (Vite Static / Apache) │────►│ Stack (Auth+REST+DB)   │  │
│  │ pos.yourdomain.com     │     │ api.yourdomain.com     │  │
│  └────────────────────────┘     └────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 5. Environment Variables for the App in Coolify

```env
VITE_SUPABASE_URL=https://api.yourdomain.com
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_URL=https://pos.yourdomain.com
```

> **IMPORTANT — mark these as Build Variables.** Vite compiles `VITE_*` values
> into the static JS bundle during `npm run build` inside the Docker build.
> In Coolify's Environment Variables UI, enable the **"Build Variable"**
> toggle for each of the three variables above so they are passed to the
> Docker build stage. Runtime-only environment variables have NO effect on an
> already-built static bundle. After changing any of them, trigger a
> **rebuild/redeploy** (not just a restart).

The anon key is safe to expose in the bundle — access control is enforced by
Row Level Security policies in the database, not by hiding the key. Never put
the `SUPABASE_SERVICE_ROLE_KEY` or a Gemini key in any `VITE_*` variable.
