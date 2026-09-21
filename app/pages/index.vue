<script setup lang="ts">
import type { TaskWorkspace } from '~/constants/tasks'
import { taskWorkspaces } from '~/constants/tasks'
import { getTaskWorkspaceSeverity, getTaskWorkspaceSeverityDotClass } from '~/lib/tasks'
import type { Task, User } from '~/types'

const route = useRoute()

const { data, refresh, status } = await useFetch('/api/tasks/dashboard')
const allTasks = computed<Task[]>(() => (data.value?.tasks as Task[] | undefined) || [])
const availableUsers = computed<User[]>(() => data.value?.users || [])
const projectOptions = computed(() => data.value?.projectOptions || [])
const isLoading = computed(() => status.value === 'pending' && !data.value)

const interneTasks = computed(() => allTasks.value.filter(task => task.workspace === 'interne'))
const externeTasks = computed(() => allTasks.value.filter(task => task.workspace === 'externe'))

const {
  selectedUser: selectedInterneUser,
  userOptions: interneUserOptions,
  filteredTasks: filteredInterneTasks
} = useUserFilter(interneTasks, availableUsers)

const {
  selectedUser: selectedExterneUser,
  userOptions: externeUserOptions,
  filteredTasks: filteredExterneTasks
} = useUserFilter(externeTasks, availableUsers)

function isValidWorkspace(value: unknown): value is TaskWorkspace {
  return taskWorkspaces.includes(value as TaskWorkspace)
}

const activeTab = computed<TaskWorkspace>({
  get: () => (isValidWorkspace(route.query.tab) ? route.query.tab : 'externe'),
  set: (value) => {
    navigateTo({ query: { ...route.query, tab: value } }, { replace: true })
  }
})

const severityByWorkspace = computed<Record<TaskWorkspace, ReturnType<typeof getTaskWorkspaceSeverity>>>(() => ({
  interne: getTaskWorkspaceSeverity(interneTasks.value),
  externe: getTaskWorkspaceSeverity(externeTasks.value)
}))

const tabItems = [
  { label: 'Agence', value: 'interne' as const, slot: 'interne' as const },
  { label: 'Clients', value: 'externe' as const, slot: 'externe' as const }
]
</script>

<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">
      Tableau de bord
    </h1>

    <div
      v-if="isLoading"
      class="space-y-4"
    >
      <USkeleton class="h-10 w-64" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-96"
        />
      </div>
    </div>

    <UTabs
      v-else
      v-model="activeTab"
      :items="tabItems"
    >
      <template #trailing="{ item }">
        <span
          v-if="severityByWorkspace[item.value as TaskWorkspace] !== 'none'"
          class="h-2 w-2 rounded-full"
          :class="getTaskWorkspaceSeverityDotClass(severityByWorkspace[item.value as TaskWorkspace])"
        />
      </template>

      <template #interne>
        <TasksToDoList
          :tasks="filteredInterneTasks"
          :available-users="availableUsers"
          :available-projects="projectOptions"
          workspace="interne"
          title="Agence"
          title-heading="h2"
          @refresh="refresh"
        >
          <template #filters>
            <USelectMenu
              v-model="selectedInterneUser"
              :items="interneUserOptions"
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
        </TasksToDoList>
      </template>

      <template #externe>
        <TasksToDoList
          :tasks="filteredExterneTasks"
          :available-users="availableUsers"
          :available-projects="projectOptions"
          title="Clients"
          title-heading="h2"
          @refresh="refresh"
        >
          <template #filters>
            <USelectMenu
              v-model="selectedExterneUser"
              :items="externeUserOptions"
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
        </TasksToDoList>
      </template>
    </UTabs>
  </div>
</template>
