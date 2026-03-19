export function useApiHelpers() {
  const extractCollection = <T>(response: unknown): T[] => {
    if (Array.isArray(response)) {
      return response as T[]
    }

    if (!response || typeof response !== 'object') {
      return []
    }

    const dataKey = Object.keys(response).find((key) => {
      const value = Reflect.get(response, key)
      return Array.isArray(value)
    })

    if (!dataKey) {
      return []
    }

    const collection = Reflect.get(response, dataKey)
    return Array.isArray(collection) ? collection as T[] : []
  }

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
      const response = await $fetch(endpoint)
      return extractCollection<T>(response)
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
