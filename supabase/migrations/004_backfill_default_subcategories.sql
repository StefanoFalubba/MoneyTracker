-- One-time backfill: seed default subcategories for any existing user
-- who doesn't already have any. Safe to run multiple times.

do $$
declare
  u record;
  cibo_id uuid;
  trasporti_id uuid;
  abbonamenti_id uuid;
  shopping_id uuid;
  casa_id uuid;
  sport_id uuid;
  salute_id uuid;
  svago_id uuid;
begin
  for u in
    select id from auth.users
    where id not in (select distinct user_id from public.subcategories)
  loop
    -- Get category IDs for this user
    select id into cibo_id from public.categories where user_id = u.id and name = 'Cibo' and type = 'expense';
    select id into trasporti_id from public.categories where user_id = u.id and name = 'Trasporti' and type = 'expense';
    select id into abbonamenti_id from public.categories where user_id = u.id and name = 'Abbonamenti' and type = 'expense';
    select id into shopping_id from public.categories where user_id = u.id and name = 'Shopping' and type = 'expense';
    select id into casa_id from public.categories where user_id = u.id and name = 'Casa' and type = 'expense';
    select id into sport_id from public.categories where user_id = u.id and name = 'Sport' and type = 'expense';
    select id into salute_id from public.categories where user_id = u.id and name = 'Salute' and type = 'expense';
    select id into svago_id from public.categories where user_id = u.id and name = 'Svago' and type = 'expense';

    -- Insert default subcategories for this user
    if cibo_id is not null then
      insert into public.subcategories (user_id, category_id, name, icon, color) values
        (u.id, cibo_id, 'Pizza',       '🍕', '#f97316'),
        (u.id, cibo_id, 'Sushi',       '🍣', '#f97316'),
        (u.id, cibo_id, 'Burger',      '🍔', '#f97316'),
        (u.id, cibo_id, 'Bar/Caffè',   '☕', '#f97316'),
        (u.id, cibo_id, 'Supermercato','🛒', '#f97316'),
        (u.id, cibo_id, 'Panetteria',  '🥐', '#f97316'),
        (u.id, cibo_id, 'Ristorante',  '🍽️', '#f97316'),
        (u.id, cibo_id, 'Fast Food',   '🍟', '#f97316'),
        (u.id, cibo_id, 'Altro',       '🍴', '#f97316');
    end if;

    if trasporti_id is not null then
      insert into public.subcategories (user_id, category_id, name, icon, color) values
        (u.id, trasporti_id, 'Carburante/Benzina', '⛽', '#eab308'),
        (u.id, trasporti_id, 'Mezzi pubblici',     '🚌', '#eab308'),
        (u.id, trasporti_id, 'Taxi/Uber',          '🚕', '#eab308'),
        (u.id, trasporti_id, 'Parcheggio',         '🅿️', '#eab308'),
        (u.id, trasporti_id, 'Manutenzione Auto',  '🔧', '#eab308'),
        (u.id, trasporti_id, 'Altro',              '🚗', '#eab308');
    end if;

    if abbonamenti_id is not null then
      insert into public.subcategories (user_id, category_id, name, icon, color) values
        (u.id, abbonamenti_id, 'Netflix',           '🎬', '#3b82f6'),
        (u.id, abbonamenti_id, 'Spotify',           '🎵', '#3b82f6'),
        (u.id, abbonamenti_id, 'Cloud Storage',     '☁️', '#3b82f6'),
        (u.id, abbonamenti_id, 'Palestra',          '💪', '#3b82f6'),
        (u.id, abbonamenti_id, 'Streaming/Gaming',  '🎮', '#3b82f6'),
        (u.id, abbonamenti_id, 'Altro',             '📱', '#3b82f6');
    end if;

    if shopping_id is not null then
      insert into public.subcategories (user_id, category_id, name, icon, color) values
        (u.id, shopping_id, 'Abbigliamento',   '👕', '#a855f7'),
        (u.id, shopping_id, 'Scarpe',          '👟', '#a855f7'),
        (u.id, shopping_id, 'Libri/Media',     '📚', '#a855f7'),
        (u.id, shopping_id, 'Elettronica',     '💻', '#a855f7'),
        (u.id, shopping_id, 'Casa/Arredo',     '🪑', '#a855f7'),
        (u.id, shopping_id, 'Altro',           '🛍️', '#a855f7');
    end if;

    if casa_id is not null then
      insert into public.subcategories (user_id, category_id, name, icon, color) values
        (u.id, casa_id, 'Affitto/Mutuo',      '🏠', '#ef4444'),
        (u.id, casa_id, 'Utenze (Luce/Gas)',  '💡', '#ef4444'),
        (u.id, casa_id, 'Internet/Telefono',  '📱', '#ef4444'),
        (u.id, casa_id, 'Manutenzione',       '🔨', '#ef4444'),
        (u.id, casa_id, 'Altro',              '🏡', '#ef4444');
    end if;

    if sport_id is not null then
      insert into public.subcategories (user_id, category_id, name, icon, color) values
        (u.id, sport_id, 'Iscrizioni',        '📋', '#f43f5e'),
        (u.id, sport_id, 'Attrezzature',      '⚽', '#f43f5e'),
        (u.id, sport_id, 'Lezioni/Corsi',     '👨‍🏫', '#f43f5e'),
        (u.id, sport_id, 'Altro',             '🏋️', '#f43f5e');
    end if;

    if salute_id is not null then
      insert into public.subcategories (user_id, category_id, name, icon, color) values
        (u.id, salute_id, 'Farmaci',           '💊', '#ec4899'),
        (u.id, salute_id, 'Visita Medica',     '👨‍⚕️', '#ec4899'),
        (u.id, salute_id, 'Dentista',          '🦷', '#ec4899'),
        (u.id, salute_id, 'Occhiali/Lenti',    '👓', '#ec4899'),
        (u.id, salute_id, 'Altro',             '🏥', '#ec4899');
    end if;

    if svago_id is not null then
      insert into public.subcategories (user_id, category_id, name, icon, color) values
        (u.id, svago_id, 'Cinema/Teatro',      '🎬', '#06b6d4'),
        (u.id, svago_id, 'Concerti',           '🎵', '#06b6d4'),
        (u.id, svago_id, 'Viaggi',             '✈️', '#06b6d4'),
        (u.id, svago_id, 'Musei/Mostre',       '🎨', '#06b6d4'),
        (u.id, svago_id, 'Bar/Discoteca',      '🍻', '#06b6d4'),
        (u.id, svago_id, 'Altro',              '🎪', '#06b6d4');
    end if;

  end loop;
end $$;
