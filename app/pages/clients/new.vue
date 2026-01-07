<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { clientCreateSchema, type ClientCreate } from '~/validation/clients'

const router = useRouter()
const toast = useToast()

const state = reactive<ClientCreate>({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  website: '',
  notes: ''
})

const loading = ref(false)

const onSubmit = async (e: FormSubmitEvent<ClientCreate>) => {
  console.log('Submitting form with data:', state)
  e.preventDefault()
  try {
    loading.value = true

    const validatedData = clientCreateSchema.parse(state)

    const { error } = await useFetch('/api/clients', {
      method: 'POST',
      body: validatedData
    })

    if (error.value) {
      toast.add({
        title: 'Erreur',
        description: error.value.data?.message || 'Impossible de créer le client',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      return
    }

    toast.add({
      title: 'Succès',
      description: 'Client créé avec succès',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    router.push('/clients')
  } catch (err) {
    toast.add({
      title: 'Erreur',
      description: 'Une erreur est survenue : ' + (err instanceof Error ? err.message : String(err)),
      color: 'error',
      icon: 'i-lucide-alert-circle'
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
        to="/clients"
        variant="ghost"
        icon="i-lucide-arrow-left"
        label="Retour"
      />
    </div>

    <h1 class="text-3xl font-bold mb-6">
      Nouveau client
    </h1>

    <UForm
      :schema="clientCreateSchema"
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
          <UFormField
            label="Nom de l'entreprise"
            name="name"
            required
          >
            <UInput
              v-model="state.name"
              placeholder="Ex: Entreprise ABC"
            />
          </UFormField>

          <UFormField
            label="Email"
            name="email"
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="contact@entreprise.com"
            />
          </UFormField>

          <UFormField
            label="Téléphone"
            name="phone"
          >
            <UInput
              v-model="state.phone"
              placeholder="01 23 45 67 89"
            />
          </UFormField>

          <UFormField
            label="Site web"
            name="website"
          >
            <UInput
              v-model="state.website"
              placeholder="https://www.entreprise.com"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- Adresse -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Adresse
          </h2>
        </template>

        <div class="space-y-4">
          <UFormField
            label="Adresse"
            name="address"
          >
            <UTextarea
              v-model="state.address"
              placeholder="123 rue de la Paix"
              :rows="2"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Ville"
              name="city"
            >
              <UInput
                v-model="state.city"
                placeholder="Paris"
              />
            </UFormField>

            <UFormField
              label="Code postal"
              name="postalCode"
            >
              <UInput
                v-model="state.postalCode"
                placeholder="75001"
              />
            </UFormField>
          </div>

          <UFormField
            label="Pays"
            name="country"
          >
            <UInput
              v-model="state.country"
              placeholder="France"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- Notes -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Notes
          </h2>
        </template>

        <UFormField
          label="Notes internes"
          name="notes"
        >
          <UTextarea
            v-model="state.notes"
            placeholder="Informations supplémentaires..."
            :rows="4"
          />
        </UFormField>
      </UCard>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <UButton
          type="button"
          variant="ghost"
          label="Annuler"
          :disabled="loading"
          @click="router.push('/clients')"
        />
        <UButton
          type="submit"
          label="Créer le client"
          :loading="loading"
        />
      </div>
    </UForm>
  </div>
</template>
