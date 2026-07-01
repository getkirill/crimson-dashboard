type NTMessage = NTS2CTopicAnnounceMessage<any> | NTS2CTopicUnannounceMessage
type NTMessagePayload<T extends {param: unknown}> = T['param']
type NTTypeToTypescript = {
    'boolean': boolean,
    'double': number,
    'int': number,
    'float': number,
    'string': string
}
type NTType = keyof NTTypeToTypescript
type NTTypescriptType<K extends NTType> = NTTypeToTypescript[K]
type NTTopicProperties = { persistent?: boolean, retained?: boolean, cached?: boolean }
type NTTopic<TopicType extends NTType> = { name: string, id: number, type: TopicType, properties: NTTopicProperties }
type NTS2CTopicAnnounceMessage<TopicType extends NTType> = { method: "announce"; param: { name: string, id: number, type: TopicType, pubuid?: number, properties: NTTopicProperties } }
type NTS2CTopicUnannounceMessage = { method: "unannounce"; param: { name: string; id: number } }
type NTExtractTypescriptType<T> = T extends NTS2CTopicAnnounceMessage<infer R> ? NTTypescriptType<R> : never
type NTSubscriptionOptions = {periodic?: number, all?: boolean, topicsonly?: boolean, prefix?: boolean}
function isNtMessage(o: any): o is NTMessage {
    return 'method' in o && 'param' in o
}
function isValidNtType(o: any): o is NTType {
    return o == 'boolean' || o == 'double' || o == 'int' || o == 'float' || o == 'string'
}
export class NetworkTables {
    private ws: WebSocket;
    private knownTopics: NTTopic<any>[]
    constructor(wsUri: URL) {
        this.ws = new WebSocket(wsUri);
        this.ws.addEventListener('message', (ev) => this.onMessage(ev))
        this.knownTopics = []
    }
    onMessage(ev: MessageEvent<any>) {
        if(typeof ev.data == 'string')
            this.onTextMessage(ev)
        else if (ev.data instanceof Blob) {
            this.onBinaryMessage(ev)
        }
    }
    onBinaryMessage(ev: MessageEvent<Blob>) {
        
    }
    onTextMessage(ev: MessageEvent<string>) {
        try {
            const json = JSON.parse(ev.data)
            if (isNtMessage(json)) {
                this.onNtMessage(json)
            }
        } catch (e) {
            if (e instanceof SyntaxError) {
                console.log('Malformed message: ', e)
            }
            else
                console.error('Error during receiving of NT message: ', e)
        }
    }

    onNtMessage(msg: NTMessage) {
        switch (msg.method) {
            case 'announce':
                {
                    this.onNtAnnounce(msg.param as NTMessagePayload<NTS2CTopicAnnounceMessage<any>>)
                    break;
                }
            case 'unannounce':
                {
                    this.onNtUnannounce(msg.param as NTMessagePayload<NTS2CTopicUnannounceMessage>)
                    break
                }
        }
    }
    sendNtMessage(ntMessage: NTMessage) {
        this.ws.send(JSON.stringify(ntMessage))
    }
    _subscribe(topics: string | string[], subuid: number, options: NTSubscriptionOptions) 
    {

    }
    onNtUnannounce(topicUnannounce: NTMessagePayload<NTS2CTopicUnannounceMessage>) {
        this.knownTopics.splice(this.knownTopics.findIndex(it => it.id == topicUnannounce.id || it.name == topicUnannounce.name), 1)
        console.log('Topic unannounce: ', topicUnannounce)
    }
    onNtAnnounce(topicAnnounce: NTMessagePayload<NTS2CTopicAnnounceMessage<any>>) {
        if (!isValidNtType(topicAnnounce.type)) {
            throw new Error(`${topicAnnounce.type} is not a valid NT type`)
        }
        this.knownTopics.push(topicAnnounce)
        console.log('Topic announce: ', topicAnnounce)
    }
    topic(name: string): NetworkTablesTopic {
        return new NetworkTablesTopic(this, name)
    }
}

export class NetworkTablesTopic {
    nt: NetworkTables;
    topic: string;
    constructor(nt: NetworkTables, topic: string) {
        this.nt = nt
        this.topic = topic
    }
    subscribe(cb: (val: any) => void) { }
}