<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { authClient } from '~/lib/auth-client'

const { data: session } = await useAppSession()
const isAdmin = computed(() => session.value?.user?.role === 'admin')

const collapsed = ref(false)

const handleLogout = async () => {
  const { error } = await authClient.signOut()
  if (error) return

  await navigateTo('/login', { replace: true })
}

const items = ref<DropdownMenuItem[][]>([
  [
    {
      label: session.value?.user?.email || 'Utilisateur',
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

const agencyMenuItems = computed(() => [
  { label: 'Tâches', icon: 'i-lucide-list-checks', to: '/agence/taches' },
  ...(isAdmin.value ? [{ label: 'Journal d\'activité', icon: 'i-lucide-history', to: '/agence/journal' }] : []),
  { label: 'Administratif', icon: 'i-lucide-pen', to: '/clients', disabled: true }
])
</script>

<template>
  <UDashboardGroup>
    <GlobalSearch />

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
            { label: 'Contacts', icon: 'i-lucide-user-round', to: '/contacts' },
            { label: 'Facturation', icon: 'i-lucide-receipt', to: '/facturation' }
          ]"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="[
            {
              label: 'Agence',
              icon: 'i-lucide-building',
              children: agencyMenuItems
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
          <UDashboardSearchButton
            label="Rechercher..."
            class="w-54"
          />
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

      <div class="min-h-0 flex-1 overflow-y-auto">
        <slot />
      </div>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
