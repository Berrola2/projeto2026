-- ==============================================================================
-- SCHEMA DO BANCO DE DADOS SUPABASE (SAAS GESTÃO DE VÔLEI DE PRAIA)
-- Execute este script no SQL Editor do seu projeto Supabase (https://app.supabase.com)
-- ==============================================================================

-- 1. TABELA DE ARENAS
CREATE TABLE IF NOT EXISTS public.arenas (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE USUÁRIOS (GESTORES E PROFESSORES)
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT 'senha123',
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'PROFESSOR')),
    arena_id BIGINT REFERENCES public.arenas(id) ON DELETE CASCADE,
    phone TEXT,
    modality TEXT DEFAULT 'Vôlei de Praia 🏐',
    initial_password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE ALUNOS
CREATE TABLE IF NOT EXISTS public.students (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    arena_id BIGINT REFERENCES public.arenas(id) ON DELETE CASCADE,
    group_name TEXT DEFAULT 'Iniciante Manhã',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE AULAS & REGISTRO DE TREINOS
CREATE TABLE IF NOT EXISTS public.classes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    arena_id BIGINT REFERENCES public.arenas(id) ON DELETE CASCADE,
    professor_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    group_name TEXT NOT NULL,
    observations TEXT,
    photo_url TEXT,
    photo_status TEXT DEFAULT 'PENDING' CHECK (photo_status IN ('PENDING', 'RECEIVED', 'READY_TO_SEND')),
    attendances JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE SINCRONIZAÇÃO GERAL (FALLBACK / SINGLE STATE)
CREATE TABLE IF NOT EXISTS public.app_state (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HABILITAR POLÍTICAS DE ACESSO (RLS PERMISSIVO PARA CHAVE ANON)
ALTER TABLE public.arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público arenas" ON public.arenas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público app_state" ON public.app_state FOR ALL USING (true) WITH CHECK (true);

-- 7. HABILITAR REALTIME NO SUPABASE
ALTER PUBLICATION supabase_realtime ADD TABLE public.arenas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;
