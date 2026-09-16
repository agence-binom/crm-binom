# Graph Report - crm-binom  (2026-09-16)

## Corpus Check
- 374 files · ~147,433 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .graphify-bak 1, .example 1)

## Summary
- 1541 nodes · 2381 edges · 132 communities (102 shown, 30 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ca99c2ce`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- drizzle-orm
- relations.ts
- utils/client-portal.ts
- lib/tasks.ts
- [id]/index.vue
- tasks/Modal.vue
- task-attachments/Modal.vue
- validation/users.ts
- deliverables/Modal.vue
- contacts/index.vue
- validation/clients.ts
- lib/documents.ts
- CLAUDE.md — Engineering Rules
- facturation/index.vue
- package.json
- utils/documents.ts
- ToDoList.vue
- UploadModal.vue
- resources/Modal.vue
- validation/resources.ts
- clients/Modal.vue
- [projectId]/index.vue
- validation/billing-documents.ts
- validation/deliverables.ts
- validation/documents.ts
- scripts
- BillingStepEditor.vue
- contacts/Modal.vue
- ref_lib_utils
- ref_types
- post-checkout
- default.vue
- [id].vue
- validation/task-attachments.ts
- LinkExistingModal.vue
- clients/index.vue
- ResourcesList.vue
- dependencies
- devDependencies
- Board.vue
- journal.vue
- prospection/index.vue
- validation/tasks.ts
- PortalAccessModal.vue
- deliverables/List.vue
- resources/List.vue
- task-attachments/List.vue
- tasks/Kanban.vue
- portal.vue
- lib/billing.ts
- AttachmentFileInput.vue
- resources/Card.vue
- billing.test.ts
- resources-upload.ts
- @nuxt/ui
- prospects/Kanban.vue
- GlobalSearch.vue
- post-commit
- ref_db
- BillingStepSummary.vue
- ref_server_utils_documents
- tasks/Card.vue
- lib/task-attachments.ts
- AppAuth.vue
- BillingDocumentDetailsModal.vue
- Contacts.vue
- clients/Header.vue
- Table.vue
- projects/List.vue
- constants/billing.ts
- lib/deliverables.ts
- lib/resources.ts
- taches.vue
- pages/index.vue
- AppEmptyState.vue
- BillingDocumentActionButtons.vue
- BillingStepsTimeline.vue
- ref_server_utils_activity_log
- projects/Header.vue
- resources/DetailsModal.vue
- overrides
- tsconfig.json
- ConfirmModal.vue
- contacts/Card.vue
- auth-client.ts
- confirm.vue
- app.vue
- AppCard.vue
- AppLink.vue
- AttachmentTypeSelector.vue
- projects/Modal.vue
- useAppSession.ts
- usePortalProjects.ts
- usePortalSession.ts
- types/index.ts
- validate-bash.sh
- AppPageHeader.vue
- DuePillButton.vue
- eslint.config.mjs
- start-production.sh
- binom Logo (Wordmark)
- ref_h3
- utils/deliverables.ts
- deliverables/Card.vue
- utils/index.ts
- utils/auth.ts
- ref_server_utils_auth
- utils/activity-log.ts
- lib/projects.ts
- projects/Card.vue
- ref_node_assert_strict
- validation/activity-log.ts
- zod
- validation/contacts.ts
- validation/projects.ts
- invite.post.ts
- BillingProjectEditPanel.vue
- BillingRowTimeline.vue
- useBillingStepsEditor.ts
- validation/billing.ts
- utils/task-attachments.ts
- utils/users.ts

## God Nodes (most connected - your core abstractions)
1. `drizzle-orm` - 71 edges
2. `scripts` - 19 edges
3. `CLAUDE.md — Engineering Rules` - 18 edges
4. `README.md — Project Overview` - 16 edges
5. `usersTable` - 15 edges
6. `zod` - 15 edges
7. `@nuxt/ui` - 13 edges
8. `normalizeEmailAddress()` - 13 edges
9. `@playwright/test` - 11 edges
10. `sql` - 11 edges

## Surprising Connections (you probably didn't know these)
- `sendMagicLinkEmail()` --conceptually_related_to--> `Dev Magic-Link Logged To Terminal — rationale: portal seed contacts use fake domains, a real Resend send would fail; guard is NODE_ENV !== 'production' and must never widen to prod`  [EXTRACTED]
  server/lib/mail.ts → CLAUDE.md
- `CLAUDE.md — Engineering Rules` --references--> `isPublicAuthApiPath()`  [EXTRACTED]
  CLAUDE.md → server/utils/auth.ts
- `Staging Smoke Test Workflow` --references--> `isPublicAuthApiPath()`  [INFERRED]
  .github/workflows/staging-smoke-test.yml → server/utils/auth.ts
- `CLAUDE.md — Engineering Rules` --references--> `toPublicDatabaseError()`  [EXTRACTED]
  CLAUDE.md → server/utils/database-errors.ts
- `security-auditor Agent` --semantically_similar_to--> `AI Agent Autonomy Rules (git commit/push always require explicit human approval)`  [INFERRED] [semantically similar]
  .claude/agents/security-auditor.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Dev/Prod Postgres Image Parity Pattern** — compose_dev_composedev, claude_claudemd_supabasepostgresimage, scripts_dev_db_init_devdbinitsql, claude_claudemd [INFERRED 0.80]
- **Staff vs Client Security Boundary Pattern** — claude_agents_security_auditor_securityauditor, claude_claudemd_staffclientseparation, server_middleware_01_auth_authmiddleware, server_middleware_01_auth_requireactiveportalcontactwithclient [INFERRED 0.85]
- **Staging Deployment Pipeline (CI → smoke test → project board move)** — github_workflows_ci_ciworkflow, github_workflows_staging_smoke_test_smoketestworkflow, github_workflows_staging_merge_stagingmergeworkflow [INFERRED 0.85]

## Communities (132 total, 30 thin omitted)

### Community 0 - "drizzle-orm"
Cohesion: 0.14
Nodes (15): ref_db_index, ref_db_schema_clients, ref_db_schema_contacts, ref_db_schema_users, drizzle-orm, ref_server_lib_users, ref_server_utils_users, ref_validation_clients (+7 more)

### Community 1 - "relations.ts"
Cohesion: 0.06
Nodes (51): client, db, activityLogTable, authAccountTable, authSessionTable, authUserTable, authVerificationTable, billingDocumentsTable (+43 more)

### Community 2 - "utils/client-portal.ts"
Cohesion: 0.21
Nodes (7): findUserByEmail(), normalizeEmailAddress(), UserWithEmail, findActivePortalContactByEmail(), findConflictingPortalContact(), requireActivePortalContactWithClient(), touchPortalContactLastLogin()

### Community 3 - "lib/tasks.ts"
Cohesion: 0.12
Nodes (14): taskPriorities, TaskPriority, TaskStatus, taskStatuses, TaskWorkspace, taskWorkspaces, compareTasksByCompletedAtDesc(), compareTasksByDueDate() (+6 more)

### Community 4 - "[id]/index.vue"
Cohesion: 0.05
Nodes (26): backLabel, backTo, client, clientId, confirmContactLink(), contacts, contactToEdit, { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } (+18 more)

### Community 5 - "tasks/Modal.vue"
Cohesion: 0.07
Nodes (40): assigneeOptions, clearDueDate(), clearDueTime(), { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel }, draftTaskId, EditableTaskField, effectiveTaskId, emit (+32 more)

### Community 6 - "task-attachments/Modal.vue"
Cohesion: 0.09
Nodes (21): description, emit, isEditing, isMultipleFiles, isOpen, isSaving, isValid, maxFileSizeLabel (+13 more)

### Community 7 - "validation/users.ts"
Cohesion: 0.22
Nodes (8): UserCreate, userCreateSchema, UserId, userIdSchema, UserQuery, userQuerySchema, UserUpdate, userUpdateSchema

### Community 8 - "deliverables/Modal.vue"
Cohesion: 0.08
Nodes (23): content, description, emit, formState, isEditing, isMultipleFiles, isOpen, isSaving (+15 more)

### Community 9 - "contacts/index.vue"
Cohesion: 0.06
Nodes (19): allContacts, clientInitialValues, clientOptions, contacts, contactToEdit, { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel }, isClientModalOpen, isContactModalOpen (+11 more)

### Community 10 - "validation/clients.ts"
Cohesion: 0.09
Nodes (21): finalClientStatus, isClientStatus(), isProspectStatus(), prospectionBoardStatuses, ProspectionStatus, prospectionStatuses, ClientIconOption, clientIconOptions (+13 more)

### Community 11 - "lib/documents.ts"
Cohesion: 0.08
Nodes (20): applyStepSeparators(), billingDocumentTypeIcons, billingDocumentTypeLabels, BillingStepCategory, BillingStepKey, billingStepPalettes, billingStepToIssueLabel, billingStepToSentLabel (+12 more)

### Community 12 - "CLAUDE.md — Engineering Rules"
Cohesion: 0.14
Nodes (26): security-auditor Agent, CLAUDE.md — Engineering Rules, AI Agent Autonomy Rules (git commit/push always require explicit human approval), CI-Green-On-Main As Sole Production Gate — rationale: solo dev, required_approving_review_count is deliberately 0; Copilot review is consultative not blocking; no separate production branch or manual promotion step exists on purpose, Dev Magic-Link Logged To Terminal — rationale: portal seed contacts use fake domains, a real Resend send would fail; guard is NODE_ENV !== 'production' and must never widen to prod, GitHub Projects v2 Tracking (repo not connected to Linear), Better Auth Magic-Link Authentication, RLS Enabled Without Policies — rationale: owner-role connection is the only real enforcement, so app must filter by role in handlers; a non-owner role silently reads zero rows (+18 more)

### Community 13 - "facturation/index.vue"
Cohesion: 0.08
Nodes (22): billingProjects, billingStatusColors, billingStatusIcons, columns, emptyPagination, { getStatusColor, getStatusLabel }, hasActiveFilters, isAllCaughtUp (+14 more)

### Community 14 - "package.json"
Cohesion: 0.08
Nodes (23): engines, node, name, packageManager, private, type, dotenv, drizzle-kit (+15 more)

### Community 15 - "utils/documents.ts"
Cohesion: 0.14
Nodes (21): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, ref_imports, ref_server_lib_documents_upload, buildDocumentStoragePath(), deleteStoredDocumentFile(), deleteUploadedDocumentIfExists(), DOCUMENT_TYPE_FOLDERS (+13 more)

### Community 16 - "ToDoList.vue"
Cohesion: 0.09
Nodes (19): activeTaskStatuses, deletedTaskIds, displayedStatuses, emit, handleTaskChange(), handleTaskDeleted(), headingClass, isTaskModalOpen (+11 more)

### Community 17 - "UploadModal.vue"
Cohesion: 0.11
Nodes (22): BillingDocumentType, clearSelectedFile(), currentDocumentType, description, documentTypeOptions, emit, fileInput, invoiceSubtypeOptions (+14 more)

### Community 18 - "resources/Modal.vue"
Cohesion: 0.10
Nodes (22): createInitialFormState(), emit, formState, isEditing, isMultipleFiles, isOpen, isSaving, isValid (+14 more)

### Community 19 - "validation/resources.ts"
Cohesion: 0.11
Nodes (18): ResourceCreate, resourceCreateFormSchema, resourceCreateSchema, resourceDocumentFormSchema, resourceEditFormSchema, resourceFileInputAccept, ResourceId, resourceIdSchema (+10 more)

### Community 20 - "clients/Modal.vue"
Cohesion: 0.13
Nodes (18): applyFormState(), createDefaultFormState(), createFormStateFromClient(), createFormStateFromInitialValues(), emit, formState, isEditing, isOpen (+10 more)

### Community 21 - "[projectId]/index.vue"
Cohesion: 0.10
Nodes (14): availableUsers, clientId, { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel }, isProjectModalOpen, isUploadModalOpen, project, projectDeliverables, projectId (+6 more)

### Community 22 - "validation/billing-documents.ts"
Cohesion: 0.13
Nodes (17): billingDocumentTypesRequiringFactureNetLink, BillingDocumentCreate, billingDocumentCreateSchema, billingDocumentIdSchema, billingDocumentProjectParamsSchema, billingDocumentTypes, BillingDocumentUpdate, billingDocumentUpdateSchema (+9 more)

### Community 23 - "validation/deliverables.ts"
Cohesion: 0.13
Nodes (14): deliverableAcceptedMimeTypes, DeliverableCreate, deliverableCreateSchema, deliverableFileInputAccept, DeliverableId, deliverableIdSchema, deliverableListQuerySchema, deliverableMaxSizeBytes (+6 more)

### Community 24 - "validation/documents.ts"
Cohesion: 0.16
Nodes (16): documentAcceptedMimeTypes, documentEntityParamsSchema, documentEntityTypes, documentFileInputAccept, DocumentId, documentIdSchema, documentMaxSizeBytes, DocumentUpdate (+8 more)

### Community 25 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, db:down, db:generate, db:migrate, db:reset:local, db:seed, db:studio (+11 more)

### Community 26 - "BillingStepEditor.vue"
Cohesion: 0.12
Nodes (14): description, emit, externalUrlInput, { isDetailsOpen, menuItems }, isDirty, isUploadModalOpen, onUploaded(), props (+6 more)

### Community 27 - "contacts/Modal.vue"
Cohesion: 0.13
Nodes (14): clientOptions, ContactModalClientOption, emit, formState, isEditing, isOpen, isSaving, modalTitle (+6 more)

### Community 28 - "ref_lib_utils"
Cohesion: 0.20
Nodes (4): props, sortedDeliverables, emit, ref_lib_utils

### Community 29 - "ref_types"
Cohesion: 0.11
Nodes (8): emit, infos, props, emit, _props, infos, props, ref_types

### Community 31 - "default.vue"
Cohesion: 0.13
Nodes (11): activeClients, agencyMenuItems, collapsed, isAdmin, items, mainMenuItems, authError, loading (+3 more)

### Community 32 - "[id].vue"
Cohesion: 0.12
Nodes (15): billingDocuments, {
  data: billingDocumentsData,
  status: billingDocumentsStatus,
  error: billingDocumentsError,
  refresh: refreshBillingDocuments
}, {
  data: deliverablesData,
  status: deliverablesStatus,
  error: deliverablesError,
  refresh: refreshDeliverables
}, {
  data: resourcesData,
  status: resourcesStatus,
  error: resourcesError,
  refresh: refreshResources
}, { data, status, error, refresh }, deliverables, isBillingDocumentsLoading, isDeliverablesLoading (+7 more)

### Community 33 - "validation/task-attachments.ts"
Cohesion: 0.15
Nodes (13): taskAttachmentAcceptedMimeTypes, TaskAttachmentCreate, taskAttachmentCreateSchema, taskAttachmentFileInputAccept, TaskAttachmentId, taskAttachmentIdSchema, taskAttachmentListQuerySchema, taskAttachmentMaxSizeBytes (+5 more)

### Community 34 - "LinkExistingModal.vue"
Cohesion: 0.15
Nodes (13): confirm(), emit, isOpen, LinkableEntityType, LinkExistingSelection, loading, Option, options (+5 more)

### Community 35 - "clients/index.vue"
Cohesion: 0.13
Nodes (7): clients, { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel }, isClientModalOpen, selectedClient, selectedClientId, { setArchived }, showArchived

### Community 36 - "ResourcesList.vue"
Cohesion: 0.16
Nodes (10): { data: session }, { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel }, emit, isModalOpen, onDeleteResource(), onSaved(), props, resourceToEdit (+2 more)

### Community 37 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, better-auth, dotenv, drizzle-orm, @formkit/drag-and-drop, @iconify-json/lucide (+6 more)

### Community 38 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, drizzle-kit, @emnapi/core, @emnapi/runtime, @emnapi/wasi-threads, eslint, husky, @nuxt/eslint (+6 more)

### Community 39 - "Board.vue"
Cohesion: 0.17
Nodes (10): clientsByStatus, displayedStatuses, emit, handleProspectSaved(), isClientModalOpen, props, prospectionStatusOverrides, { showError } (+2 more)

### Community 40 - "journal.vue"
Cohesion: 0.15
Nodes (10): activityActionColors, activityActionLabels, activityEntityLabels, ActivityLogEntry, columns, entries, isAdmin, isLoading (+2 more)

### Community 41 - "prospection/index.vue"
Cohesion: 0.15
Nodes (8): clients, { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel }, isClientModalOpen, isLoading, selectedClient, selectedClientId, { setArchived }, showArchived

### Community 42 - "validation/tasks.ts"
Cohesion: 0.15
Nodes (12): nullableDateSchema, optionalDateSchema, TaskCreate, taskCreateSchema, taskDashboardQuerySchema, TaskId, taskIdSchema, taskStatusSchema (+4 more)

### Community 43 - "PortalAccessModal.vue"
Cohesion: 0.25
Nodes (9): activeContacts, emit, isOpen, onSendMail(), onToggle(), pendingContactId, props, runPortalAction() (+1 more)

### Community 44 - "deliverables/List.vue"
Cohesion: 0.22
Nodes (9): { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel }, deliverableToEdit, emit, isModalOpen, onDeleteDeliverable(), onSaved(), props, selectedDeliverableId (+1 more)

### Community 45 - "resources/List.vue"
Cohesion: 0.22
Nodes (9): { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel }, emit, isModalOpen, onDeleteResource(), onSaved(), props, resourceToEdit, selectedResourceId (+1 more)

### Community 46 - "task-attachments/List.vue"
Cohesion: 0.22
Nodes (9): attachmentToEdit, { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel }, emit, isModalOpen, onDeleteAttachment(), onSaved(), props, selectedAttachmentId (+1 more)

### Community 47 - "tasks/Kanban.vue"
Cohesion: 0.22
Nodes (10): badgeIcon, columnSettings, { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel }, emit, KanbanProjectOption, onDeleteTask(), [parent, taskList], projectsMap (+2 more)

### Community 48 - "portal.vue"
Cohesion: 0.20
Nodes (10): client, collapsed, contact, contactFullName, { data: projectsData }, { data: sessionData }, handleLogout(), isContactModalOpen (+2 more)

### Community 49 - "lib/billing.ts"
Cohesion: 0.18
Nodes (10): BillingProjectBase, BillingProjectDocument, BillingProjectDocumentWithLifecycle, BillingProjectStatus, BillingProjectStatusInput, BillingDocumentType, BillingStatus, BillingStep (+2 more)

### Community 50 - "AttachmentFileInput.vue"
Cohesion: 0.29
Nodes (9): addFiles(), emit, fileInput, isDragOver, onDrop(), onFileSelected(), props, removeFile() (+1 more)

### Community 51 - "resources/Card.vue"
Cohesion: 0.24
Nodes (9): emit, getExternalHref(), href, icon, imageFailed, { isDetailsOpen, menuItems: detailsMenuItem }, menuItems, props (+1 more)

### Community 52 - "billing.test.ts"
Cohesion: 0.27
Nodes (8): buildBillingProjectStatus(), annotateDocumentLifecycle(), BillingDocumentLike, computeProjectBillingSteps(), deriveStepStatus(), getBillingStatus(), getEffectiveInvoiceSubtype(), getLifecycleGroupKey()

### Community 53 - "resources-upload.ts"
Cohesion: 0.22
Nodes (8): resourceAcceptedMimeTypes, resourceMaxSizeBytes, ResourceUploadMetadata, getDeliverableValidationError(), getDocumentValidationError(), FileLike, getResourceValidationError(), getTaskAttachmentValidationError()

### Community 54 - "@nuxt/ui"
Cohesion: 0.22
Nodes (4): props, selectedDocument, sortedDocuments, @nuxt/ui

### Community 55 - "prospects/Kanban.vue"
Cohesion: 0.25
Nodes (8): badgeIcon, columnSettings, emit, label, [parent, clientList], props, ref_constants_prospection, ref_formkit_drag_and_drop_vue

### Community 56 - "GlobalSearch.vue"
Cohesion: 0.25
Nodes (6): groups, loading, results, SearchResults, searchTerm, { showError }

### Community 58 - "ref_db"
Cohesion: 0.14
Nodes (10): ref_db, ref_db_schema_projects, ref_db_schema_task_assignees, ref_db_schema_tasks, ref_lib_billing, ref_lib_projects, ref_server_utils_tasks, ref_validation_billing (+2 more)

### Community 59 - "BillingStepSummary.vue"
Cohesion: 0.29
Nodes (6): detailsTitle, factureNetHref, { isDetailsOpen, menuItems }, props, requiresFactureNetLink, warning

### Community 60 - "ref_server_utils_documents"
Cohesion: 0.26
Nodes (7): ref_db_schema_billing_documents, ref_db_schema_documents, ref_lib_documents, ref_server_utils_documents, ref_server_utils_prospection, ref_validation_billing_documents, ref_validation_documents

### Community 61 - "tasks/Card.vue"
Cohesion: 0.29
Nodes (6): emit, isOverdue, projectLabel, projectLink, props, ref_lib_tasks

### Community 63 - "AppAuth.vue"
Cohesion: 0.40
Nodes (5): emit, formState, onSubmit(), props, ref_validation_auth

### Community 64 - "BillingDocumentDetailsModal.vue"
Cohesion: 0.40
Nodes (5): emit, isOpen, props, showFileDescription, statusLabel

### Community 65 - "Contacts.vue"
Cohesion: 0.33
Nodes (4): emit, filteredContacts, props, showArchived

### Community 66 - "clients/Header.vue"
Cohesion: 0.33
Nodes (5): emit, infos, props, prospectionStatus, ref_lib_prospection

### Community 67 - "Table.vue"
Cohesion: 0.40
Nodes (4): columns, emit, getClientMenuItems(), props

### Community 68 - "projects/List.vue"
Cohesion: 0.33
Nodes (4): emit, filteredProjects, props, showArchived

### Community 69 - "constants/billing.ts"
Cohesion: 0.33
Nodes (4): activeBillingTones, BillingDashboardStatus, billingDashboardStatuses, FACTURE_NET_PORTAL_LINKS

### Community 72 - "taches.vue"
Cohesion: 0.33
Nodes (5): allTasks, availableUsers, isLoading, projectOptions, { selectedUser, userOptions, filteredTasks }

### Community 73 - "pages/index.vue"
Cohesion: 0.33
Nodes (5): allTasks, availableUsers, isLoading, projectOptions, { selectedUser, userOptions, filteredTasks }

### Community 74 - "AppEmptyState.vue"
Cohesion: 0.40
Nodes (4): iconSizeClass, props, titleClass, wrapperClass

### Community 75 - "BillingDocumentActionButtons.vue"
Cohesion: 0.40
Nodes (4): downloadHref, factureNetHref, props, requiresFactureNetLink

### Community 76 - "BillingStepsTimeline.vue"
Cohesion: 0.50
Nodes (4): emit, {
  isLoading,
  isSaving,
  requiresAcompte: stagedRequiresAcompte,
  timelineItems,
  isDirty,
  isEditingAnyStep,
  isStepEditing,
  startEditingStep,
  setEditorRef,
  handleStepSaved,
  onSave,
  onCancel
}, props, ref_composables_usebillingstepseditor

### Community 77 - "ref_server_utils_activity_log"
Cohesion: 0.32
Nodes (6): ref_db_schema_resources, ref_server_lib_resources_upload, ref_server_utils_activity_log, ref_server_utils_client_portal, ref_server_utils_resources, ref_validation_resources

### Community 78 - "projects/Header.vue"
Cohesion: 0.40
Nodes (4): emit, infos, ProjectHeaderClient, props

### Community 79 - "resources/DetailsModal.vue"
Cohesion: 0.50
Nodes (4): emit, isOpen, props, ref_lib_resources

### Community 80 - "overrides"
Cohesion: 0.40
Nodes (5): overrides, @emnapi/core, @emnapi/runtime, @emnapi/wasi-threads, @nuxt/icon

### Community 81 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, files, references

### Community 82 - "ConfirmModal.vue"
Cohesion: 0.67
Nodes (3): emit, isOpen, props

### Community 83 - "contacts/Card.vue"
Cohesion: 0.50
Nodes (3): emit, infos, props

### Community 84 - "auth-client.ts"
Cohesion: 0.50
Nodes (3): authClient, ref_better_auth_client_plugins, ref_better_auth_vue

### Community 85 - "confirm.vue"
Cohesion: 0.67
Nodes (3): redirectToLogin(), { showError }, validateAuthorizedSession()

### Community 90 - "projects/Modal.vue"
Cohesion: 0.14
Nodes (13): displayStatus, displayStatusLabel, emit, formState, isEditing, isOpen, isSaving, modalTitle (+5 more)

### Community 94 - "types/index.ts"
Cohesion: 0.14
Nodes (8): Contact, ContactClientSummary, BillingDocumentRecord, ProjectDocument, Project, Task, User, ref_constants_tasks

### Community 111 - "ref_h3"
Cohesion: 0.16
Nodes (8): ref_h3, ref_server_lib_better_auth, Bucket, DatabaseErrorLike, isDatabaseErrorLike(), toPublicDatabaseError(), UNREACHABLE_DATABASE_CODES, withResourcesDownloadUrls

### Community 112 - "utils/deliverables.ts"
Cohesion: 0.24
Nodes (6): ref_db_schema_deliverables, ref_server_lib_deliverables_upload, ref_server_utils_deliverables, ref_validation_deliverables, getProjectDeliverables(), withDeliverablesDownloadUrls

### Community 113 - "deliverables/Card.vue"
Cohesion: 0.20
Nodes (10): emit, href, icon, { isDetailsOpen, menuItems: detailsMenuItem }, menuItems, props, emit, isOpen (+2 more)

### Community 114 - "utils/index.ts"
Cohesion: 0.24
Nodes (4): AUTH_AND_STORAGE_ERROR_TRANSLATIONS, extractZodIssueMessage(), getErrorMessage(), translateStorageError()

### Community 115 - "utils/auth.ts"
Cohesion: 0.29
Nodes (9): Staging Smoke Test Workflow, findAuthorizedAppUserByAuthUserId(), findAuthorizedAppUserByEmail(), isPublicAuthApiPath(), requireAuthorizedAppUserByAuthUserId(), requireAuthorizedAppUserByEmail(), requireBetterAuthSession(), revokeSessionsForAuthUserId() (+1 more)

### Community 116 - "ref_server_utils_auth"
Cohesion: 0.42
Nodes (4): ref_db_schema_task_attachments, ref_server_utils_auth, ref_server_utils_task_attachments, ref_validation_task_attachments

### Community 117 - "utils/activity-log.ts"
Cohesion: 0.28
Nodes (6): ref_db_schema_activity_log, ref_server_lib_activity_log, ActorAppUser, ActorPortalContact, logActivity(), promoteClientIfQuoteSigned()

### Community 118 - "lib/projects.ts"
Cohesion: 0.39
Nodes (6): getProjectDisplayStatus(), ProjectDateInput, ProjectStatus, ProjectStatusInput, toProjectInputDate(), toValidDate()

### Community 119 - "projects/Card.vue"
Cohesion: 0.33
Nodes (6): badge, emit, formatDate(), { getStatusColor, getStatusLabel }, infos, props

### Community 120 - "ref_node_assert_strict"
Cohesion: 0.38
Nodes (4): resolveTaskLifecycleDates(), ref_node_assert_strict, ref_node_test, canManageUsers()

### Community 121 - "validation/activity-log.ts"
Cohesion: 0.29
Nodes (6): ActivityAction, activityActions, ActivityEntityType, activityEntityTypes, ActivityLogQuery, activityLogQuerySchema

### Community 122 - "zod"
Cohesion: 0.29
Nodes (5): AuthSignIn, authSignInSchema, GlobalSearchQuery, globalSearchQuerySchema, zod

### Community 123 - "validation/contacts.ts"
Cohesion: 0.29
Nodes (6): ContactCreate, contactCreateSchema, ContactId, contactIdSchema, ContactUpdate, contactUpdateSchema

### Community 124 - "validation/projects.ts"
Cohesion: 0.29
Nodes (6): ProjectCreate, projectCreateSchema, ProjectId, projectIdSchema, ProjectUpdate, projectUpdateSchema

### Community 125 - "invite.post.ts"
Cohesion: 0.38
Nodes (4): ref_db_schema_auth, auth, isKnownAuthorizedEmail(), canManagePortalAccess()

### Community 126 - "BillingProjectEditPanel.vue"
Cohesion: 0.40
Nodes (5): emit, { getStatusColor, getStatusLabel }, isOpen, props, timelineRef

### Community 127 - "BillingRowTimeline.vue"
Cohesion: 0.40
Nodes (5): activeIndex, isMuted, paletteFor(), props, timelineItems

### Community 128 - "useBillingStepsEditor.ts"
Cohesion: 0.33
Nodes (4): AnnotatedBillingDocument, dateLabelByKey, emphasizedTitleClasses, StepEditorHandle

### Community 129 - "validation/billing.ts"
Cohesion: 0.40
Nodes (3): BillingDashboardQuery, billingDashboardQuerySchema, ref_constants_billing

## Knowledge Gaps
- **712 isolated node(s):** `{ public: { appEnv } }`, `formState`, `props`, `Badge`, `Info` (+707 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 910 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `drizzle-orm` connect `drizzle-orm` to `relations.ts`, `utils/client-portal.ts`, `utils/users.ts`, `ref_server_utils_activity_log`, `package.json`, `utils/documents.ts`, `utils/deliverables.ts`, `utils/auth.ts`, `ref_server_utils_auth`, `utils/activity-log.ts`, `ref_db`, `ref_server_utils_documents`, `invite.post.ts`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Why does `zod` connect `zod` to `validation/billing.ts`, `validation/task-attachments.ts`, `validation/users.ts`, `validation/clients.ts`, `validation/tasks.ts`, `package.json`, `validation/resources.ts`, `validation/billing-documents.ts`, `validation/deliverables.ts`, `validation/documents.ts`, `validation/activity-log.ts`, `validation/contacts.ts`, `validation/projects.ts`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `@nuxt/ui` connect `@nuxt/ui` to `Table.vue`, `journal.vue`, `facturation/index.vue`, `package.json`, `portal.vue`, `deliverables/Card.vue`, `resources/Card.vue`, `GlobalSearch.vue`, `default.vue`, `AppAuth.vue`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **What connects `{ public: { appEnv } }`, `formState`, `props` to the rest of the system?**
  _712 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `drizzle-orm` be split into smaller, more focused modules?**
  _Cohesion score 0.13963963963963963 - nodes in this community are weakly interconnected._
- **Should `relations.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05679862306368331 - nodes in this community are weakly interconnected._
- **Should `lib/tasks.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11688311688311688 - nodes in this community are weakly interconnected._