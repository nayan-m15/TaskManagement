begin;

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.workspaces
  add column if not exists name text,
  add column if not exists owner_id uuid,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.workspace_members
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists user_id uuid,
  add column if not exists role text not null default 'member',
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

alter table public.boards
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists title text,
  add column if not exists created_by uuid,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.board_columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  position integer not null default 0
);

alter table public.board_columns
  add column if not exists board_id uuid references public.boards(id) on delete cascade,
  add column if not exists title text,
  add column if not exists position integer not null default 0;

create unique index if not exists idx_workspace_members_workspace_user
  on public.workspace_members(workspace_id, user_id);

create unique index if not exists idx_board_columns_board_position
  on public.board_columns(board_id, position);

create index if not exists idx_workspaces_owner_id
  on public.workspaces(owner_id);

create index if not exists idx_workspace_members_user_id
  on public.workspace_members(user_id);

create index if not exists idx_boards_workspace_id
  on public.boards(workspace_id);

create index if not exists idx_board_columns_board_id
  on public.board_columns(board_id);

create or replace function public.user_has_workspace_access(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces workspace
    where workspace.id = target_workspace_id
      and workspace.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_members member
    where member.workspace_id = target_workspace_id
      and member.user_id = auth.uid()
  );
$$;

create or replace function public.user_can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces workspace
    where workspace.id = target_workspace_id
      and workspace.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_members member
    where member.workspace_id = target_workspace_id
      and member.user_id = auth.uid()
      and lower(member.role) in ('owner', 'admin')
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.boards enable row level security;
alter table public.board_columns enable row level security;

drop policy if exists "workspace_select_access" on public.workspaces;
create policy "workspace_select_access"
on public.workspaces
for select
using (
  owner_id = auth.uid()
  or public.user_has_workspace_access(id)
);

drop policy if exists "workspace_insert_owner" on public.workspaces;
create policy "workspace_insert_owner"
on public.workspaces
for insert
with check (owner_id = auth.uid());

drop policy if exists "workspace_update_owner" on public.workspaces;
create policy "workspace_update_owner"
on public.workspaces
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "workspace_delete_owner" on public.workspaces;
create policy "workspace_delete_owner"
on public.workspaces
for delete
using (owner_id = auth.uid());

drop policy if exists "workspace_member_select_access" on public.workspace_members;
create policy "workspace_member_select_access"
on public.workspace_members
for select
using (
  user_id = auth.uid()
  or public.user_has_workspace_access(workspace_id)
);

drop policy if exists "workspace_member_insert_manage" on public.workspace_members;
create policy "workspace_member_insert_manage"
on public.workspace_members
for insert
with check (
  public.user_can_manage_workspace(workspace_id)
  or user_id = auth.uid()
);

drop policy if exists "workspace_member_update_manage" on public.workspace_members;
create policy "workspace_member_update_manage"
on public.workspace_members
for update
using (public.user_can_manage_workspace(workspace_id))
with check (public.user_can_manage_workspace(workspace_id));

drop policy if exists "workspace_member_delete_manage" on public.workspace_members;
create policy "workspace_member_delete_manage"
on public.workspace_members
for delete
using (public.user_can_manage_workspace(workspace_id));

drop policy if exists "board_select_workspace_access" on public.boards;
create policy "board_select_workspace_access"
on public.boards
for select
using (public.user_has_workspace_access(workspace_id));

drop policy if exists "board_insert_workspace_access" on public.boards;
create policy "board_insert_workspace_access"
on public.boards
for insert
with check (
  created_by = auth.uid()
  and public.user_has_workspace_access(workspace_id)
);

drop policy if exists "board_update_workspace_manage" on public.boards;
create policy "board_update_workspace_manage"
on public.boards
for update
using (public.user_can_manage_workspace(workspace_id))
with check (public.user_can_manage_workspace(workspace_id));

drop policy if exists "board_delete_workspace_manage" on public.boards;
create policy "board_delete_workspace_manage"
on public.boards
for delete
using (public.user_can_manage_workspace(workspace_id));

drop policy if exists "board_column_select_workspace_access" on public.board_columns;
create policy "board_column_select_workspace_access"
on public.board_columns
for select
using (
  exists (
    select 1
    from public.boards board
    where board.id = board_columns.board_id
      and public.user_has_workspace_access(board.workspace_id)
  )
);

drop policy if exists "board_column_insert_workspace_manage" on public.board_columns;
create policy "board_column_insert_workspace_manage"
on public.board_columns
for insert
with check (
  exists (
    select 1
    from public.boards board
    where board.id = board_columns.board_id
      and public.user_can_manage_workspace(board.workspace_id)
  )
);

drop policy if exists "board_column_update_workspace_manage" on public.board_columns;
create policy "board_column_update_workspace_manage"
on public.board_columns
for update
using (
  exists (
    select 1
    from public.boards board
    where board.id = board_columns.board_id
      and public.user_can_manage_workspace(board.workspace_id)
  )
)
with check (
  exists (
    select 1
    from public.boards board
    where board.id = board_columns.board_id
      and public.user_can_manage_workspace(board.workspace_id)
  )
);

drop policy if exists "board_column_delete_workspace_manage" on public.board_columns;
create policy "board_column_delete_workspace_manage"
on public.board_columns
for delete
using (
  exists (
    select 1
    from public.boards board
    where board.id = board_columns.board_id
      and public.user_can_manage_workspace(board.workspace_id)
  )
);

create or replace function public.create_workspace_with_owner_membership(workspace_name text)
returns table (
  id uuid,
  name text,
  owner_id uuid,
  created_at timestamptz,
  member_role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_workspace public.workspaces%rowtype;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to create a workspace.';
  end if;

  if workspace_name is null or btrim(workspace_name) = '' then
    raise exception 'Workspace name is required.';
  end if;

  insert into public.workspaces (name, owner_id)
  values (btrim(workspace_name), current_user_id)
  returning * into created_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (created_workspace.id, current_user_id, 'owner')
  on conflict (workspace_id, user_id) do update
    set role = excluded.role;

  return query
  select
    created_workspace.id,
    created_workspace.name,
    created_workspace.owner_id,
    created_workspace.created_at,
    'owner'::text;
end;
$$;

create or replace function public.create_board_with_default_columns(target_workspace_id uuid, board_title text)
returns table (
  id uuid,
  workspace_id uuid,
  title text,
  created_by uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_board public.boards%rowtype;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to create a board.';
  end if;

  if target_workspace_id is null then
    raise exception 'Workspace id is required.';
  end if;

  if board_title is null or btrim(board_title) = '' then
    raise exception 'Board title is required.';
  end if;

  if not public.user_has_workspace_access(target_workspace_id) then
    raise exception 'You do not have access to this workspace.';
  end if;

  insert into public.boards (workspace_id, title, created_by)
  values (target_workspace_id, btrim(board_title), current_user_id)
  returning * into created_board;

  insert into public.board_columns (board_id, title, position)
  values
    (created_board.id, 'Todo', 0),
    (created_board.id, 'In Progress', 1),
    (created_board.id, 'Review', 2),
    (created_board.id, 'Done', 3)
  on conflict do nothing;

  return query
  select
    created_board.id,
    created_board.workspace_id,
    created_board.title,
    created_board.created_by,
    created_board.created_at;
end;
$$;

grant execute on function public.create_workspace_with_owner_membership(text) to authenticated;
grant execute on function public.create_board_with_default_columns(uuid, text) to authenticated;
grant execute on function public.user_has_workspace_access(uuid) to authenticated;
grant execute on function public.user_can_manage_workspace(uuid) to authenticated;

commit;
