-- Capture optional notes when a task is completed, so archive agents and
-- future review screens can see what actually happened.

alter table public.tasks
  add column if not exists completion_notes text;
