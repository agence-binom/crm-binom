<script setup lang="ts">
const { data } = await useFetch('/api/tasks')

const tasksByStatus = computed(() => {
  if (!data.value?.tasks) return { todo: [], in_progress: [], done: [] }

  return {
    todo: data.value.tasks.filter(t => t.status === 'todo'),
    in_progress: data.value.tasks.filter(t => t.status === 'in_progress'),
    done: data.value.tasks.filter(t => t.status === 'done')
  }
})

console.log('Tasks by status:', tasksByStatus.value)
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold mb-2">
        To Do List globale
      </h1>
      <TaskForm />
    </div>

    <!-- Liste des tâches par statut
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-circle"
            class="text-yellow-500"
          />
          À faire ({{ tasksByStatus.todo.length }})
        </h3>
        <div class="space-y-3">
          <TaskCard
            v-for="task in tasksByStatus.todo"
            :key="task.id"
            :task="task"
            @delete="onDeleteTask"
          />
          <div
            v-if="tasksByStatus.todo.length === 0"
            class="text-center py-8 text-gray-400"
          >
            Aucune tâche à faire
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-loader"
            class="text-blue-500"
          />
          En cours ({{ tasksByStatus.in_progress.length }})
        </h3>
        <div class="space-y-3">
          <TaskCard
            v-for="task in tasksByStatus.in_progress"
            :key="task.id"
            :task="task"
            @delete="onDeleteTask"
          />
          <div
            v-if="tasksByStatus.in_progress.length === 0"
            class="text-center py-8 text-gray-400"
          >
            Aucune tâche en cours
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-check-circle"
            class="text-green-500"
          />
          Terminées ({{ tasksByStatus.done.length }})
        </h3>
        <div class="space-y-3">
          <TaskCard
            v-for="task in tasksByStatus.done"
            :key="task.id"
            :task="task"
            @delete="onDeleteTask"
          />
          <div
            v-if="tasksByStatus.done.length === 0"
            class="text-center py-8 text-gray-400"
          >
            Aucune tâche terminée
          </div>
        </div>
      </div>
    </div> -->
    <div class="w-full flex gap-8">
      <KanbanTable
        status="todo"
        :tasks="tasksByStatus.todo"
      />
      <KanbanTable
        status="in_progress"
        :tasks="tasksByStatus.in_progress"
      />
      <KanbanTable
        status="done"
        :tasks="tasksByStatus.done"
      />
    </div>
  </div>
</template>
