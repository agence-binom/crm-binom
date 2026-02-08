<script setup lang="ts">
const user = useSupabaseUser()
const collapsed = ref(false)
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
            { label: 'Projects', icon: 'i-lucide-briefcase', to: '/projects' }
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
                { label: 'Administratif', icon: 'i-lucide-pen', to: '/clients', disabled: true },
                { label: 'Projets internes', icon: 'i-lucide-cloud', to: '/projects', disabled: true }
              ]
            }
          ]"
          orientation="vertical"
          class="mt-auto"
        />
      </template>

      <template
        #footer="{ }"
      >
        <div v-if="user">
          <UButton
            :label="collapsed ? undefined : user.email"
            icon="i-lucide-user"
            color="neutral"
            variant="ghost"
            class="w-full"
            :block="collapsed"
          />
        </div>
        <div v-else>
          <UButton
            :label="collapsed ? undefined : 'Mon compte'"
            icon="i-lucide-user"
            color="neutral"
            variant="ghost"
            class="w-full"
            :block="collapsed"
          />
        </div>
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
        </template>
      </UDashboardNavbar>

      <slot />
    </UDashboardPanel>
  </UDashboardGroup>
</template>
