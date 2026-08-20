<script setup lang="ts">
const route = useRoute()
const clientId = computed(() => Number(route.params.id))

const { data, refresh } = await useFetch(`/api/clients/${clientId.value}/dashboard`)
const client = computed(() => data.value?.client)
const contacts = computed(() => data.value?.contacts || [])
const projects = computed(() => data.value?.projects || [])

const isClientInfoModalOpen = ref(false)
const isContactModalOpen = ref(false)
const isProjectModalOpen = ref(false)
const selectedContactId = ref<number | null>(null)
const selectedProjectId = ref<number | null>(null)

const { deleteResource, confirmModalOpen, confirmModalMessage, onConfirm, onCancel } = useDeleteConfirmation()
const { setArchived } = useArchiveAction()

const onDeleteClient = async (clientId: number) => {
  await deleteResource('client', clientId, '/api/clients', async () => {
    await navigateTo('/clients')
  })
}

const onArchiveClient = async (clientId: number) => {
  await setArchived('client', clientId, '/api/clients', true, refresh)
}

const onRestoreClient = async (clientId: number) => {
  await setArchived('client', clientId, '/api/clients', false, refresh)
}

const handleClientChange = async () => {
  await refresh()
}

const openCreateContact = () => {
  selectedContactId.value = null
  isContactModalOpen.value = true
}

const openEditContact = (contactId: number) => {
  selectedContactId.value = contactId
  isContactModalOpen.value = true
}

const handleContactChange = async () => {
  await refresh()
}

const openCreateProject = () => {
  selectedProjectId.value = null
  isProjectModalOpen.value = true
}

const openEditProject = (projectId: number) => {
  selectedProjectId.value = projectId
  isProjectModalOpen.value = true
}

const handleProjectChange = async () => {
  await refresh()
}

const onDeleteContact = async (contactId: number) => {
  await deleteResource('contact', contactId, '/api/contacts', refresh)
}

const onDeleteProject = async (projectId: number) => {
  await deleteResource('projet', projectId, '/api/projects', refresh)
}

const onArchiveContact = async (contactId: number) => {
  await setArchived('contact', contactId, '/api/contacts', true, refresh)
}

const onRestoreContact = async (contactId: number) => {
  await setArchived('contact', contactId, '/api/contacts', false, refresh)
}

const onArchiveProject = async (projectId: number) => {
  await setArchived('projet', projectId, '/api/projects', true, refresh)
}

const onRestoreProject = async (projectId: number) => {
  await setArchived('projet', projectId, '/api/projects', false, refresh)
}

const contactToEdit = computed(() => {
  if (!selectedContactId.value) return null
  return contacts.value.find(c => c.id === selectedContactId.value) ?? null
})

const projectToEdit = computed(() => {
  if (!selectedProjectId.value) return null
  return projects.value.find(p => p.id === selectedProjectId.value) ?? null
})
</script>

<template>
  <div
    v-if="client"
    class="container mx-auto p-6 overflow-scroll"
  >
    <AppBackButton
      to="/clients"
      label="Retour aux clients"
    />
    <ClientsHeader
      :client="client"
      @open-info="isClientInfoModalOpen = true"
      @delete="onDeleteClient"
      @archive="onArchiveClient"
      @restore="onRestoreClient"
    />

    <ClientsModal
      v-model:open="isClientInfoModalOpen"
      :client-id="client.id"
      :client="client"
      @saved="handleClientChange"
    />

    <ContactsModal
      v-model:open="isContactModalOpen"
      :contact-id="selectedContactId"
      :contact="contactToEdit"
      :client-id="clientId"
      @saved="handleContactChange"
    />

    <ProjectsModal
      v-model:open="isProjectModalOpen"
      :project-id="selectedProjectId"
      :project="projectToEdit"
      :client-id="clientId"
      @saved="handleProjectChange"
    />
    <div class="flex flex-col gap-8">
      <ClientsProjects
        :projects="projects"
        :client-id="clientId"
        @create="openCreateProject"
        @edit="openEditProject"
        @delete="onDeleteProject"
        @archive="onArchiveProject"
        @restore="onRestoreProject"
      />

      <ClientsContacts
        :contacts="contacts"
        :client-id="clientId"
        @create="openCreateContact"
        @edit="openEditContact"
        @delete="onDeleteContact"
        @archive="onArchiveContact"
        @restore="onRestoreContact"
      />
    </div>

    <ConfirmModal
      :open="confirmModalOpen"
      title="Confirmer la suppression"
      :message="confirmModalMessage"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>
