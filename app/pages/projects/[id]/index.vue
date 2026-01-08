<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => Number(route.params.id))

const { data, refresh } = await useFetch(`/api/projects/${projectId.value}`)
const project = computed(() => data.value)

const { data: tasksData, refresh: refreshTasks } = await useFetch(`/api/projects/${projectId.value}/tasks`)
const projectTasks = computed(() => tasksData.value?.tasks || [])

const { selectedUser, userOptions, filteredTasks } = useUserFilter(projectTasks)

const isProjectModalOpen = ref(false)

const { deleteResource } = useDeleteConfirmation()

const onDeleteProject = async (projectId: number) => {
  await deleteResource('projet', projectId, '/api/projects', async () => {
    await navigateTo('/projects')
  })
}

const handleProjectChange = async () => {
  await refresh()
}
</script>

<template>
  <div
    v-if="project"
    class="container mx-auto p-6 overflow-scroll"
  >
    <ProjectHeader
      :project="project"
      @open-info="isProjectModalOpen = true"
      @delete="onDeleteProject"
    />
    <ProjectModal
      v-model:open="isProjectModalOpen"
      :project-id="project.id"
      :project="project"
      :client-id="project.clientId"
      @saved="handleProjectChange"
    />

    <!-- TodoList Kanban -->
    <div class="mt-8">
      <ToDoList
        :tasks="filteredTasks"
        title="Tâches du projet"
        :project-id="projectId"
        @refresh="refreshTasks"
      >
        <template #filters>
          <USelectMenu
            v-model="selectedUser"
            :items="userOptions"
            placeholder="Filtrer par utilisateur"
            value-attribute="value"
            option-attribute="label"
            class="w-64"
          >
            <template #leading>
              <UIcon name="i-lucide-filter" />
            </template>
          </USelectMenu>
        </template>
      </ToDoList>
    </div>
  </div>
</template>
