import type { Task, User } from '~/types'

export function useUserFilter(tasks: Ref<Task[]>, users?: Ref<User[]>) {
  const selectedUserId = ref<number | null>(null)
  const usersData = users ? undefined : useFetch('/api/users').data
  const availableUsers = computed<User[]>(() => users?.value ?? usersData?.value?.users ?? [])

  const taskCountByUser = computed(() => {
    if (!tasks.value) return new Map()

    const counts = new Map<number | null, number>()

    tasks.value
      .filter(task => task.status !== 'done')
      .forEach((task) => {
        const userId = task.assignedTo ?? null
        counts.set(userId, (counts.get(userId) ?? 0) + 1)
      })

    return counts
  })

  const userOptions = computed(() => {
    const totalTasks = tasks.value?.filter(task => task.status !== 'done').length ?? 0
    const options: { label: string, value: number | null }[] = [
      { label: `Tous les utilisateurs (${totalTasks})`, value: null }
    ]

    options.push(...availableUsers.value.map((user: User) => {
      const count = taskCountByUser.value.get(user.id) ?? 0
      return {
        label: `${user.name} (${count})`,
        value: user.id
      }
    }))

    const unassignedCount = taskCountByUser.value.get(null) ?? 0
    if (unassignedCount > 0) {
      options.push({ label: `Non assigné (${unassignedCount})`, value: 0 })
    }

    return options
  })

  const selectedUser = computed({
    get: () => userOptions.value.find(u => u.value === selectedUserId.value),
    set: (val) => { selectedUserId.value = val?.value ?? null }
  })

  const filteredTasks = computed(() => {
    if (!tasks.value) return []

    if (selectedUserId.value === null) {
      return tasks.value
    }

    if (selectedUserId.value === 0) {
      return tasks.value.filter(t => !t.assignedTo)
    }

    return tasks.value.filter(t => t.assignedTo === selectedUserId.value)
  })

  return {
    selectedUser,
    selectedUserId,
    userOptions,
    filteredTasks
  }
}
