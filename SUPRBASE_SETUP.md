-- BEXITER Database Schema
-- Run these SQL commands in Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_2fa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Folders Table
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Notes Table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tags Table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 6. Note Tags Junction Table
CREATE TABLE public.note_tags (
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- 7. Note Links Table (for double links)
CREATE TABLE public.note_links (
  source_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  PRIMARY KEY (source_note_id, target_note_id)
);

-- 8. Create Indexes for Performance
CREATE INDEX idx_folders_user_id ON public.folders(user_id);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_folder_id ON public.notes(folder_id);
CREATE INDEX idx_notes_updated_at ON public.notes(updated_at DESC);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX idx_note_tags_tag_id ON public.note_tags(tag_id);
CREATE INDEX idx_note_links_source ON public.note_links(source_note_id);
CREATE INDEX idx_note_links_target ON public.note_links(target_note_id);

-- 9. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_links ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Folders RLS
CREATE POLICY "Users can manage own folders" ON public.folders
  FOR ALL USING (auth.uid() = user_id);

-- Notes RLS
CREATE POLICY "Users can manage own notes" ON public.notes
  FOR ALL USING (auth.uid() = user_id);

-- Tags RLS
CREATE POLICY "Users can manage own tags" ON public.tags
  FOR ALL USING (auth.uid() = user_id);

-- Note Tags RLS
CREATE POLICY "Users can manage own note_tags" ON public.note_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.notes WHERE id = note_tags.note_id AND user_id = auth.uid())
  );

-- Note Links RLS
CREATE POLICY "Users can manage own note_links" ON public.note_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.notes WHERE id = note_links.source_note_id AND user_id = auth.uid())
  );

-- 10. Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();