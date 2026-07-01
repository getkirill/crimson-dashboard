<script setup lang="ts">
import { TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui';
import AddressInput from './components/AddressInput.vue';
import { useNt } from './composables/nt';
import { ref } from 'vue';
import Dash from './components/Dash.vue';
import SWUpdate from './components/SWUpdate.vue';

const { address, connected } = useNt()
const tab = ref('tab1')
</script>

<template>
  <div class="flex flex-col w-screen h-screen overflow-hidden bg-gray-900 text-white">
    <header class="bg-primary-500 min-h-title-h">
      <div class="h-full w-title-w ml-title-x flex items-center px-2">
        <h1 class="hidden">Crimson Dashboard</h1>
        <AddressInput v-model="address" />
        <p>{{ connected ? "Connected" : "Not connected" }}</p>
        <div class="app-region-drag grow h-full" />
        <SWUpdate />
      </div>
    </header>
    <TabsRoot v-model="tab">
      <TabsList class="relative flex gap-2 p-1">
        <TabsIndicator
          class="absolute bottom-0 w-(--reka-tabs-indicator-size) left-(--reka-tabs-indicator-position) h-1 bg-primary-500 transition-all ease-in-out" />
        <TabsTrigger value="tab1">
          Tab 1
        </TabsTrigger>
        <TabsTrigger value="tab2">
          Tab 2
        </TabsTrigger>
      </TabsList>
    </TabsRoot>
    <Dash />
  </div>
</template>
