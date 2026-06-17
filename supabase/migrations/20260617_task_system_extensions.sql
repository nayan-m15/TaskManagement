-- Task system extension proposal
-- Apply after reviewing existing RLS policies and backfilling any workspace-scoped label data.

begin;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.tasks
  add column if not exists updated_at timestamptz;

update public.tasks
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_row_updated_at();

alter table public.task_comments
  add column if not exists updated_at timestamptz;

update public.task_comments
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

drop trigger if exists task_comments_set_updated_at on public.task_comments;
create trigger task_comments_set_updated_at
before update on public.task_comments
for each row
execute function public.set_row_updated_at();

alter table public.task_attachments
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size bigint,
  add column if not exists storage_path text;

alter table public.activity_logs
  add column if not exists details jsonb not null default '{}'::jsonb;

alter table public.task_labels
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

create index if not exists idx_tasks_column_id_position
  on public.tasks(column_id, position);

create index if not exists idx_task_comments_task_id_created_at
  on public.task_comments(task_id, created_at);

create index if not exists idx_task_attachments_task_id_created_at
  on public.task_attachments(task_id, created_at desc);

create index if not exists idx_activity_logs_task_id_created_at
  on public.activity_logs(task_id, created_at desc);

create index if not exists idx_task_label_assignments_task_id
  on public.task_label_assignments(task_id);

create unique index if not exists idx_task_labels_workspace_name
  on public.task_labels(workspace_id, lower(name))
  where workspace_id is not null;

commit;
