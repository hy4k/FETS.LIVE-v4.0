-- Enable Storage if not already enabled (though likely is)
-- Create buckets for social features

-- 1. Create 'post-images' bucket for F-Wall
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'post-images' );

create policy "Authenticated User Upload"
  on storage.objects for insert
  with check ( bucket_id = 'post-images' and auth.role() = 'authenticated' );

create policy "User Update Own"
  on storage.objects for update
  using ( bucket_id = 'post-images' and auth.uid() = owner )
  with check ( bucket_id = 'post-images' and auth.uid() = owner );

create policy "User Delete Own"
  on storage.objects for delete
  using ( bucket_id = 'post-images' and auth.uid() = owner );


-- 2. Create 'avatars' bucket for Profiles
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Public Access Avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Authenticated User Upload Avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "User Update Own Avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner )
  with check ( bucket_id = 'avatars' and auth.uid() = owner );


-- 3. Create 'attachments' bucket (general use)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "Public Access Attachments"
  on storage.objects for select
  using ( bucket_id = 'attachments' );

create policy "Authenticated Upload Attachments"
  on storage.objects for insert
  with check ( bucket_id = 'attachments' and auth.role() = 'authenticated' );
