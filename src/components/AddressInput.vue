<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';
import { ipRegex, type Address } from '../composables/ntVue';

const model = defineModel<Address>()
const input = useTemplateRef('input')
onMounted(() => {
    if (model.value)
        input.value!.value = 'team' in model.value ? `${model.value.team}` : model.value?.ip
})
function update(e: InputEvent) {
    const value = input.value?.value
    if (!value) return
    if (/[0-9]+/.test(value)) {
        console.log("Setting address to team")
        model.value = { team: +value }
    } else if(ipRegex.test(value.trim())) {
        console.log("Setting address to ip")
        model.value = { ip: value }
    }
}
</script>
<template>
    <input ref="input" type="text" placeholder="Team or IP" @input.prevent="update" class="mx-2 border border-white rounded-sm px-2 w-24 text-center">
</template>