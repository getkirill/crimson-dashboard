<script setup lang="ts">
import 'gridstack/dist/gridstack.css'
import WidgetWrap from './WidgetWrap.vue';
import { useTemplateRef } from 'vue';
import { GridStack } from 'gridstack';
import CheckboxWidget from './CheckboxWidget.vue';

const gridRef = useTemplateRef('gridContainer')
// const gridStack = new GridStack()
</script>
<template>
    <div ref="gridContainer" class="w-full h-full">
        <WidgetWrap label="meta">
            <CheckboxWidget topic="/MyTable/check" />
        </WidgetWrap>
    </div>
</template>
