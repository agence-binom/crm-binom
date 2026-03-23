<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const user = useSupabaseUser()
const supabase = useSupabaseClient()

const collapsed = ref(false)

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) return

  await navigateTo('/login', { replace: true })
}

const items = ref<DropdownMenuItem[][]>([
  [
    {
      label: user.value?.email || 'Utilisateur',
      type: 'label'
    }
  ], [
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      disabled: true
    },
    {
      label: 'Déconnexion',
      icon: 'i-lucide-log-out',
      color: 'error',
      onSelect: handleLogout
    }
  ]
])
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      v-model:collapsed="collapsed"
      collapsible
      :ui="{ footer: 'border-t border-default' }"
      class="py-4"
    >
      <template #default="{ }">
        <UNavigationMenu
          :collapsed="collapsed"
          orientation="vertical"
          :items="[
            { label: 'Tableau de bord', icon: 'i-lucide-home', to: '/' },
            { label: 'Clients', icon: 'i-lucide-users', to: '/clients' },
            { label: 'Facturation', icon: 'i-lucide-receipt', to: '/facturation' }
          ]"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="[
            {
              label: 'Agence',
              icon: 'i-lucide-building',
              disabled: true,
              children: [
                { label: 'Administratif', icon: 'i-lucide-pen', to: '/clients', disabled: true }
              ]
            }
          ]"
          orientation="vertical"
          class="mt-auto"
        />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-bell"
            color="neutral"
            variant="ghost"
            disabled
          />
          <UButton
            icon="i-lucide-settings"
            color="neutral"
            variant="ghost"
            disabled
          />
          <UDropdownMenu
            :items="items"
          >
            <UButton
              icon="i-lucide-user"
              color="neutral"
              variant="ghost"
            />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <slot />
    </UDashboardPanel>
  </UDashboardGroup>
</template>
