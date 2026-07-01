import { NetworkTables, NetworkTablesTopic, type NetworkTablesTypeInfo } from "ntcore-ts-client"
import { computed, ref, toValue, watch, watchEffect, type ComputedRef, type MaybeRef, type MaybeRefOrGetter, type WatchSource } from "vue"

const connected = ref(false)
export const ipRegex = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/
export type Address = {
    ip: string
} | {
    team: number
}
const address = ref<Address>({ ip: "127.0.0.1" })
const nt = ref<NetworkTables>(NetworkTables.getInstanceByURI("127.0.0.1"))
nt.value.client.messenger.socket.stopAutoConnect()
nt.value.addRobotConnectionListener(isConnected => connected.value = isConnected)
let _ntInit = false
export function useNt() {
    if (!_ntInit) {
        watch(address, () => {
            if (nt.value) {
            }
            // nt.value = 'team' in address.value ? NetworkTables.getInstanceByTeam(address.value.team) : NetworkTables.getInstanceByURI(address.value.ip)
            nt.value.client.cleanup()
            const uri = 'team' in address.value ? `roborio-${address.value.team}-frc.local` : address.value.ip
            console.log("reconnecting to ", uri)
            nt.value.client.messenger.socket.stopAutoConnect()
            nt.value.client.messenger.socket.close()
           
            nt.value.changeURI(uri)
        })
        _ntInit = true
    }
    return { instance: nt, address, connected }
}
export function useNtTopic<T extends string | number | boolean | ArrayBuffer | boolean[] | string[] | number[]>(topic: string, type: NetworkTablesTypeInfo, def?: T) {
    const topicRef = ref<NetworkTablesTopic<T>>()
    watchEffect(() => {
        if (connected.value) {
            topicRef.value = nt.value?.createTopic<T>(topic, type, def)
        }
    })
    return topicRef
}
// const knownTopics = ref<string[]>([])
// let _topicsInit = false
function computedBy<T>(watcher: WatchSource, compute: () => T | Promise<T>, def: T) {
    const rf = ref<T>(def)
    watch(watcher, async () => {
        rf.value = await compute()
    })
    return rf.value
}
const knownTopics = ref<string[]>([])
let _knownTopicsInit = false
export function useNtTopics() {
    if (!_knownTopicsInit) {
        watch(address, () => useNt().instance.value.createPrefixTopic("/").subscribe((it, it2) => {
            if (!knownTopics.value.includes(it2.name)) {
                console.log("Topic discovered: " + it2.name)
                knownTopics.value.push(it2.name)
            }
        }, { topicsonly: true, }))
        _knownTopicsInit = true
    }
    return knownTopics.value
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