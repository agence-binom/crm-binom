<script setup lang="ts">
const links = [
  {
    icon: 'i-lucide-users',
    label: 'Clients',
    description: 'Gérer vos clients',
    to: '/clients',
    color: 'blue'
  },
  {
    icon: 'i-lucide-contact',
    label: 'Contacts',
    description: 'Gérer vos contacts',
    to: '/contacts',
    color: 'green'
  },
  {
    icon: 'i-lucide-folder',
    label: 'Projets',
    description: 'Gérer vos projets web',
    to: '/projects',
    color: 'orange'
  },
  {
    icon: 'i-lucide-user',
    label: 'Utilisateurs',
    description: 'Gérer les utilisateurs',
    to: '/users',
    color: 'purple'
  }
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto p-6">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12 mt-8">
          <h1 class="text-4xl font-bold mb-4">
            CRM Binom
          </h1>
          <p class="text-xl text-gray-600">
            Gérez vos clients et contacts efficacement
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <UCard
            v-for="link in links"
            :key="link.to"
            class="hover:shadow-lg transition-shadow cursor-pointer"
            @click="navigateTo(link.to)"
          >
            <div class="text-center py-8">
              <div class="flex justify-center mb-4">
                <div
                  class="p-4 rounded-full"
                  :class="`bg-${link.color}-100`"
                >
                  <UIcon
                    :name="link.icon"
                    :class="`text-4xl text-${link.color}-600`"
                  />
                </div>
              </div>
              <h3 class="text-xl font-semibold mb-2">
                {{ link.label }}
              </h3>
              <p class="text-gray-600">
                {{ link.description }}
              </p>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
