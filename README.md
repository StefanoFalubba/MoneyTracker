# FinanceTrack

Personal finance tracker with support for **income**, **expenses**, and **investments** as three distinct transaction types.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Auth + RLS)
- **Tailwind CSS** + custom shadcn/ui components
- **Recharts** for charts
- **React Hook Form** + **Zod** for forms
- **Vercel** deployment

---

## Setup

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- (Optional) [Vercel](https://vercel.com) account for deployment

### 2. Clone & install

```bash
git clone <your-repo-url>
cd financetrack
npm install
```

### 3. Supabase project

1. Create a new Supabase project at [app.supabase.com](https://app.supabase.com)
2. In the **SQL Editor**, run the contents of `supabase/migrations/001_initial_schema.sql`
   - This creates the `categories` and `transactions` tables with RLS policies
   - It also registers a database trigger that auto-seeds default categories for new users

### 4. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Both values are found in **Supabase → Project Settings → API**.

### 5. Run locally

```bash
npm run dev
# App is at http://localhost:3000
```

---

## Deploy to Vercel

1. Push your code to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel project settings
4. Deploy — Vercel auto-detects Next.js

---

## Three Transaction Types

| Type | Color | Symbol | Effect on balance |
|------|-------|--------|-------------------|
| **Income** (Entrata) | 🟢 Green | `+` | Adds to net balance |
| **Expense** (Spesa) | 🔴 Red | `−` | Subtracts from net balance |
| **Investment** (Investimento) | 🟣 Purple | `→` | **NOT subtracted** — money is reallocated, not lost |

**Net balance = Income − Expenses only. Investments are shown separately.**

---

## Monefy CSV Import Guide

### How to export from Monefy

1. Open Monefy → tap the three dots (⋮) menu
2. Select **Export to file**
3. Choose **CSV** format
4. Send the file to your computer (email, cloud, USB)

### Import into FinanceTrack

1. Go to **Importa** in the navigation
2. **Step 1 — Upload**: drag & drop the `.csv` file or click to browse
3. **Step 2 — Preview**: review the first 10 parsed rows and any skipped rows
4. **Step 3 — Map categories**: for each Monefy category:
   - Select an existing FinanceTrack category, OR
   - Create a new one (choose name + type: income / expense / **investment**)
   - The type defaults to `income` for positive amounts and `expense` for negative ones
   - You can override any category to `investment` here
5. **Step 4 — Confirm**: the import runs, duplicates are skipped automatically

### Duplicate detection

A row is considered a duplicate if a transaction with the same `date + amount + description + category_id` already exists in your account.

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Dashboard with summary cards and charts |
| `/transactions` | Full transaction list with filters and CRUD |
| `/investments` | Dedicated investments view with portfolio allocation |
| `/categories` | Manage categories grouped by type |
| `/import` | Monefy CSV importer |
| `/settings` | Update email/password, sign out |
| `/login` | Sign in |
| `/signup` | Create account |

---

## Database Schema

```sql
-- categories
id, user_id, name, type (income|expense|investment), color, icon, created_at

-- transactions
id, user_id, category_id, amount (always positive), type, description, date, created_at
```

Row Level Security is enabled on both tables. Users can only access their own rows.
