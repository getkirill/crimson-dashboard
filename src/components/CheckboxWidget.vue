<script setup lang="ts">
import { NetworkTablesTypeInfos } from 'ntcore-ts-client';
import { useNtTopic, useNtTopicValue } from '../composables/ntVue';

const {topic: topicName} = defineProps<{topic: string}>()

const topic = useNtTopic(topicName, NetworkTablesTypeInfos.kBoolean)
const value = useNtTopicValue(topic)
</script>
<template>
    <div class="flex items-center justify-center grow">
        <input type="checkbox" v-model="value">
    </div>
</template>