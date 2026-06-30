<script setup lang="ts">
import { computed } from 'vue';
import { useNt, useNtTopicValue } from './composables/nt';
import { NetworkTablesTypeInfos } from 'ntcore-ts-client';

const nt = useNt()
nt.configure({ uri: "127.0.0.1" })
const isRedTopic = computed(() => nt.instance.value?.createTopic("/MyTable/IsRedAlliance", NetworkTablesTypeInfos.kBoolean, false))
const isRed = useNtTopicValue(isRedTopic)
</script>

<template>
  <p>Is NetworkTables connected? {{ nt.connected.value ? "Connected" : "Not connected" }}</p>
  <label><input type="checkbox" v-model="isRed"> Is red?</label>
</template>
