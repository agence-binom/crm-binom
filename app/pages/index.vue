<script setup lang="ts">
const { data, refresh } = await useFetch('/api/tasks')
const allTasks = computed(() => data.value?.tasks || [])

const { selectedUser, userOptions, filteredTasks } = useUserFilter(allTasks)
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
