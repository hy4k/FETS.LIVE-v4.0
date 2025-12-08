import { supabase } from '../lib/supabase'

export async function setupFetsConnectTables() {
  try {
    console.log('🔧 Setting up FETS Connect database tables...')

    // Create chat_rooms table
    const createChatRooms = `
      CREATE TABLE IF NOT EXISTS chat_rooms (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL UNIQUE,
          description text,
          is_private boolean DEFAULT false,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
      );
    `

    // Create chat_messages table
    const createChatMessages = `
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
    `

    // Create posts table
    const createPosts = `
      CREATE TABLE IF NOT EXISTS posts (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
          content text NOT NULL,
          centre text DEFAULT 'calicut' CHECK (centre IN ('calicut', 'cochin', 'global')),
          visibility text DEFAULT 'centre' CHECK (visibility IN ('centre', 'global')),
          pinned boolean DEFAULT false,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
      );
    `

    // Create post_media table
    const createPostMedia = `
      CREATE TABLE IF NOT EXISTS post_media (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
          path text NOT NULL,
          type text CHECK (type IN ('image', 'video', 'file')),
          created_at timestamp with time zone DEFAULT now()
      );
    `

    // Insert default chat rooms
    const insertChatRooms = `
      INSERT INTO chat_rooms (name, description) VALUES 
          ('Global', 'Global company chat for all staff'),
          ('Calicut', 'Calicut centre chat'),
          ('Cochin', 'Cochin centre chat')
      ON CONFLICT (name) DO NOTHING;
    `

    // Execute the SQL commands
    const commands = [
      createChatRooms,
      createChatMessages,
      createPosts,
      createPostMedia,
      insertChatRooms
    ]

    for (const command of commands) {
      // @ts-ignore
      const { error } = await supabase.rpc('exec_sql', { sql: command })
      if (error) {
        console.error('❌ Database setup error:', error)
        throw error
      }
    }

    console.log('✅ FETS Connect database tables created successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to setup database tables:', error)
    return false
  }
}

export async function checkTablesExist() {
  try {
    // Try to query each table to see if it exists
    const tables = ['chat_rooms', 'chat_messages', 'posts', 'post_media']
    const results = []

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table as any).select('id').limit(1)
        results.push({ table, exists: !error })
      } catch {
        results.push({ table, exists: false })
      }
    }

    console.log('📊 Table existence check:', results)
    return results.every(r => r.exists)
  } catch (error) {
    console.error('❌ Error checking tables:', error)
    return false
  }
}