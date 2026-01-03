import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function DatabaseSetup() {
  const [isSetupRunning, setIsSetupRunning] = useState(false)
  const [setupStatus, setSetupStatus] = useState<string>('')

  const runDatabaseSetup = async () => {
    setIsSetupRunning(true)
    setSetupStatus('Starting database setup...')

    try {
      // Check if tables exist first
      setSetupStatus('Checking existing tables...')

      const tableChecks = [
        { name: 'chat_rooms', query: supabase.from('chat_rooms').select('id').limit(1) },
        { name: 'chat_messages', query: supabase.from('chat_messages').select('id').limit(1) },
        { name: 'social_posts', query: supabase.from('social_posts').select('id').limit(1) },
        { name: 'social_post_media', query: supabase.from('social_post_media').select('id').limit(1) }
      ]

      const missingTables = []
      for (const check of tableChecks) {
        const { error } = await check.query
        if (error && error.message.includes('does not exist')) {
          missingTables.push(check.name)
        }
      }

      if (missingTables.length === 0) {
        setSetupStatus('✅ All FETS Connect tables already exist!')
        return
      }

      setSetupStatus(`Missing tables: ${missingTables.join(', ')}. Please run the SQL migration manually.`)

      // Display the SQL that needs to be run
      const sqlCommands = `
-- Run these SQL commands in your Supabase SQL editor:

-- 1. Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    is_private boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
    author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    text text,
    media_path text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_content_check CHECK (text IS NOT NULL OR media_path IS NOT NULL)
);

-- 3. Create social_posts table
CREATE TABLE IF NOT EXISTS social_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    branch_location text DEFAULT 'calicut' CHECK (branch_location IN ('calicut', 'cochin', 'global')),
    visibility text DEFAULT 'branch' CHECK (visibility IN ('branch', 'global')),
    pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Create social_post_media table
CREATE TABLE IF NOT EXISTS social_post_media (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE,
    path text NOT NULL,
    type text CHECK (type IN ('image', 'video', 'file')),
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Insert default chat rooms
INSERT INTO chat_rooms (name, description) VALUES 
    ('Global', 'Global company chat for all staff'),
    ('Calicut', 'Calicut centre chat'),
    ('Cochin', 'Cochin centre chat')
ON CONFLICT (name) DO NOTHING;

-- 6. Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_media ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Users can view chat rooms" ON chat_rooms FOR SELECT USING (true);
CREATE POLICY "Users can view chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view posts" ON social_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert posts" ON social_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view post media" ON social_post_media FOR SELECT USING (true);
      `

      console.log('📋 SQL Commands to run:', sqlCommands)
      setSetupStatus(`❌ Missing tables detected. Please run the SQL commands shown in the console.`)

    } catch (error) {
      console.error('Database setup error:', error)
      setSetupStatus(`❌ Setup failed: ${error.message}`)
    } finally {
      setIsSetupRunning(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-md">
      <div className="text-sm">
        <div className="font-medium mb-2">FETS Connect Database Setup</div>
        <div className="mb-3 text-xs text-gray-600">
          {setupStatus || 'Click to check and setup database tables for FETS Connect'}
        </div>
        <button
          onClick={runDatabaseSetup}
          disabled={isSetupRunning}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50"
        >
          {isSetupRunning ? 'Checking...' : 'Setup Database'}
        </button>
      </div>
    </div>
  )
}