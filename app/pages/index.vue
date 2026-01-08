<script setup lang="ts">
import type { User } from '~/validation/users'

const { data, refresh } = await useFetch('/api/tasks')
const selectedUserId = ref<number | null>(null)

const selectedUser = computed({
  get: () => userOptions.value.find(u => u.value === selectedUserId.value),
  set: (val) => { selectedUserId.value = val?.value ?? null }
})

const { data: usersData } = await useFetch('/api/users')

const taskCountByUser = computed(() => {
  if (!data.value?.tasks) return new Map()

  const counts = new Map<number | null, number>()

  data.value.tasks.forEach((task) => {
    const userId = task.assignedTo ?? null
    counts.set(userId, (counts.get(userId) ?? 0) + 1)
  })

  return counts
})

const userOptions = computed(() => {
  const totalTasks = data.value?.tasks?.length ?? 0
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

const filteredTasks = computed(() => {
  if (!data.value?.tasks) return []

  if (selectedUserId.value === null) {
    return data.value.tasks
  }

  if (selectedUserId.value === 0) {
    return data.value.tasks.filter(t => !t.assignedTo)
  }

  return data.value.tasks.filter(t => t.assignedTo === selectedUserId.value)
})
</script>

<template>
  <div class="container mx-auto p-6">
    <ToDoList
      :tasks="filteredTasks"
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
