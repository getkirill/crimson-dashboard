import { NetworkTables, NetworkTablesTopic, type NetworkTablesTypeInfo } from "ntcore-ts-client"
import { computed, ref, toValue, watch, watchEffect, type ComputedRef, type MaybeRef, type MaybeRefOrGetter } from "vue"

const nt = ref<NetworkTables>()
const connected = ref(false)
export const ipRegex = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/
export type Address = {
    ip: string
} | {
    team: number
}
const address = ref<Address>({ ip: "127.0.0.1" })
export function useNt() {
    watch(address, () => {
        console.log("reconnecting")
        if(nt.value) {
            nt.value.client.cleanup()
        }
        nt.value = 'team' in address.value ? NetworkTables.getInstanceByTeam(address.value.team) : NetworkTables.getInstanceByURI(address.value.ip)
        nt.value.addRobotConnectionListener(isConnected => connected.value = isConnected)
    }, {immediate: true})
    return { instance: nt, address, connected }
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
    topic: MaybeRef<NetworkTablesTopic<T> | undefined> | ComputedRef<NetworkTablesTopic<T> | undefined>,
    publish: boolean = true
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
            if (publish) {
                console.log("Publishing topic:", currentTopic.name)
                await currentTopic.publish()
            }
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

    if (publish) watch(value, (newValue) => {
        const currentTopic = toValue(topic)
        if (currentTopic && currentTopic.publisher) {
            currentTopic.setValue(newValue)
        }
    })

    return value
}