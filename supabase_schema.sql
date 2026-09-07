-- =========================================================
-- TIKTOK PARODY (TIKTOP) - SUPABASE DATABASE SCHEMA
-- Выполните этот скрипт в Supabase Dashboard -> SQL Editor
-- =========================================================

-- Включение расширения для генерации UUID (если еще не включено)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Таблица Пользователей (Users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    is_admin BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Таблица Видео (Videos)
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    user_avatar TEXT DEFAULT '',
    video_url TEXT NOT NULL,
    caption TEXT DEFAULT '',
    music_title TEXT DEFAULT 'Оригинальный звук',
    tags TEXT DEFAULT '',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Таблица Лайков (Likes)
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, video_id)
);

-- 4. Таблица Комментариев (Comments)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    user_avatar TEXT DEFAULT '',
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Таблица Подписок (Follows) -> Взаимные = Друзья
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id)
);

-- 6. Таблица Сообщений / Отправки Видео Друзьям (Messages)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    content TEXT DEFAULT '',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Индексы для ускорения выборок
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_video ON public.likes(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_comments_video ON public.comments(video_id);
CREATE INDEX IF NOT EXISTS idx_follows_pair ON public.follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(sender_id, receiver_id);

-- Настройка RLS (Row Level Security) с открытым доступом по Anon Key
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public full access users" ON public.users;
    CREATE POLICY "Allow public full access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public full access videos" ON public.videos;
    CREATE POLICY "Allow public full access videos" ON public.videos FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public full access likes" ON public.likes;
    CREATE POLICY "Allow public full access likes" ON public.likes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public full access comments" ON public.comments;
    CREATE POLICY "Allow public full access comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public full access follows" ON public.follows;
    CREATE POLICY "Allow public full access follows" ON public.follows FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public full access messages" ON public.messages;
    CREATE POLICY "Allow public full access messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
END
$$;
