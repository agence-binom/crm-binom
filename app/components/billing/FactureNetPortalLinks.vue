<script setup lang="ts">
import { FACTURE_NET_PORTAL_LINKS } from '~/constants/billing'
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UButton
      variant="soft"
      color="neutral"
      icon="i-lucide-external-link"
      :href="FACTURE_NET_PORTAL_LINKS.quotes"
      target="_blank"
      rel="noopener noreferrer"
    >
      Ouvrir les devis
    </UButton>
    <UButton
      variant="soft"
      color="neutral"
      icon="i-lucide-external-link"
      :href="FACTURE_NET_PORTAL_LINKS.invoices"
      target="_blank"
      rel="noopener noreferrer"
    >
      Ouvrir les factures
    </UButton>
  </div>
</template>
