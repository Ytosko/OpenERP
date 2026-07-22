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

---

### Option B: Standalone PostgreSQL Container in Coolify

If you only want PostgreSQL 16 (without full Supabase Auth UI):

1. In Coolify, click **+ New Resource** -> **Database** -> **PostgreSQL**.
2. Select **PostgreSQL 16-alpine**.
3. Set your Database Name (e.g. `pos_erp_db`), User, and Password.
4. Coolify will run PostgreSQL in a Docker container and expose connection URL `postgresql://postgres:password@postgres:5432/pos_erp_db`.

---

## 2. Applying SQL Migrations to Coolify Supabase / PostgreSQL

Once your Supabase/PostgreSQL service is running in Coolify:

1. Open **Supabase Studio** (or connect via `psql` / DBeaver using your database connection string).
2. Go to **SQL Editor**.
3. Run the 3 migration scripts from `supabase/migrations/`:
   - `202607230001_initial_schema.sql`
   - `202607230002_rls_policies.sql`
   - `202607230003_complete_sale_function.sql`

---

## 3. Full 1-Click Topology in Coolify

```text
┌─────────────────────────────────────────────────────────────┐
│                       COOLIFY VPS                           │
│                                                             │
│  ┌────────────────────────┐     ┌────────────────────────┐  │
│  │ POS Frontend App       │     │ Self-Hosted Supabase   │  │
│  │ (Vite Static / Nginx)  │────►│ Stack / PostgreSQL     │  │
│  │ pos.yourdomain.com     │     │ api.yourdomain.com     │  │
│  └────────────────────────┘     └────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables for your App in Coolify:
```env
VITE_SUPABASE_URL=https://api.yourdomain.com
VITE_SUPABASE_ANON_KEY=your_self_hosted_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_APP_URL=https://pos.yourdomain.com
```
