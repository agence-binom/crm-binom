import type { DropdownMenuItem } from '@nuxt/ui'

export const useDetailsMenuItem = () => {
  const isDetailsOpen = ref(false)
  const menuItems: DropdownMenuItem[][] = [[
    {
      label: 'Voir les informations',
      icon: 'i-lucide-info',
      onSelect: () => { isDetailsOpen.value = true }
    }
  ]]

  return { isDetailsOpen, menuItems }
}
