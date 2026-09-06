<script setup lang="ts">
import { billingDocumentTypesRequiringFactureNetLink, getDocumentDownloadHref, getDocumentFactureNetHref, type BillingDocumentType } from '~/lib/documents'

const props = withDefaults(defineProps<{
  document: { downloadUrl?: string | null, filepath?: string | null, externalUrl?: string | null }
  documentType: BillingDocumentType
  warnOnMissingLink?: boolean
}>(), {
  warnOnMissingLink: true
})

const downloadHref = computed(() => getDocumentDownloadHref(props.document))
const factureNetHref = computed(() => getDocumentFactureNetHref(props.document))
const requiresFactureNetLink = computed(() => props.warnOnMissingLink && billingDocumentTypesRequiringFactureNetLink.includes(props.documentType))
</script>

<template>
  <UTooltip
    v-if="requiresFactureNetLink"
    :text="factureNetHref ? 'Ouvrir sur Facture.net' : 'Lien Facture.net manquant'"
  >
    <UButton
      size="sm"
      variant="soft"
      :color="warnOnMissingLink && !factureNetHref ? 'warning' : 'neutral'"
      icon="i-lucide-external-link"
      :href="factureNetHref"
      :disabled="!factureNetHref"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Ouvrir le document sur Facture.net"
    />
  </UTooltip>
  <UTooltip text="Aperçu">
    <UButton
      size="sm"
      variant="soft"
      color="neutral"
      icon="i-lucide-eye"
      :href="downloadHref"
      :disabled="!downloadHref"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Aperçu du document"
    />
  </UTooltip>
  <UTooltip text="Télécharger">
    <UButton
      size="sm"
      variant="soft"
      color="neutral"
      icon="i-lucide-download"
      :href="downloadHref"
      :disabled="!downloadHref"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Télécharger le document"
    />
  </UTooltip>
</template>
