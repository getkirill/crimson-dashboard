<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<template>
    <button v-if="needRefresh" class="border border-white rounded-sm px-2"
        @click="() => updateServiceWorker(true)">Update app</button>
</template>