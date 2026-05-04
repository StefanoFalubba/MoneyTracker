-- One-time backfill: seed default categories for any existing user
-- who doesn't already have any. Safe to run multiple times.

do $$
declare
  u record;
begin
  for u in
    select id from auth.users
    where id not in (select distinct user_id from public.categories)
  loop
    -- Income
    insert into public.categories (user_id, name, type, color, icon) values
      (u.id, 'Stipendio',     'income', '#22c55e', '💼'),
      (u.id, 'Freelance',     'income', '#16a34a', '💻'),
      (u.id, 'Rimborso',      'income', '#4ade80', '💳'),
      (u.id, 'Altro entrata', 'income', '#86efac', '💰');

    -- Expense
    insert into public.categories (user_id, name, type, color, icon) values
      (u.id, 'Casa',          'expense', '#ef4444', '🏠'),
      (u.id, 'Cibo',          'expense', '#f97316', '🍕'),
      (u.id, 'Trasporti',     'expense', '#eab308', '🚗'),
      (u.id, 'Salute',        'expense', '#ec4899', '🏥'),
      (u.id, 'Sport',         'expense', '#f43f5e', '🏋️'),
      (u.id, 'Shopping',      'expense', '#a855f7', '🛍️'),
      (u.id, 'Svago',         'expense', '#06b6d4', '🎬'),
      (u.id, 'Abbonamenti',   'expense', '#3b82f6', '📱'),
      (u.id, 'Altro uscita',  'expense', '#dc2626', '💸');

    -- Investment
    insert into public.categories (user_id, name, type, color, icon) values
      (u.id, 'ETF/Fondi',           'investment', '#7F77DD', '📊'),
      (u.id, 'Azioni',              'investment', '#6366f1', '📈'),
      (u.id, 'Obbligazioni/BTP',    'investment', '#534AB7', '🏦'),
      (u.id, 'Criptovalute',        'investment', '#8b5cf6', '₿'),
      (u.id, 'Liquidità',           'investment', '#a78bfa', '💵'),
      (u.id, 'Altro investimento',  'investment', '#c4b5fd', '🪙');
  end loop;
end $$;
