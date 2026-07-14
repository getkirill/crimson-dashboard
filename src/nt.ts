import { BehaviorSubject, delay, filter, first, fromEvent, map, merge, Observable, skip, Subject, Subscription, take, takeUntil, tap, type Observer } from 'rxjs'
import * as msgpack from '@msgpack/msgpack'
import { fromIterable } from 'rxjs/internal/observable/innerFrom'
export type Address = number | string
function addressToIp(address: Address): string {
    return typeof address == 'number' ? `roborio-${address}-frc.local` : address
}
export type NTTopicProperties = {}
export type NTTextMessage =
    | { method: 'announce', params: { name: string, id: number, type: string, pubuid?: number, properties: NTTopicProperties } }
    | { method: 'unannounce', params: { name: string, id: number } }
    | { method: 'subscribe', params: { topics: string[], subuid: number, options: { topicsonly?: boolean, prefix?: boolean } } }
    | { method: 'unsubscribe', params: { subuid: number } }
    | { method: 'publish', params: { name: string, pubuid: number, type: string, properties: NTTopicProperties } }
    | { method: 'unpublish', params: { pubuid: number } }
export type NTUpdate<T> = [number, number, number, T]
export type ConnectionState = 'not_connected' | 'connecting' | 'connected'
export type NTTopicType =
    | "boolean"
    | "double"
    | "int"
    | "float"
    | "string"
    | "json"
    | "raw"
    | "rpc"
    | "msgpack"
    | "protobuf"
    | "boolean[]"
    | "double[]"
    | "int[]"
    | "float[]"
    | "string[]";
function ntTypeOf(value: any): number {
    if (typeof value === 'boolean') {
        return 0;
    }

    if (typeof value === 'number') {
        return Number.isInteger(value) ? 2 : 1;
    }

    if (typeof value === 'string') {
        return 4;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return 17;
        }

        const firstType = typeof value[0];

        if (firstType === 'boolean' && value.every(v => typeof v === 'boolean')) {
            return 16;
        }

        if (firstType === 'number') {
            if (value.every(v => typeof v === 'number' && Number.isInteger(v))) {
                return 18;
            }
            if (value.every(v => typeof v === 'number')) {
                return 17;
            }
        }

        if (firstType === 'string' && value.every(v => typeof v === 'string')) {
            return 20;
        }
    }

    if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
        return 5; // bin
    }

    throw new Error('unknown nt data type passed to ntTypeOf - ' + value)
}
export class NetworkTables {
    address$: BehaviorSubject<Address>
    connectionState$: BehaviorSubject<ConnectionState>
    messages$: Subject<NTTextMessage>
    updates$: Subject<NTUpdate<any>>
    topicIds: Map<string, number>
    ws: WebSocket | undefined
    subscriberCounter: number
    publisherCounter: number
    reconnectSubscriber: Subscription | undefined
    constructor(address: Address) {
        this.connectionState$ = new BehaviorSubject<ConnectionState>('not_connected')
        this.connectionState$.subscribe((it) => console.log('[NT]', it))
        this.address$ = new BehaviorSubject(address)
        this.address$.pipe(skip(1)).subscribe(() => this.connect())
        this.messages$ = new Subject()
        this.topicIds = new Map()
        this.subscriberCounter = 0
        this.publisherCounter = 0
        this.updates$ = new Subject()
        this.messages$.pipe(filter(it => it.method == 'announce')).subscribe(it => {
            this.topicIds.set(it.params.name, it.params.id)
        })
        this.messages$.pipe(filter(it => it.method == 'unannounce')).subscribe(it => {
            this.topicIds.delete(it.params.name)
        })
    }

    disconnect(dontReconnect: boolean = true) {
        if(dontReconnect) {
            this.reconnectSubscriber?.unsubscribe()
        }
        if (!this.ws) return
        this.ws?.close()
        this.ws = undefined
        this.connectionState$.next('not_connected')
    }

    connect() {
        if (this.ws) this.disconnect()
        this.connectionState$.next('connecting')
        this.ws = new WebSocket(`ws://${addressToIp(this.address$.value)}:5810/nt/crdash`)
        this.ws.binaryType = 'arraybuffer'
        this.reconnectSubscriber = merge(fromEvent(this.ws, 'close'), fromEvent(this.ws, 'error'))
            .pipe(
                take(1),
                tap(() => this.disconnect(false)),
                delay(2000))
            .subscribe(() => this.connect())
        fromEvent(this.ws, 'open').subscribe(() => {
            this.connectionState$.next('connected')
        })
        fromEvent(this.ws, 'message').subscribe((_e) => {
            const e = _e as MessageEvent
            if (typeof e.data == 'string') {
                (JSON.parse(e.data) as NTTextMessage[]).forEach(mesg => this.messages$.next(mesg))
            } else if (e.data instanceof ArrayBuffer) {
                ([...msgpack.decodeMulti(e.data)] as NTUpdate<any>[]).forEach(update => this.updates$.next(update))
            }
        })
    }
    sendFrame(frame: NTTextMessage | NTUpdate<any>) {
        if (frame instanceof Array) {
            this.ws?.send(msgpack.encode(frame))
        } else {
            this.ws?.send(JSON.stringify([frame]))
        }
    }
    subscribe<T>(topicName: string): Observable<T> {
        return new Observable((subscriber) => {
            const subuid = this.subscriberCounter++
            this.sendFrame({ method: "subscribe", params: { topics: [topicName], subuid, options: {} } })
            const updates = this.updates$.pipe(filter(it => it[0] == this.topicIds.get(topicName))).subscribe(it => subscriber.next(it[3]))
            return () => {
                updates.unsubscribe()
                this.sendFrame({ method: "unsubscribe", params: { subuid } })
            }
        })
    }
    publish<T>(topicName: string, type: NTTopicType, properties: NTTopicProperties = {}): Observer<T> {
        const pubuid = this.publisherCounter++
        const observer: Observer<T> = {
            next: (value) => {
                this.sendFrame([pubuid, Math.floor(Date.now() * 1000), ntTypeOf(value), value])
            },
            error: (err) => {
                this.sendFrame({ method: 'unpublish', params: { pubuid } })
            },
            complete: () => {
                this.sendFrame({ method: 'unpublish', params: { pubuid } })
            }
        }
        this.sendFrame({ method: 'publish', params: { name: topicName, pubuid, properties, type } })
        return observer
    }
}