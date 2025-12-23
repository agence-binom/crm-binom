<template>
  <div class="container mx-auto p-6 max-w-4xl">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">
        Nouveau projet
      </h1>
      <UBreadcrumb :items="breadcrumbItems" />
    </div>

    <UCard>
      <UForm
        :schema="projectCreateSchema"
        :state="formState"
        @submit="onSubmit"
      >
        <!-- Informations générales -->
        <div class="space-y-4 mb-6">
          <h3 class="text-lg font-semibold">
            Informations générales
          </h3>

          <UFormField
            label="Nom du projet *"
            name="name"
            required
          >
            <UInput
              v-model="formState.name"
              placeholder="Site web e-commerce"
            />
          </UFormField>

          <UFormField
            label="Description"
            name="description"
          >
            <UTextarea
              v-model="formState.description"
              placeholder="Description détaillée du projet..."
              :rows="4"
            />
          </UFormField>

          <UFormField
            label="Statut"
            name="status"
          >
            <USelectMenu
              v-model="formState.status"
              :options="statusOptions"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormField>
        </div>

        <!-- Budget et dates -->
        <div class="space-y-4 mb-6">
          <h3 class="text-lg font-semibold">
            Budget et planning
          </h3>

          <UFormField
            label="Budget (€)"
            name="budget"
            hint="Montant en euros"
          >
            <UInput
              v-model="budgetEuros"
              type="number"
              placeholder="5000"
              step="0.01"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Date de début"
              name="startDate"
            >
              <UInput
                v-model="formState.startDate"
                type="date"
              />
            </UFormField>

            <UFormField
              label="Date de fin"
              name="endDate"
            >
              <UInput
                v-model="formState.endDate"
                type="date"
              />
            </UFormField>
          </div>
        </div>

        <!-- Informations complémentaires -->
        <div class="space-y-4 mb-6">
          <h3 class="text-lg font-semibold">
            Informations complémentaires
          </h3>

          <UFormField
            label="URL du site"
            name="url"
            hint="URL du projet en production"
          >
            <UInput
              v-model="formState.url"
              placeholder="https://example.com"
              type="url"
            />
          </UFormField>

          <UFormField
            label="Notes"
            name="notes"
          >
            <UTextarea
              v-model="formState.notes"
              placeholder="Notes internes, remarques..."
              :rows="3"
            />
          </UFormField>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <UButton
            variant="soft"
            @click="navigateTo(`/clients/${clientId}/projects`)"
          >
            Annuler
          </UButton>
          <UButton
            type="submit"
            :loading="isSubmitting"
          >
            Créer le projet
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { projectCreateSchema, type ProjectCreate } from '~/db/schema/validation'

const route = useRoute()
const clientId = computed(() => Number(route.params.id))

// State pour le formulaire avec des strings pour les dates
const formState = reactive({
  clientId: clientId.value,
  name: '',
  description: '',
  status: 'en_cours' as 'en_cours' | 'termine' | 'en_attente' | 'annule',
  budget: undefined as number | undefined,
  startDate: '',
  endDate: '',
  url: '',
  notes: ''
})

const budgetEuros = ref('')
const isSubmitting = ref(false)

// Convertir les euros en centimes quand le budget change
watch(budgetEuros, (value) => {
  if (value === '' || value === null) {
    formState.budget = undefined
  } else {
    const euros = parseFloat(value)
    if (!isNaN(euros)) {
      formState.budget = Math.round(euros * 100)
    }
  }
})

const statusOptions = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'annule', label: 'Annulé' }
]

const breadcrumbItems = [
  { label: 'Clients', to: '/clients' },
  { label: 'Projets', to: `/clients/${clientId.value}/projects` },
  { label: 'Nouveau' }
]

const onSubmit = async () => {
  isSubmitting.value = true
  
  try {
    // Convertir les dates en objets Date si nécessaire
    const submitData: ProjectCreate = {
      ...formState,
      startDate: formState.startDate ? new Date(formState.startDate) : undefined,
      endDate: formState.endDate ? new Date(formState.endDate) : undefined
    }
    
    await $fetch('/api/projects', {
      method: 'POST',
      body: submitData
    })
    
    navigateTo(`/clients/${clientId.value}/projects`)
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error)
    alert('Erreur lors de la création du projet')
  } finally {
    isSubmitting.value = false
  }
}
</script>
