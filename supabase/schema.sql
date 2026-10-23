-- ==============================================================================
-- TABUNGIN SUPABASE DATABASE SCHEMA
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tabel Pengaturan & Profil Pengguna
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'light',
  hide_amounts boolean default false,
  profile_name text default 'Sahabat Tabungin',
  avatar_url text,
  updated_at timestamptz default now()
);

-- 2. Tabel Dompet (Wallets)
create table if not exists public.wallets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text default 'cash',
  initial_balance numeric default 0,
  color text default '#5F8563',
  created_at timestamptz default now()
);

-- 3. Tabel Target Tabungan (Savings Targets)
create table if not exists public.targets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  deadline date,
  description text default '',
  icon text default 'piggy-bank',
  priority text default 'medium',
  is_emergency_fund boolean default false,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- 4. Tabel Setoran Tabungan (Deposits)
create table if not exists public.deposits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id text references public.targets(id) on delete set null,
  wallet_id text not null,
  amount numeric not null,
  date date not null default current_date,
  note text default '',
  photo_url text,
  photo_meta jsonb,
  created_at timestamptz default now()
);

-- 5. Tabel Transaksi Arus Kas (Transactions)
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  category text not null,
  date date not null default current_date,
  note text default '',
  wallet_id text not null,
  bill_id text,
  created_at timestamptz default now()
);

-- 6. Tabel Batas Anggaran Bulanan (Budgets)
create table if not exists public.budgets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null,
  created_at timestamptz default now()
);

-- 7. Tabel Tagihan Rutin (Bills)
create table if not exists public.bills (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  category text default 'Tagihan',
  wallet_id text not null,
  due_day integer default 1,
  frequency text default 'monthly',
  due_date date,
  active boolean default true,
  notes text default '',
  last_paid_at date,
  created_at timestamptz default now()
);

-- 8. Tabel Tantangan Menabung (Challenges)
create table if not exists public.challenges (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text default '7-day',
  title text not null,
  target_amount numeric not null,
  start_date date not null default current_date,
  active boolean default true,
  created_at timestamptz default now()
);

-- 9. Tabel Transfer Antar-Dompet (Transfers)
create table if not exists public.transfers (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_wallet_id text not null,
  to_wallet_id text not null,
  amount numeric not null,
  date date not null default current_date,
  note text default '',
  created_at timestamptz default now()
);

-- ==============================================================================
-- KEAMANAN: ROW LEVEL SECURITY (RLS)
-- Setiap pengguna HANYA bisa membaca & menulis datanya sendiri (auth.uid() = user_id)
-- ==============================================================================

alter table public.user_settings enable row level security;
alter table public.wallets enable row level security;
alter table public.targets enable row level security;
alter table public.deposits enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.bills enable row level security;
alter table public.challenges enable row level security;
alter table public.transfers enable row level security;

-- Policies for user_settings
create policy "User can view own settings" on public.user_settings for select using (auth.uid() = user_id);
create policy "User can update own settings" on public.user_settings for all using (auth.uid() = user_id);

-- Policies for wallets
create policy "User can manage own wallets" on public.wallets for all using (auth.uid() = user_id);

-- Policies for targets
create policy "User can manage own targets" on public.targets for all using (auth.uid() = user_id);

-- Policies for deposits
create policy "User can manage own deposits" on public.deposits for all using (auth.uid() = user_id);

-- Policies for transactions
create policy "User can manage own transactions" on public.transactions for all using (auth.uid() = user_id);

-- Policies for budgets
create policy "User can manage own budgets" on public.budgets for all using (auth.uid() = user_id);

-- Policies for bills
create policy "User can manage own bills" on public.bills for all using (auth.uid() = user_id);

-- Policies for challenges
create policy "User can manage own challenges" on public.challenges for all using (auth.uid() = user_id);

-- Policies for transfers
create policy "User can manage own transfers" on public.transfers for all using (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE BUCKET: receipts (Untuk bukti foto setoran)
-- ==============================================================================

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

create policy "Public Access Receipts" on storage.objects for select using (bucket_id = 'receipts');
create policy "Authenticated Upload Receipts" on storage.objects for insert with check (
  bucket_id = 'receipts' and auth.role() = 'authenticated'
);
create policy "Owner Delete Receipts" on storage.objects for delete using (
  bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================================================
-- TRIGGER OTOMATIS: Buat profil saat user baru registrasi
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id, profile_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'profile_name', 'Sahabat Tabungin'))
  on conflict (user_id) do nothing;
  
  -- Tambah 1 dompet default
  insert into public.wallets (id, user_id, name, kind, initial_balance, color)
  values ('wallet_' || substr(md5(random()::text), 1, 8), new.id, 'Dompet Utama', 'cash', 0, '#5F8563')
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
