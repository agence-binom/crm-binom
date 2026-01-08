<script setup lang="ts">
import type { User } from '~/validation/users'

const route = useRoute()
const projectId = computed(() => Number(route.params.id))

const { data, refresh } = await useFetch(`/api/projects/${projectId.value}`)
const project = computed(() => data.value)

const { data: tasksData, refresh: refreshTasks } = await useFetch(`/api/projects/${projectId.value}/tasks`)
const projectTasks = computed(() => tasksData.value?.tasks || [])

const selectedUserId = ref<number | null>(null)

const selectedUser = computed({
  get: () => userOptions.value.find(u => u.value === selectedUserId.value),
  set: (val) => { selectedUserId.value = val?.value ?? null }
})

const { data: usersData } = await useFetch('/api/users')

const taskCountByUser = computed(() => {
  if (!tasksData.value) return new Map()

  const counts = new Map<number | null, number>()

  tasksData.value.tasks.forEach((task) => {
    const userId = task.assignedTo ?? null
    counts.set(userId, (counts.get(userId) ?? 0) + 1)
  })

  return counts
})

const userOptions = computed(() => {
  const totalTasks = tasksData.value?.tasks?.length ?? 0
  const options: { label: string, value: number | null }[] = [{ label: `Tous les utilisateurs (${totalTasks})`, value: null }]
  options.push(...usersData.value?.users?.map((user: User) => {
    const count = taskCountByUser.value.get(user.id) ?? 0

    return {
      label: `${user.name} (${count})`,
      value: user.id
    }
  }) ?? [])
  const unassignedCount = taskCountByUser.value.get(null) ?? 0
  if (unassignedCount > 0) {
    options.push({ label: `Non assigné (${unassignedCount})`, value: 0 })
  }

  return options
})

const isProjectModalOpen = ref(false)

const onDeleteProject = async (projectId: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

  try {
    await $fetch(`/api/projects/${projectId}`, {
      method: 'DELETE'
    })
    await navigateTo('/projects')
  } catch (err) {
    console.error('Erreur lors de la suppression du projet:', err)
  }
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
        :tasks="projectTasks"
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
