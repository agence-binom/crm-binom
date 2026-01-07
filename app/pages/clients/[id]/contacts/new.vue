<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { contactCreateSchema, type ContactCreate } from '~/validation/contacts'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const clientId = Number(route.params.id)

// Vérifier que le client existe
const { data: clientData } = await useFetch(`/api/clients/${clientId}`)

if (!clientData.value) {
  throw createError({
    statusCode: 404,
    message: 'Client non trouvé'
  })
}

const client = computed(() => clientData.value?.client)

const state = reactive<ContactCreate>({
  clientId,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  mobile: '',
  notes: ''
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<ContactCreate>) {
  loading.value = true

  try {
    const { error } = await useFetch('/api/contacts', {
      method: 'POST',
      body: event.data
    })

    if (error.value) {
      toast.add({
        title: 'Erreur',
        description: 'Impossible de créer le contact',
        color: 'error'
      })
      return
    }

    toast.add({
      title: 'Succès',
      description: 'Contact créé avec succès',
      color: 'success'
    })

    router.push(`/clients/${clientId}/contacts`)
  } catch (err) {
    console.error('Erreur:', err)
    toast.add({
      title: 'Erreur',
      description: 'Une erreur est survenue',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto p-6 max-w-2xl">
    <div class="mb-6">
      <UButton
        :to="`/clients/${clientId}/contacts`"
        variant="ghost"
        icon="i-lucide-arrow-left"
        label="Retour"
      />
    </div>

    <h1 class="text-3xl font-bold mb-2">
      Nouveau contact
    </h1>
    <p class="text-gray-600 mb-6">
      Pour {{ client?.name }}
    </p>

    <UForm
      :schema="contactCreateSchema"
      :state="state"
      class="space-y-6"
      @submit="onSubmit"
    >
      <!-- Informations principales -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Informations principales
          </h2>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup
              label="Prénom"
              name="firstName"
              required
            >
              <UInput
                v-model="state.firstName"
                placeholder="Jean"
              />
            </UFormGroup>

            <UFormGroup
              label="Nom"
              name="lastName"
              required
            >
              <UInput
                v-model="state.lastName"
                placeholder="Dupont"
              />
            </UFormGroup>
          </div>

          <UFormGroup
            label="Email"
            name="email"
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="jean.dupont@entreprise.com"
            />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup
              label="Téléphone"
              name="phone"
            >
              <UInput
                v-model="state.phone"
                placeholder="01 23 45 67 89"
              />
            </UFormGroup>

            <UFormGroup
              label="Mobile"
              name="mobile"
            >
              <UInput
                v-model="state.mobile"
                placeholder="06 12 34 56 78"
              />
            </UFormGroup>
          </div>

          <UFormGroup
            label="Poste"
            name="position"
          >
            <UInput
              v-model="state.position"
              placeholder="Directeur commercial"
            />
          </UFormGroup>
        </div>
      </UCard>

      <!-- Notes -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Notes
          </h2>
        </template>

        <UFormGroup
          label="Notes internes"
          name="notes"
        >
          <UTextarea
            v-model="state.notes"
            placeholder="Informations supplémentaires..."
            :rows="4"
          />
        </UFormGroup>
      </UCard>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <UButton
          type="button"
          variant="ghost"
          label="Annuler"
          :disabled="loading"
          @click="router.push(`/clients/${clientId}/contacts`)"
        />
        <UButton
          type="submit"
          label="Créer le contact"
          :loading="loading"
        />
      </div>
    </UForm>
  </div>
</template>
