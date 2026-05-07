-- Add subcategories table and update transactions to support them
-- Idempotent: safe to run multiple times.

-- ============================================================
-- SUBCATEGORIES TABLE
-- ============================================================
create table if not exists public.subcategories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name        text not null,
  icon        text,
  color       text,
  created_at  timestamptz not null default now()
);

alter table public.subcategories enable row level security;

drop policy if exists "Users can view own subcategories"   on public.subcategories;
drop policy if exists "Users can insert own subcategories" on public.subcategories;
drop policy if exists "Users can update own subcategories" on public.subcategories;
drop policy if exists "Users can delete own subcategories" on public.subcategories;

create policy "Users can view own subcategories"
  on public.subcategories for select
  using (auth.uid() = user_id);

create policy "Users can insert own subcategories"
  on public.subcategories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subcategories"
  on public.subcategories for update
  using (auth.uid() = user_id);

create policy "Users can delete own subcategories"
  on public.subcategories for delete
  using (auth.uid() = user_id);

-- ============================================================
-- ADD SUBCATEGORY SUPPORT TO TRANSACTIONS
-- ============================================================
alter table public.transactions
  add column if not exists subcategory_id uuid references public.subcategories(id) on delete set null;

-- ============================================================
-- UPDATE TRIGGER: seed default subcategories for new users
-- ============================================================
drop function if exists public.handle_new_user() cascade;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  cibo_id uuid;
  trasporti_id uuid;
  abbonamenti_id uuid;
  shopping_id uuid;
  casa_id uuid;
  sport_id uuid;
  salute_id uuid;
  svago_id uuid;
begin
  -- Income
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Stipendio',     'income', '#22c55e', '💼'),
    (new.id, 'Freelance',     'income', '#16a34a', '💻'),
    (new.id, 'Rimborso',      'income', '#4ade80', '💳'),
    (new.id, 'Altro entrata', 'income', '#86efac', '💰');

  -- Expense - insert and capture IDs for subcategories
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Casa',          'expense', '#ef4444', '🏠');
  select id into casa_id from public.categories where user_id = new.id and name = 'Casa' and type = 'expense';

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Cibo',          'expense', '#f97316', '🍕');
  select id into cibo_id from public.categories where user_id = new.id and name = 'Cibo' and type = 'expense';

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Trasporti',     'expense', '#eab308', '🚗');
  select id into trasporti_id from public.categories where user_id = new.id and name = 'Trasporti' and type = 'expense';

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Salute',        'expense', '#ec4899', '🏥');
  select id into salute_id from public.categories where user_id = new.id and name = 'Salute' and type = 'expense';

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Sport',         'expense', '#f43f5e', '🏋️');
  select id into sport_id from public.categories where user_id = new.id and name = 'Sport' and type = 'expense';

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Shopping',      'expense', '#a855f7', '🛍️');
  select id into shopping_id from public.categories where user_id = new.id and name = 'Shopping' and type = 'expense';

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Svago',         'expense', '#06b6d4', '🎬');
  select id into svago_id from public.categories where user_id = new.id and name = 'Svago' and type = 'expense';

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Abbonamenti',   'expense', '#3b82f6', '📱');
  select id into abbonamenti_id from public.categories where user_id = new.id and name = 'Abbonamenti' and type = 'expense';

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Altro uscita',  'expense', '#dc2626', '💸');

  -- Investment
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'ETF/Fondi',           'investment', '#7F77DD', '📊'),
    (new.id, 'Azioni',              'investment', '#6366f1', '📈'),
    (new.id, 'Obbligazioni/BTP',    'investment', '#534AB7', '🏦'),
    (new.id, 'Criptovalute',        'investment', '#8b5cf6', '₿'),
    (new.id, 'Liquidità',           'investment', '#a78bfa', '💵'),
    (new.id, 'Altro investimento',  'investment', '#c4b5fd', '🪙');

  -- Insert default subcategories for expense categories

  -- Cibo subcategories
  insert into public.subcategories (user_id, category_id, name, icon, color) values
    (new.id, cibo_id, 'Pizza',       '🍕', '#f97316'),
    (new.id, cibo_id, 'Sushi',       '🍣', '#f97316'),
    (new.id, cibo_id, 'Burger',      '🍔', '#f97316'),
    (new.id, cibo_id, 'Bar/Caffè',   '☕', '#f97316'),
    (new.id, cibo_id, 'Supermercato','🛒', '#f97316'),
    (new.id, cibo_id, 'Panetteria',  '🥐', '#f97316'),
    (new.id, cibo_id, 'Ristorante',  '🍽️', '#f97316'),
    (new.id, cibo_id, 'Fast Food',   '🍟', '#f97316'),
    (new.id, cibo_id, 'Altro',       '🍴', '#f97316');

  -- Trasporti subcategories
  insert into public.subcategories (user_id, category_id, name, icon, color) values
    (new.id, trasporti_id, 'Carburante/Benzina', '⛽', '#eab308'),
    (new.id, trasporti_id, 'Mezzi pubblici',     '🚌', '#eab308'),
    (new.id, trasporti_id, 'Taxi/Uber',          '🚕', '#eab308'),
    (new.id, trasporti_id, 'Parcheggio',         '🅿️', '#eab308'),
    (new.id, trasporti_id, 'Manutenzione Auto',  '🔧', '#eab308'),
    (new.id, trasporti_id, 'Altro',              '🚗', '#eab308');

  -- Abbonamenti subcategories
  insert into public.subcategories (user_id, category_id, name, icon, color) values
    (new.id, abbonamenti_id, 'Netflix',           '🎬', '#3b82f6'),
    (new.id, abbonamenti_id, 'Spotify',           '🎵', '#3b82f6'),
    (new.id, abbonamenti_id, 'Cloud Storage',     '☁️', '#3b82f6'),
    (new.id, abbonamenti_id, 'Palestra',          '💪', '#3b82f6'),
    (new.id, abbonamenti_id, 'Streaming/Gaming',  '🎮', '#3b82f6'),
    (new.id, abbonamenti_id, 'Altro',             '📱', '#3b82f6');

  -- Shopping subcategories
  insert into public.subcategories (user_id, category_id, name, icon, color) values
    (new.id, shopping_id, 'Abbigliamento',   '👕', '#a855f7'),
    (new.id, shopping_id, 'Scarpe',          '👟', '#a855f7'),
    (new.id, shopping_id, 'Libri/Media',     '📚', '#a855f7'),
    (new.id, shopping_id, 'Elettronica',     '💻', '#a855f7'),
    (new.id, shopping_id, 'Casa/Arredo',     '🪑', '#a855f7'),
    (new.id, shopping_id, 'Altro',           '🛍️', '#a855f7');

  -- Casa subcategories
  insert into public.subcategories (user_id, category_id, name, icon, color) values
    (new.id, casa_id, 'Affitto/Mutuo',      '🏠', '#ef4444'),
    (new.id, casa_id, 'Utenze (Luce/Gas)',  '💡', '#ef4444'),
    (new.id, casa_id, 'Internet/Telefono',  '📱', '#ef4444'),
    (new.id, casa_id, 'Manutenzione',       '🔨', '#ef4444'),
    (new.id, casa_id, 'Altro',              '🏡', '#ef4444');

  -- Sport subcategories
  insert into public.subcategories (user_id, category_id, name, icon, color) values
    (new.id, sport_id, 'Iscrizioni',        '📋', '#f43f5e'),
    (new.id, sport_id, 'Attrezzature',      '⚽', '#f43f5e'),
    (new.id, sport_id, 'Lezioni/Corsi',     '👨‍🏫', '#f43f5e'),
    (new.id, sport_id, 'Altro',             '🏋️', '#f43f5e');

  -- Salute subcategories
  insert into public.subcategories (user_id, category_id, name, icon, color) values
    (new.id, salute_id, 'Farmaci',           '💊', '#ec4899'),
    (new.id, salute_id, 'Visita Medica',     '👨‍⚕️', '#ec4899'),
    (new.id, salute_id, 'Dentista',          '🦷', '#ec4899'),
    (new.id, salute_id, 'Occhiali/Lenti',    '👓', '#ec4899'),
    (new.id, salute_id, 'Altro',             '🏥', '#ec4899');

  -- Svago subcategories
  insert into public.subcategories (user_id, category_id, name, icon, color) values
    (new.id, svago_id, 'Cinema/Teatro',      '🎬', '#06b6d4'),
    (new.id, svago_id, 'Concerti',           '🎵', '#06b6d4'),
    (new.id, svago_id, 'Viaggi',             '✈️', '#06b6d4'),
    (new.id, svago_id, 'Musei/Mostre',       '🎨', '#06b6d4'),
    (new.id, svago_id, 'Bar/Discoteca',      '🍻', '#06b6d4'),
    (new.id, svago_id, 'Altro',              '🎪', '#06b6d4');

  return new;
end;
$$;

-- Recreate trigger on new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
