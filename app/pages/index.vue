<script setup lang="ts">
const { data, refresh } = await useFetch('/api/tasks')

const tasksByStatus = computed(() => {
  if (!data.value?.tasks) return { todo: [], in_progress: [], done: [] }

  return {
    todo: data.value.tasks.filter(t => t.status === 'todo'),
    in_progress: data.value.tasks.filter(t => t.status === 'in_progress'),
    done: data.value.tasks.filter(t => t.status === 'done')
  }
})

console.log(tasksByStatus)

const stats = computed(() => ({
  total: data.value?.tasks.length || 0,
  todo: tasksByStatus.value.todo.length,
  inProgress: tasksByStatus.value.in_progress.length,
  done: tasksByStatus.value.done.length
}))

const onDeleteTask = async (taskId: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return

  try {
    await $fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
  }
}
</script>

<template>
  <div class="container mx-auto p-6">
    <!-- En-tête -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold mb-2">
        To Do List globale
      </h1>
      <TaskForm />
    </div>

    <!-- Statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-600">
            {{ stats.total }}
          </div>

          <div class="text-sm text-gray-500">
            Total
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-yellow-600">
            {{ stats.todo }}
          </div>
          <div class="text-sm text-gray-500">
            À faire
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">
            {{ stats.inProgress }}
          </div>
          <div class="text-sm text-gray-500">
            En cours
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">
            {{ stats.done }}
          </div>
          <div class="text-sm text-gray-500">
            Terminées
          </div>
        </div>
      </UCard>
    </div>

    <!-- Liste des tâches par statut -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- À faire -->
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

      <!-- En cours -->
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

      <!-- Terminées -->
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
    </div>
  </div>
</template>
