<script setup lang="ts">
import { GridStack } from 'gridstack';
import { onMounted, useTemplateRef } from 'vue';
const gridRef = useTemplateRef('gridContainer')
onMounted(() => {
    const gridStack = new GridStack(gridRef.value!)
    gridStack.on('change', (e: Event, items) => {
        
    })
})
</script>
<template>
    <div ref="gridContainer" class="w-full h-full" />
</template>
