import { NetworkTables, NetworkTablesTopic, type NetworkTablesTypeInfo } from "ntcore-ts-client"
import { computed, ref, toValue, watch, watchEffect, type ComputedRef, type MaybeRef, type MaybeRefOrGetter } from "vue"

const nt = ref<NetworkTables>()
const connected = ref(false)
export function useNt() {
    function configure(address: { uri: string } | { team: number }) {
        nt.value = 'team' in address ? NetworkTables.getInstanceByTeam(address.team) : NetworkTables.getInstanceByURI(address.uri)
        nt.value.addRobotConnectionListener(isConnected => connected.value = isConnected)
    }
    return { instance: nt, configure, connected }
}
export function useNtTopic<T extends string | number | boolean | ArrayBuffer | boolean[] | string[] | number[]>(topic: string, type: NetworkTablesTypeInfo, def?: T) {
    const topicRef = ref<NetworkTablesTopic<T>>()
    watchEffect(() => {
        if (connected) {
            topicRef.value = nt.value?.createTopic<T>(topic, type, def)
        }
    })
    return topicRef
}


export function useNtTopicValue<T extends string | number | boolean | ArrayBuffer | boolean[] | string[] | number[]>(
    topic: MaybeRef<NetworkTablesTopic<T> | undefined> | ComputedRef<NetworkTablesTopic<T> | undefined>
) {
    const value = ref<T | null>(null)
    let subscription: number

    watch(() => toValue(topic), async (currentTopic, oldTopic) => {
        oldTopic?.unsubscribe(subscription)

        if (!currentTopic) {
            value.value = null
            return
        }

        try {
            console.log("Publishing topic:", currentTopic.name)
            await currentTopic.publish()

            console.log("Subscribing to:", currentTopic.name)
            subscription = currentTopic.subscribe((v) => {
                if (value.value !== v) {
                    value.value = v
                }
            })
        } catch (err) {
            console.error("Failed to initialize NT Topic:", err)
        }
    }, { immediate: true })

    watch(value, (newValue) => {
        const currentTopic = toValue(topic)
        if (currentTopic && currentTopic.publisher) {
            currentTopic.setValue(newValue)
        }
    })

    return value
}