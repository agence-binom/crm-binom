-- Custom SQL migration file, put your code below! --
UPDATE public.clients
SET status = 'archived'
WHERE status = 'inactive';