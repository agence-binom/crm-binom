<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const supabase = useSupabaseClient()
const { data: sessionData } = usePortalSession()
const { data: projectsData } = usePortalProjects()

const collapsed = ref(false)
const isContactModalOpen = ref(false)

const contact = computed(() => sessionData.value?.contact)
const client = computed(() => sessionData.value?.client)

const contactFullName = computed(() => {
  if (!contact.value) return null
  return `${contact.value.firstName} ${contact.value.lastName}`.trim()
})

const navItems = computed<NavigationMenuItem[]>(() => (
  (projectsData.value?.projects ?? []).map(project => ({
    label: project.name,
    icon: 'i-lucide-folder',
    to: `/espace-client/projets/${project.id}`
  }))
))

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) return

  await navigateTo('/login', { replace: true })
}

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: contactFullName.value || 'Mon compte',
      type: 'label'
    }
  ], [
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
      class="py-4"
    >
      <template #header>
        <div class="flex items-center gap-2 px-1.5 font-semibold text-slate-900">
          <UIcon
            name="i-lucide-building-2"
            class="size-5 shrink-0 text-primary"
          />
          <span
            v-if="!collapsed"
            class="truncate"
          >
            {{ client?.name || 'Espace client' }}
          </span>
        </div>
      </template>

      <template #default>
        <UNavigationMenu
          :collapsed="collapsed"
          orientation="vertical"
          :items="navItems"
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
            icon="i-lucide-mail"
            color="info"
            variant="soft"
            @click="isContactModalOpen = true"
          >
            Contacter binōm
          </UButton>

          <UDropdownMenu :items="userMenuItems">
            <UButton
              icon="i-lucide-user"
              color="neutral"
              variant="ghost"
              aria-label="Menu utilisateur"
            />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <slot />
      </div>
    </UDashboardPanel>

    <UModal
      v-model:open="isContactModalOpen"
      :closable="false"
      size="md"
    >
      <template #header>
        <div class="flex w-full items-center justify-between">
          <h2 class="text-lg font-medium text-slate-900">
            Contacter binōm
          </h2>
          <UButton
            icon="i-lucide-x"
            color="error"
            size="xs"
            @click="isContactModalOpen = false"
          >
            Fermer
          </UButton>
        </div>
      </template>
      <template #body>
        <div class="flex flex-wrap gap-4">
          <UButton
            to="mailto:contact@agence-binom.fr"
            icon="i-lucide-mail"
            color="info"
            variant="soft"
          >
            contact@agence-binom.fr
          </UButton>
          <UButton
            to="https://agence-binom.fr"
            target="_blank"
            icon="i-lucide-globe"
            color="info"
            variant="soft"
          >
            agence-binom.fr
          </UButton>
        </div>
      </template>
    </UModal>
  </UDashboardGroup>
</template>
