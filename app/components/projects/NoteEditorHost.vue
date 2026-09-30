<script setup lang="ts">
const props = defineProps<{
  projectId: number
  projectName: string
}>()

const route = useRoute()
const router = useRouter()

const openNoteId = computed(() => {
  const raw = Array.isArray(route.query.note) ? route.query.note[0] : route.query.note
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

// replace plutôt que push : sinon Retour après une fermeture rouvrirait la note qu'on vient de fermer.
const closeNote = async () => {
  const query = Object.fromEntries(Object.entries(route.query).filter(([key]) => key !== 'note'))
  await router.replace({ query })
}

// Couvre aussi la fermeture par le bouton Retour du navigateur, qui ne passe pas par closeNote.
watch(openNoteId, (noteId, previousNoteId) => {
  if (previousNoteId && noteId !== previousNoteId) void refreshNuxtData(getProjectNotesKey(props.projectId))
})
</script>

<template>
  <!-- L'éditeur n'a rien à rendre côté serveur : un lien ?note= ouvre la note après hydratation. -->
  <ClientOnly>
    <ProjectsNoteEditor
      v-if="openNoteId"
      :key="openNoteId"
      :note-id="openNoteId"
      :project-id="projectId"
      :project-name="projectName"
      @close="closeNote"
    />
  </ClientOnly>
</template>
