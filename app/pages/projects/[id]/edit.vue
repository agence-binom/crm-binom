<template>
  <div class="container mx-auto p-6 max-w-4xl">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">
        Modifier le projet
      </h1>
      <UBreadcrumb :items="breadcrumbItems" />
    </div>

    <UCard v-if="project">
      <UForm
        :schema="projectUpdateSchema"
        :state="formState"
        @submit="onSubmit"
      >
        <!-- Informations générales -->
        <div class="space-y-4 mb-6">
          <h3 class="text-lg font-semibold">
            Informations générales
          </h3>

          <UFormField
            label="Nom du projet"
            name="name"
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
            @click="goBack()"
          >
            Annuler
          </UButton>
          <UButton
            type="submit"
            :loading="isSubmitting"
          >
            Enregistrer
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { projectUpdateSchema, type ProjectUpdate } from '~/db/schema/validation'

const route = useRoute()
const projectId = computed(() => Number(route.params.id))

// Récupérer le projet
const { data: project } = await useFetch(`/api/projects/${projectId.value}`)

if (!project.value) {
  throw createError({
    statusCode: 404,
    message: 'Projet non trouvé'
  })
}

// State pour le formulaire avec des strings pour les dates
const formState = reactive({
  name: project.value.name || '',
  description: project.value.description || '',
  status: (project.value.status as 'en_cours' | 'termine' | 'en_attente' | 'annule') || undefined,
  budget: project.value.budget || undefined,
  startDate: project.value.startDate ? new Date(project.value.startDate).toISOString().split('T')[0] : '',
  endDate: project.value.endDate ? new Date(project.value.endDate).toISOString().split('T')[0] : '',
  url: project.value.url || '',
  notes: project.value.notes || ''
})

const budgetEuros = ref(project.value.budget ? (project.value.budget / 100).toString() : '')
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
  { label: 'Projets', to: `/clients/${project.value.clientId}/projects` },
  { label: 'Modifier' }
]

const onSubmit = async () => {
  isSubmitting.value = true
  
  try {
    // Convertir les dates en objets Date si nécessaire
    const submitData: ProjectUpdate = {
      ...formState,
      startDate: formState.startDate ? new Date(formState.startDate) : undefined,
      endDate: formState.endDate ? new Date(formState.endDate) : undefined
    }
    
    await $fetch(`/api/projects/${projectId.value}`, {
      method: 'PUT',
      body: submitData
    })
    
    goBack()
  } catch (error) {
    console.error('Erreur lors de la modification du projet:', error)
    alert('Erreur lors de la modification du projet')
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  navigateTo(`/clients/${project.value?.clientId}/projects`)
}
</script>
