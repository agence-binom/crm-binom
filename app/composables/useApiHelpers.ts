export function useApiHelpers() {
  const fetchOne = async <T>(
    table: string,
    id: number,
    errorMessage: string
  ): Promise<T | null> => {
    try {
      const response = await $fetch(`/api/${table}/${id}`)
      return response as T
    } catch (error) {
      console.error(errorMessage, error)
      throw createError({
        statusCode: 404,
        statusMessage: errorMessage
      })
    }
  }

  const fetchMany = async <T>(endpoint: string): Promise<T[]> => {
    try {
      const response = await $fetch(endpoint) as any
      // Gérer différents formats de réponse
      if (Array.isArray(response)) return response
      // Chercher la clé plurielle (clients, projects, tasks, etc.)
      const dataKey = Object.keys(response).find(key => Array.isArray(response[key]))
      return dataKey ? response[dataKey] : []
    } catch (error) {
      console.error(`Erreur lors de la récupération depuis ${endpoint}:`, error)
      return []
    }
  }

  return {
    fetchOne,
    fetchMany
  }
}
