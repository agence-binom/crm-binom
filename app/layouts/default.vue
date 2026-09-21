<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { authClient } from '~/lib/auth-client'
import logoBinom from '~/assets/images/logo-binom.svg?url'
import type { Client } from '~/types'

const { data: session } = await useAppSession()
const isAdmin = computed(() => session.value?.user?.role === 'admin')

const collapsed = ref(false)
const isSettingsModalOpen = ref(false)

const { data: activeClientsData } = await useFetch('/api/clients/dashboard', {
  key: 'sidebar-active-clients',
  query: { archived: false, scope: 'clients' }
})
const activeClients = computed<Client[]>(() => (activeClientsData.value?.clients as Client[] | undefined) || [])

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

const mainMenuItems = computed(() => [
  { label: 'Tableau de bord', icon: 'i-lucide-home', to: '/' },
  { label: 'Prospection', icon: 'i-lucide-target', to: '/prospection' },
  {
    label: 'Clients',
    icon: 'i-lucide-users',
    to: '/clients',
    defaultOpen: true,
    children: activeClients.value.map(client => ({
      label: client.name,
      to: `/clients/${client.id}`
    }))
  },
  { label: 'Contacts', icon: 'i-lucide-user-round', to: '/contacts' },
  { label: 'Facturation', icon: 'i-lucide-receipt', to: '/facturation' }
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
      <template #header>
        <div class="flex items-center gap-2 px-1.5">
          <img
            :src="logoBinom"
            alt="binōm"
            class="h-6 w-auto dark:invert shrink-0"
          >
        </div>
      </template>

      <template #default="{ }">
        <UNavigationMenu
          :collapsed="collapsed"
          orientation="vertical"
          :items="mainMenuItems"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="[
            {
              label: 'Agence',
              icon: 'i-lucide-building',
              to: '/?tab=interne' }
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
            :disabled="!isAdmin"
            @click="isSettingsModalOpen = true"
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

    <SettingsModal v-model:open="isSettingsModalOpen" />
  </UDashboardGroup>
</template>
