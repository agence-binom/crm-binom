<script setup lang="ts">
import type { TaskWorkspace } from '~/constants/tasks'
import { taskWorkspaces } from '~/constants/tasks'
import { getTaskWorkspaceSeverity, getTaskWorkspaceColor } from '~/lib/tasks'
import type { Task, User } from '~/types'

const route = useRoute()

const { data: session } = await useAppSession()
const currentUserId = computed(() => session.value?.user?.id ?? null)

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

const myInterneTasks = computed(() => interneTasks.value.filter(task => task.assigneeIds.includes(currentUserId.value as number)))
const myExterneTasks = computed(() => externeTasks.value.filter(task => task.assigneeIds.includes(currentUserId.value as number)))

const severityByWorkspace = computed<Record<TaskWorkspace, ReturnType<typeof getTaskWorkspaceSeverity>>>(() => ({
  interne: getTaskWorkspaceSeverity(myInterneTasks.value),
  externe: getTaskWorkspaceSeverity(myExterneTasks.value)
}))

const tabItems = [
  { label: 'Clients', value: 'externe' as const },
  { label: 'Agence', value: 'interne' as const }
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

    <template v-else>
      <TasksToDoList
        v-if="activeTab === 'interne'"
        :tasks="filteredInterneTasks"
        :available-users="availableUsers"
        :available-projects="projectOptions"
        workspace="interne"
        @refresh="refresh"
      >
        <template #title>
          <UTabs
            v-model="activeTab"
            variant="link"
            :items="tabItems"
            :content="false"
          >
            <template #trailing="{ item }">
              <UChip
                v-if="severityByWorkspace[item.value as TaskWorkspace] !== 'none'"
                :color="getTaskWorkspaceColor(severityByWorkspace[item.value as TaskWorkspace])"
                size="sm"
                class="ml-2"
              />
            </template>
          </UTabs>
        </template>

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

      <TasksToDoList
        v-else
        :tasks="filteredExterneTasks"
        :available-users="availableUsers"
        :available-projects="projectOptions"
        @refresh="refresh"
      >
        <template #title>
          <UTabs
            v-model="activeTab"
            variant="link"
            :items="tabItems"
            :content="false"
          >
            <template #trailing="{ item }">
              <UChip
                v-if="severityByWorkspace[item.value as TaskWorkspace] !== 'none'"
                :color="getTaskWorkspaceColor(severityByWorkspace[item.value as TaskWorkspace])"
                size="sm"
                class="ml-2"
              />
            </template>
          </UTabs>
        </template>

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
  </div>
</template>
