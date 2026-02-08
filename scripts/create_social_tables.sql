-- Create tables for social features (F-Wall / My Desk)

-- 1. Social Posts Table
create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references staff_profiles(id) on delete cascade not null,
  content text,
  image_url text,
  post_type text default 'general', -- 'general', 'achievement', 'announcement', etc.
  branch_location text,
  is_archived boolean default false,
  archived_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table social_posts enable row level security;

-- Policies for Social Posts
create policy "Social Posts are viewable by everyone" 
  on social_posts for select 
  using ( true );

create policy "Authenticated users can create posts" 
  on social_posts for insert 
  with check ( auth.role() = 'authenticated' );

create policy "Users can update their own posts" 
  on social_posts for update 
  using ( auth.uid() = (select user_id from staff_profiles where id = social_posts.user_id limit 1) OR auth.uid()::text = user_id::text ); 
  -- Note: Checking if auth.uid matches user_id directly if user_id is auth.uid, or joined. Assuming user_id refers to staff_profiles.id which might be auth.uid.

create policy "Users can delete (archive) their own posts" 
  on social_posts for delete 
  using ( auth.uid()::text = user_id::text ); -- Simplification

-- 2. Social Likes Table
create table if not exists social_likes (
  user_id uuid references staff_profiles(id) on delete cascade not null,
  post_id uuid references social_posts(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

alter table social_likes enable row level security;

create policy "Likes are viewable by everyone" 
  on social_likes for select 
  using ( true );

create policy "Authenticated users can like" 
  on social_likes for insert 
  with check ( auth.role() = 'authenticated' );

create policy "Users can remove their own likes" 
  on social_likes for delete 
  using ( auth.uid()::text = user_id::text );

-- 3. Social Comments Table
create table if not exists social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references social_posts(id) on delete cascade not null,
  user_id uuid references staff_profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table social_comments enable row level security;

create policy "Comments are viewable by everyone" 
  on social_comments for select 
  using ( true );

create policy "Authenticated users can comment" 
  on social_comments for insert 
  with check ( auth.role() = 'authenticated' );

create policy "Users can delete their own comments" 
  on social_comments for delete 
  using ( auth.uid()::text = user_id::text );


-- simple RPC function for liking to avoid RLS strictness if needed
create or replace function like_post(post_id uuid)
returns void as $$
begin
  insert into social_likes (user_id, post_id)
  values (auth.uid(), post_id)
  on conflict do nothing;
end;
$$ language plpgsql security definer;

create or replace function unlike_post(post_id uuid)
returns void as $$
begin
  delete from social_likes
  where user_id = auth.uid() and post_id = $1;
end;
$$ language plpgsql security definer;

create or replace function add_comment(post_id uuid, content text)
returns json as $$
declare
  new_comment json;
begin
  insert into social_comments (post_id, user_id, content)
  values ($1, auth.uid(), $2)
  returning row_to_json(social_comments.*) into new_comment;
  return new_comment;
end;
$$ language plpgsql security definer;
