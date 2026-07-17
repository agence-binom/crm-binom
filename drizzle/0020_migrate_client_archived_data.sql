-- Custom SQL migration file, put your code below! --
UPDATE "clients" SET "archived" = ("status" = 'archived');
