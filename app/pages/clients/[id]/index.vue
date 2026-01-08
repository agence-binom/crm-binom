<script setup lang="ts">
const route = useRoute()
const clientId = computed(() => Number(route.params.id))

// Données du client
const { data: clientData, refresh: refreshClient } = await useFetch(`/api/clients/${clientId.value}`)
const client = computed(() => clientData.value?.client)

// Données des contacts
const { data: contactsData, refresh: refreshContacts } = await useFetch(`/api/clients/${clientId.value}/contacts`)
const contacts = computed(() => contactsData.value?.contacts || [])

// Données des projets
const { data: projectsData, refresh: refreshProjects } = await useFetch(`/api/clients/${clientId.value}/projects`)
const projects = computed(() => projectsData.value?.projects || [])

const isClientInfoModalOpen = ref(false)
const isContactModalOpen = ref(false)
const isProjectModalOpen = ref(false)
const selectedContactId = ref<number | null>(null)
const selectedProjectId = ref<number | null>(null)

const { deleteResource } = useDeleteConfirmation()

const onDeleteClient = async (clientId: number) => {
  await deleteResource('client', clientId, '/api/clients', async () => {
    await navigateTo('/clients')
  })
}

const handleClientChange = async () => {
  await refreshClient()
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
  await refreshContacts()
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
  await refreshProjects()
}

const onDeleteContact = async (contactId: number) => {
  await deleteResource('contact', contactId, '/api/contacts', refreshContacts)
}

const onDeleteProject = async (projectId: number) => {
  await deleteResource('projet', projectId, '/api/projects', refreshProjects)
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
    <ClientHeader
      :client="client"
      @open-info="isClientInfoModalOpen = true"
      @delete="onDeleteClient"
    />

    <ClientModal
      v-model:open="isClientInfoModalOpen"
      :client-id="client.id"
      :client="client"
      @saved="handleClientChange"
    />

    <ContactModal
      v-model:open="isContactModalOpen"
      :contact-id="selectedContactId"
      :contact="contactToEdit"
      :client-id="clientId"
      @saved="handleContactChange"
    />

    <ProjectModal
      v-model:open="isProjectModalOpen"
      :project-id="selectedProjectId"
      :project="projectToEdit"
      :client-id="clientId"
      @saved="handleProjectChange"
    />
    <div class="flex flex-col gap-8">
      <ClientProjects
        :projects="projects"
        :client-id="clientId"
        @create="openCreateProject"
        @edit="openEditProject"
        @delete="onDeleteProject"
      />

      <ClientContacts
        :contacts="contacts"
        :client-id="clientId"
        @create="openCreateContact"
        @edit="openEditContact"
        @delete="onDeleteContact"
      />
    </div>
  </div>
</template>
