<script setup lang="ts">
import type { User } from '~/validation/users'

const { data, refresh, status } = await useFetch('/api/tasks/dashboard')
const allTasks = computed(() => data.value?.tasks || [])
const availableUsers = computed<User[]>(() => data.value?.users || [])
const projectOptions = computed(() => data.value?.projectOptions || [])

const { selectedUser, userOptions, filteredTasks } = useUserFilter(allTasks, availableUsers)
const isLoading = computed(() => status.value === 'pending')
</script>

<template>
  <div class="container mx-auto p-6">
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
    <ToDoList
      v-else
      :tasks="filteredTasks"
      :available-users="availableUsers"
      :available-projects="projectOptions"
      title="To Do List globale"
      @refresh="refresh"
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
</template>
