-- ============================================================================
-- Données de démo pour le développement LOCAL uniquement.
-- Rejoué automatiquement par `supabase db reset` (voir [db.seed] dans config.toml).
-- Ne jamais exécuter ce fichier sur un projet staging/prod.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Comptes de connexion (auth.users + public.users)
--    Connexion par lien magique -> intercepté par Mailpit http://127.0.0.1:54324
--    (mot de passe "password123" défini mais inutilisé par le flux OTP)
-- ----------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@crmbinom.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'employee@crmbinom.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'client@crmbinom.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, json_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
from auth.users
where email in ('admin@crmbinom.test', 'employee@crmbinom.test', 'client@crmbinom.test');

insert into public.users ("authUserId", name, email, role) values
  ('a0000000-0000-0000-0000-000000000001', 'Alice Admin', 'admin@crmbinom.test', 'admin'),
  ('a0000000-0000-0000-0000-000000000002', 'Eric Employé', 'employee@crmbinom.test', 'employee'),
  ('a0000000-0000-0000-0000-000000000003', 'Camille Client', 'client@crmbinom.test', 'client');

-- ----------------------------------------------------------------------------
-- 2. Clients
-- ----------------------------------------------------------------------------

insert into public.clients (name, email, phone, address, city, "postalCode", country, website, siret, notes, description, archived) values
  ('Atelier Dupont', 'contact@atelier-dupont.fr', '+33 1 42 33 44 55', '12 rue des Lilas', 'Paris', '75011', 'France', 'https://atelier-dupont.fr', '12345678900012', 'Client historique, très réactif.', 'Atelier de menuiserie artisanale.', false),
  ('Studio Lumière', 'hello@studio-lumiere.fr', '+33 4 78 12 34 56', '5 quai Saint-Vincent', 'Lyon', '69001', 'France', 'https://studio-lumiere.fr', '23456789000123', 'Studio photo, projets réguliers.', 'Studio de photographie professionnelle.', false),
  ('Café des Arts', 'contact@cafedesarts.fr', '+33 5 56 11 22 33', '8 place Gambetta', 'Bordeaux', '33000', 'France', null, null, 'Petit budget mais fidèle.', 'Café culturel associatif.', false),
  ('Menuiserie Bernard', 'info@menuiserie-bernard.fr', '+33 2 40 55 66 77', '20 route de Rennes', 'Nantes', '44000', 'France', 'https://menuiserie-bernard.fr', '34567890100045', 'Nouveau client, premier projet en cours.', 'Menuiserie sur-mesure.', false);

-- ----------------------------------------------------------------------------
-- 3. Contacts
-- ----------------------------------------------------------------------------

insert into public.contacts ("clientId", "firstName", "lastName", email, phone, position, mobile) values
  ((select id from public.clients where name = 'Atelier Dupont'), 'Jean', 'Dupont', 'jean.dupont@atelier-dupont.fr', '+33 1 42 33 44 55', 'Gérant', '+33 6 12 34 56 78'),
  ((select id from public.clients where name = 'Atelier Dupont'), 'Marie', 'Petit', 'marie.petit@atelier-dupont.fr', '+33 1 42 33 44 56', 'Comptabilité', null),
  ((select id from public.clients where name = 'Studio Lumière'), 'Claire', 'Fontaine', 'claire@studio-lumiere.fr', '+33 4 78 12 34 56', 'Directrice artistique', '+33 6 23 45 67 89'),
  ((select id from public.clients where name = 'Café des Arts'), 'Antoine', 'Roux', 'antoine@cafedesarts.fr', '+33 5 56 11 22 33', 'Propriétaire', null),
  ((select id from public.clients where name = 'Menuiserie Bernard'), 'Paul', 'Bernard', 'paul@menuiserie-bernard.fr', '+33 2 40 55 66 77', 'Gérant', '+33 6 34 56 78 90'),
  ((select id from public.clients where name = 'Menuiserie Bernard'), 'Sophie', 'Bernard', 'sophie@menuiserie-bernard.fr', '+33 2 40 55 66 78', 'Administratif', null);

-- ----------------------------------------------------------------------------
-- 4. Projets
-- ----------------------------------------------------------------------------

insert into public.projects ("clientId", name, description, status, "startDate", "endDate", url) values
  ((select id from public.clients where name = 'Atelier Dupont'), 'Refonte site vitrine', 'Nouveau site vitrine + formulaire de contact.', 'en_cours', '2026-05-01', null, null),
  ((select id from public.clients where name = 'Atelier Dupont'), 'Identité visuelle', 'Logo, charte graphique, cartes de visite.', 'termine', '2026-02-01', '2026-03-15', null),
  ((select id from public.clients where name = 'Studio Lumière'), 'Plateforme de réservation', 'Réservation de créneaux studio en ligne + paiement.', 'en_cours', '2026-06-01', null, null),
  ((select id from public.clients where name = 'Café des Arts'), 'Site vitrine + carte en ligne', 'Site one-page avec carte des boissons.', 'en_attente', null, null, null),
  ((select id from public.clients where name = 'Menuiserie Bernard'), 'Catalogue produits en ligne', 'Catalogue photo des réalisations avec demande de devis.', 'en_cours', '2026-06-15', null, 'https://menuiserie-bernard.fr/catalogue');

-- ----------------------------------------------------------------------------
-- 5. Tâches
-- ----------------------------------------------------------------------------

insert into public.tasks ("projectId", "assignedTo", title, notes, status, priority, "dueDate", "startedAt", "completedAt") values
  ((select id from public.projects where name = 'Refonte site vitrine'), (select id from public.users where email = 'employee@crmbinom.test'), 'Maquettes desktop', 'Validées par le client.', 'done', 'medium', '2026-05-15', '2026-05-05', '2026-05-14'),
  ((select id from public.projects where name = 'Refonte site vitrine'), (select id from public.users where email = 'employee@crmbinom.test'), 'Intégration Nuxt', 'Découpage des composants en cours.', 'in_progress', 'high', '2026-07-25', '2026-07-10', null),
  ((select id from public.projects where name = 'Refonte site vitrine'), null, 'Tests responsive', null, 'todo', 'low', '2026-08-01', null, null),
  ((select id from public.projects where name = 'Identité visuelle'), (select id from public.users where email = 'admin@crmbinom.test'), 'Livraison logo final', 'Fichiers vectoriels envoyés.', 'done', 'medium', '2026-03-10', '2026-03-01', '2026-03-10'),
  ((select id from public.projects where name = 'Plateforme de réservation'), (select id from public.users where email = 'admin@crmbinom.test'), 'Cahier des charges', null, 'done', 'high', '2026-06-10', '2026-06-01', '2026-06-08'),
  ((select id from public.projects where name = 'Plateforme de réservation'), (select id from public.users where email = 'employee@crmbinom.test'), 'Développement API réservation', 'Endpoints CRUD créneaux.', 'in_progress', 'high', '2026-07-30', '2026-07-05', null),
  ((select id from public.projects where name = 'Plateforme de réservation'), (select id from public.users where email = 'employee@crmbinom.test'), 'Tests paiement Stripe', null, 'waiting', 'medium', '2026-08-10', null, null),
  ((select id from public.projects where name = 'Catalogue produits en ligne'), (select id from public.users where email = 'employee@crmbinom.test'), 'Import des photos produits', 'En attente des visuels du client.', 'todo', 'medium', '2026-07-28', null, null);

-- ----------------------------------------------------------------------------
-- 6. Devis
-- ----------------------------------------------------------------------------

insert into public.quotes ("clientId", "projectId", number, status, "totalHT", "totalTTC", "vatRate", "issueDate", "validUntil") values
  ((select id from public.clients where name = 'Atelier Dupont'), (select id from public.projects where name = 'Refonte site vitrine'), 'DEV-2026-001', 'accepted', '3500.00', '4200.00', '20.00', '2026-05-01', '2026-06-01'),
  ((select id from public.clients where name = 'Studio Lumière'), (select id from public.projects where name = 'Plateforme de réservation'), 'DEV-2026-002', 'sent', '8000.00', '9600.00', '20.00', '2026-07-01', '2026-08-01'),
  ((select id from public.clients where name = 'Café des Arts'), (select id from public.projects where name = 'Site vitrine + carte en ligne'), 'DEV-2026-003', 'draft', '1800.00', '2160.00', '20.00', '2026-07-15', '2026-08-15'),
  ((select id from public.clients where name = 'Menuiserie Bernard'), (select id from public.projects where name = 'Catalogue produits en ligne'), 'DEV-2026-004', 'accepted', '4200.00', '5040.00', '20.00', '2026-06-15', '2026-07-15');

-- ----------------------------------------------------------------------------
-- 7. Factures
-- ----------------------------------------------------------------------------

insert into public.invoices ("clientId", "projectId", "quoteId", number, status, "totalHT", "totalTTC", "vatRate", "paidAmount", "issueDate", "dueDate", "paidDate") values
  ((select id from public.clients where name = 'Atelier Dupont'), (select id from public.projects where name = 'Refonte site vitrine'), (select id from public.quotes where number = 'DEV-2026-001'), 'FAC-2026-001', 'paid', '3500.00', '4200.00', '20.00', '4200.00', '2026-06-01', '2026-06-30', '2026-06-15'),
  ((select id from public.clients where name = 'Menuiserie Bernard'), (select id from public.projects where name = 'Catalogue produits en ligne'), (select id from public.quotes where number = 'DEV-2026-004'), 'FAC-2026-002', 'partial', '4200.00', '5040.00', '20.00', '2000.00', '2026-06-25', '2026-07-25', null),
  ((select id from public.clients where name = 'Studio Lumière'), null, null, 'FAC-2026-003', 'overdue', '1200.00', '1440.00', '20.00', '0.00', '2026-05-01', '2026-05-31', null);

-- ----------------------------------------------------------------------------
-- 8. Paiements
-- ----------------------------------------------------------------------------

insert into public.payments ("invoiceId", amount, "paymentDate", "paymentMethod", type, reference) values
  ((select id from public.invoices where number = 'FAC-2026-001'), '4200.00', '2026-06-15', 'bank_transfer', 'payment', 'VIR-98765'),
  ((select id from public.invoices where number = 'FAC-2026-002'), '2000.00', '2026-07-05', 'check', 'deposit', 'CHQ-1123');
