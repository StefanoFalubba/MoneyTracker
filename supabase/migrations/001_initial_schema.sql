-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('income', 'expense', 'investment')),
  color       text,
  icon        text,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  amount       numeric(12,2) not null check (amount > 0),
  type         text not null check (type in ('income', 'expense', 'investment')),
  description  text,
  date         date not null default current_date,
  created_at   timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- FUNCTION: seed default categories for new users
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Income categories
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Stipendio',     'income', '#22c55e', '💼'),
    (new.id, 'Freelance',     'income', '#16a34a', '💻'),
    (new.id, 'Rimborso',      'income', '#4ade80', '💳'),
    (new.id, 'Altro entrata', 'income', '#86efac', '💰');

  -- Expense categories
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Casa',          'expense', '#ef4444', '🏠'),
    (new.id, 'Cibo',          'expense', '#f97316', '🍕'),
    (new.id, 'Trasporti',     'expense', '#eab308', '🚗'),
    (new.id, 'Salute',        'expense', '#ec4899', '🏥'),
    (new.id, 'Sport',         'expense', '#f43f5e', '🏋️'),
    (new.id, 'Shopping',      'expense', '#a855f7', '🛍️'),
    (new.id, 'Svago',         'expense', '#06b6d4', '🎬'),
    (new.id, 'Abbonamenti',   'expense', '#3b82f6', '📱'),
    (new.id, 'Altro uscita',  'expense', '#dc2626', '💸');

  -- Investment categories
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'ETF/Fondi',           'investment', '#7F77DD', '📊'),
    (new.id, 'Azioni',              'investment', '#6366f1', '📈'),
    (new.id, 'Obbligazioni/BTP',    'investment', '#534AB7', '🏦'),
    (new.id, 'Criptovalute',        'investment', '#8b5cf6', '₿'),
    (new.id, 'Liquidità',           'investment', '#a78bfa', '💵'),
    (new.id, 'Altro investimento',  'investment', '#c4b5fd', '🪙');

  return new;
end;
$$;

-- Trigger on new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
