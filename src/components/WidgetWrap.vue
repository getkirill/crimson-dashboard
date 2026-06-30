<script setup lang="ts">
const props = defineProps<{ label: string }>()
const slots = defineSlots<{default(): any}>()
</script>
<template>
    <div class="bg-gray-800 rounded-md w-full h-full flex flex-col">
        <header class="flex bg-primary-500 rounded-t-md justify-center">{{ props.label }}</header>
        <slot></slot>
    </div>
</template>