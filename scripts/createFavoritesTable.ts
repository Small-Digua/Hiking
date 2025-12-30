
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('Missing DATABASE_URL environment variable')
  process.exit(1)
}

const client = new Client({
  connectionString,
})

async function createFavoritesTable() {
  try {
    await client.connect()
    console.log('Connected to database')

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(user_id, route_id)
      );
    `

    await client.query(createTableQuery)
    console.log('Favorites table created (if not exists)')

    // Create RLS policies
    const enableRLS = `ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;`
    await client.query(enableRLS)
    
    // Policy: Users can see their own favorites
    const policySelect = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_catalog.pg_policies 
          WHERE tablename = 'favorites' AND policyname = 'Users can view their own favorites'
        ) THEN
          CREATE POLICY "Users can view their own favorites" ON favorites
            FOR SELECT USING (auth.uid() = user_id);
        END IF;
      END $$;
    `
    await client.query(policySelect)

    // Policy: Users can insert their own favorites
    const policyInsert = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_catalog.pg_policies 
          WHERE tablename = 'favorites' AND policyname = 'Users can add their own favorites'
        ) THEN
          CREATE POLICY "Users can add their own favorites" ON favorites
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
      END $$;
    `
    await client.query(policyInsert)

    // Policy: Users can delete their own favorites
    const policyDelete = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_catalog.pg_policies 
          WHERE tablename = 'favorites' AND policyname = 'Users can delete their own favorites'
        ) THEN
          CREATE POLICY "Users can delete their own favorites" ON favorites
            FOR DELETE USING (auth.uid() = user_id);
        END IF;
      END $$;
    `
    await client.query(policyDelete)

    console.log('RLS policies set up')

  } catch (err) {
    console.error('Error creating table:', err)
  } finally {
    await client.end()
  }
}

createFavoritesTable()
