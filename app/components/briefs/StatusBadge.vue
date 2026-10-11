<script setup lang="ts">
import type { BriefDisplayStatus } from '~/constants/briefs'
import { getBriefDisplayStatusColor, getBriefDisplayStatusLabel } from '~/lib/briefs'

defineProps<{
  status: BriefDisplayStatus
  prefix?: string
}>()
</script>

<template>
  <UBadge
    variant="soft"
    :color="getBriefDisplayStatusColor(status)"
    icon="i-lucide-clipboard-list"
    class="w-fit rounded-full"
  >
    {{ prefix ? `${prefix} ${getBriefDisplayStatusLabel(status).toLowerCase()}` : getBriefDisplayStatusLabel(status) }}
  </UBadge>
</template>
