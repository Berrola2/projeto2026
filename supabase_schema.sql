-- ==============================================================================
-- SCHEMA DO BANCO DE DADOS SUPABASE (100% SEGURO E IDEMPOTENTE)
-- Suporte a SUPER_ADMIN (@dev.com), ADMIN (@adm.com), PROFESSOR (@prof.com)
-- Pode ser executado múltiplas vezes sem dar erro de duplicação.
-- ==============================================================================

-- 1. TABELAS (CRIA SE NÃO EXISTIREM)
CREATE TABLE IF NOT EXISTS public.app_state (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.arenas (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_configs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    arena_id BIGINT UNIQUE REFERENCES public.arenas(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    tagline TEXT,
    primary_color TEXT DEFAULT '#0369a1',
    accent_color TEXT DEFAULT '#f59e0b',
    whatsapp_contact TEXT,
    instagram TEXT,
    description TEXT,
    modalities JSONB DEFAULT '["Vôlei de Praia 🏐", "Beach Tennis 🎾", "Futevôlei ⚽"]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT 'senha123',
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'PROFESSOR')),
    arena_id BIGINT REFERENCES public.arenas(id) ON DELETE CASCADE,
    phone TEXT,
    modality TEXT DEFAULT 'Vôlei de Praia 🏐',
    initial_password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    arena_id BIGINT NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    group_name TEXT DEFAULT 'Iniciante Manhã',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    arena_id BIGINT NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
    professor_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    group_name TEXT NOT NULL,
    observations TEXT,
    photo_url TEXT,
    photo_status TEXT DEFAULT 'PENDING' CHECK (photo_status IN ('PENDING', 'RECEIVED', 'READY_TO_SEND')),
    attendances JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- 3. REMOVER POLÍTICAS ANTIGAS SE EXISTIREM (EVITA ERRO 42710)
DROP POLICY IF EXISTS "Acesso público arenas" ON public.arenas;
DROP POLICY IF EXISTS "Acesso público tenant_configs" ON public.tenant_configs;
DROP POLICY IF EXISTS "Acesso público users" ON public.users;
DROP POLICY IF EXISTS "Acesso público students" ON public.students;
DROP POLICY IF EXISTS "Acesso público classes" ON public.classes;
DROP POLICY IF EXISTS "Acesso público app_state" ON public.app_state;

-- 4. RECRIAR POLÍTICAS DE ACESSO LIMPAS
CREATE POLICY "Acesso público arenas" ON public.arenas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público tenant_configs" ON public.tenant_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público app_state" ON public.app_state FOR ALL USING (true) WITH CHECK (true);

-- 5. HABILITAR REALTIME COM TRATAMENTO DE DUPLICAÇÃO
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.arenas;
  EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tenant_configs;
  EXCEPTION WHEN duplicate_object THEN END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  EXCEPTION WHEN duplicate_object THEN END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
  EXCEPTION WHEN duplicate_object THEN END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
  EXCEPTION WHEN duplicate_object THEN END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;
  EXCEPTION WHEN duplicate_object THEN END;
END $$;
