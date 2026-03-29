<script setup lang="ts">
import { getClientIcon } from '~/lib/clients'

const { data, refresh } = await useFetch('/api/clients/dashboard')
const clients = computed(() => data.value?.clients || [])

const isClientModalOpen = ref(false)

const openCreateClient = () => {
  isClientModalOpen.value = true
}

const handleClientChange = async () => {
  await refresh()
}
</script>

<template>
  <div class="container mx-auto space-y-6 p-6">
    <div class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">
          Clients
        </h1>
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full"
        >
          {{ clients.length }}
        </UBadge>
      </div>
      <UButton
        icon="i-lucide-circle-plus"
        variant="outline"
        color="neutral"
        @click="openCreateClient"
      >
        Nouveau client
      </UButton>
    </div>

    <ClientModal
      v-model:open="isClientModalOpen"
      @saved="handleClientChange"
    />

    <div
      v-if="!data"
      class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 py-12 text-center text-slate-500"
    >
      Chargement...
    </div>

    <div
      v-else-if="clients.length === 0"
      class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 py-12 text-center"
    >
      <UIcon
        name="i-lucide-building-2"
        class="mb-3 text-4xl text-slate-300"
      />
      <p class="mb-4 text-slate-500">
        Aucun client
      </p>
      <UButton
        icon="i-lucide-circle-plus"
        variant="outline"
        color="neutral"
        @click="openCreateClient"
      >
        Créer un client
      </UButton>
    </div>

    <ul
      v-else
      class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="client in clients"
        :key="client.id"
      >
        <NuxtLink
          :to="`/clients/${client.id}`"
          class="group block h-full"
        >
          <UCard
            class="h-full rounded-[1.35rem] border-0 bg-white/90 shadow-sm ring-1 ring-gray-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
                  <UIcon
                    :name="getClientIcon(client.icon)"
                    class="text-lg"
                  />
                </div>

                <div class="min-w-0 flex-1 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge
                      v-if="client.status"
                      color="neutral"
                      variant="soft"
                      class="rounded-full"
                    >
                      {{ client.status }}
                    </UBadge>
                  </div>

                  <h2 class="text-lg font-semibold tracking-tight text-slate-900">
                    {{ client.name }}
                  </h2>
                </div>
              </div>

              <p
                v-if="client.description"
                class="line-clamp-3 text-sm leading-6 text-slate-600"
              >
                {{ client.description }}
              </p>
              <p
                v-else
                class="text-sm italic text-slate-400"
              >
                Aucune description
              </p>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-if="client.email"
                  color="neutral"
                  variant="soft"
                  class="rounded-full"
                >
                  <UIcon
                    name="i-lucide-mail"
                    class="mr-1"
                  />
                  {{ client.email }}
                </UBadge>
                <UBadge
                  v-if="client.phone"
                  color="neutral"
                  variant="soft"
                  class="rounded-full"
                >
                  <UIcon
                    name="i-lucide-phone"
                    class="mr-1"
                  />
                  {{ client.phone }}
                </UBadge>
                <UBadge
                  v-if="client.website"
                  color="neutral"
                  variant="soft"
                  class="rounded-full"
                >
                  <UIcon
                    name="i-lucide-globe"
                    class="mr-1"
                  />
                  Site web
                </UBadge>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
