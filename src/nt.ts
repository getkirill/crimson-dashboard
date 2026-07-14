import { decode, decodeMulti } from "@msgpack/msgpack";

type NTTextMessage =
  | NTS2CTopicAnnounceMessage<any>
  | NTS2CTopicUnannounceMessage
  | NTC2SSubscribeMessage
  | NTC2SUnsubscribeMessage;
type NTTextMessagePayload<T extends { params: unknown }> = T["params"];
type NTBinaryMessage<T extends NTNumberType> = [
  number,
  number,
  T,
  NTNumberTypeToTypescript[T],
];
const ntNumberToTextTypeMap = {
  0: "boolean",
  1: "double",
  2: "int",
  3: "float",
  4: "string",
} as const;
type NTNumberTypeToTypescript = {
  [K in keyof typeof ntNumberToTextTypeMap]: NTTextTypeToTypescript[(typeof ntNumberToTextTypeMap)[K]];
};
type NTTextTypeToTypescript = {
  boolean: boolean;
  double: number;
  int: number;
  float: number;
  string: string;
};
type NTTextType = keyof NTTextTypeToTypescript;
type NTNumberType = keyof NTNumberTypeToTypescript;
type NTToTypescriptType<K extends NTTextType | NTNumberType> =
  K extends NTTextType
    ? NTTextTypeToTypescript[K]
    : K extends NTNumberType
      ? NTNumberTypeToTypescript[K]
      : never;
type NTExtractTypescriptType<T> =
  T extends NTS2CTopicAnnounceMessage<infer R> ? NTToTypescriptType<R> : never;

type NTTopicProperties = {
  persistent?: boolean;
  retained?: boolean;
  cached?: boolean;
};
type NTTopic<TopicType extends NTTextType> = {
  name: string;
  id: number;
  type: TopicType;
  properties: NTTopicProperties;
};

type NTS2CTopicAnnounceMessage<TopicType extends NTTextType> = {
  method: "announce";
  params: {
    name: string;
    id: number;
    type: TopicType;
    pubuid?: number;
    properties: NTTopicProperties;
  };
};
type NTS2CTopicUnannounceMessage = {
  method: "unannounce";
  params: { name: string; id: number };
};
type NTSubscriptionOptions = {
  periodic?: number;
  all?: boolean;
  topicsonly?: boolean;
  prefix?: boolean;
};
type NTC2SSubscribeMessage = {
  method: "subscribe";
  params: { topics: string[]; subuid: number; options: NTSubscriptionOptions };
};
type NTC2SUnsubscribeMessage = {
  method: "unsubscribe";
  params: { subuid: number };
};

// function isNtMessage(o: any): o is NTTextMessage {
//   return "method" in o && "param" in o;
// }
function isValidNtType(o: any): o is NTTextType {
  return (
    o == "boolean" ||
    o == "double" ||
    o == "int" ||
    o == "float" ||
    o == "string"
  );
}
export function urlFromTeamNumber(team: number): URL {
  return new URL(`ws://roborio-${team}-frc.local`);
}
export class NetworkTables {
  private ws: WebSocket;
  private knownTopics: NTTopic<any>[];
  private ready: (() => void) | undefined;
  private subuidCounter = 1;
  waitReady(): Promise<void> {
    return new Promise((res, rej) => {
      this.ready = res;
    });
  }
  constructor(wsUri: URL, clientName: string = "crimson-nt-client") {
    if (!/\/nt\/.+/.test(wsUri.pathname)) {
      wsUri.pathname = `/nt/${clientName}`;
    }
    this.ws = new WebSocket(wsUri);
    this.ws.binaryType = "arraybuffer";
    this.ws.addEventListener("message", (ev) => this.onMessage(ev));
    this.ws.addEventListener("open", () => this.ready && this.ready());
    this.knownTopics = [];
  }
  onMessage(ev: MessageEvent<any>) {
    if (typeof ev.data == "string") this.onWsTextMessage(ev);
    else if (ev.data instanceof ArrayBuffer) {
      this.onWsBinaryMessage(ev);
    }
  }
  onWsBinaryMessage(ev: MessageEvent<ArrayBuffer>) {
    for (const data of decodeMulti(ev.data) as Generator<
      NTBinaryMessage<NTNumberType>
    >) {
      console.log(
        "Received NT binary message: id=",
        data[0],
        "ts=",
        data[1],
        "type=",
        ntNumberToTextTypeMap[data[2]],
        "value=",
        data[3],
      );
      this.subscriptions[data[0]].forEach((it) => it(data[3]));
    }
  }
  onWsTextMessage(ev: MessageEvent<string>) {
    try {
      const json = JSON.parse(ev.data);
      if (json instanceof Array) {
        json.forEach((mesg) => this.onNtTextMessage(mesg));
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.error("Malformed message: ", e);
      } else console.error("Error during receiving of NT message: ", e);
    }
  }
  messageHandlers: {
    [K in NTTextMessage["method"] | "any"]: ((msg: NTTextMessage) => void)[];
  } = { announce: [], unannounce: [], subscribe: [], unsubscribe: [], any: [] };
  registerNtTextMessageHandler<T extends NTTextMessage["method"] | "any">(
    type: T,
    handler: (
      msg: T extends "any" ? NTTextMessage : NTTextMessage & { method: T },
    ) => void,
  ) {
    this.messageHandlers[type].push(handler as (msg: NTTextMessage) => void);
  }
  unregisterNtTextMessageHandler<T extends NTTextMessage["method"] | "any">(
    type: T,
    handler: (
      msg: T extends "any" ? NTTextMessage : NTTextMessage & { method: T },
    ) => void,
  ) {
    this.messageHandlers[type].splice(
      this.messageHandlers[type].indexOf(
        handler as (msg: NTTextMessage) => void,
      ),
      1,
    );
  }
  onNtTextMessage(msg: NTTextMessage) {
    this.messageHandlers[msg.method].forEach((it) => it(msg));
    this.messageHandlers["any"].forEach((it) => it(msg));
  }
  waitForNtTextMessage<M extends NTTextMessage["method"]>(
    method: M,
  ): Promise<NTTextMessage & { method: M }> {
    return new Promise((res) => {
      const handler = (msg: NTTextMessage & { method: M }) => {
        res(msg);
        this.unregisterNtTextMessageHandler(method, handler)
      };
      this.messageHandlers[method].push(
        handler as (msg: NTTextMessage) => void,
      );
    });
  }
  sendNtMessage(ntMessage: NTTextMessage | NTTextMessage[]) {
    if (!(ntMessage instanceof Array)) ntMessage = [ntMessage];
    this.ws.send(JSON.stringify(ntMessage));
  }
  subscriptions: {
    [topicId: number]: ((val: NTToTypescriptType<NTTextType>) => void)[];
  } = {};
  async subscribe(
    topic: string,
    onValueChange: (val: NTToTypescriptType<NTTextType>) => void,
    options: Omit<NTSubscriptionOptions, "prefix"> = {},
  ): Promise<() => void> {
    const subuid = this.subuidCounter++;
    console.log("Subscribing", subuid, "to topic", topic, "\n", options);
    const announce = this.waitForNtTextMessage("announce");
    this.sendNtMessage({
      method: "subscribe",
      params: { topics: [topic], subuid, options },
    } as NTC2SSubscribeMessage);
    const topicId = (await announce).params.id;
    this.subscriptions[topicId] ??= [];
    console.log("Subscribing", subuid, "to topic id", topicId);
    this.subscriptions[topicId].push(onValueChange);
    return () => {
      this.sendNtMessage({
        method: "unsubscribe",
        params: { subuid },
      } as NTC2SUnsubscribeMessage);
      this.subscriptions[topicId].splice(
        this.subscriptions[topicId].indexOf(onValueChange),
        1,
      );
    };
  }
  async subscribePrefix(
    prefix: string,
    onValueChange: (val: NTToTypescriptType<NTTextType>) => void,
    options: Omit<NTSubscriptionOptions, "prefix"> = {},
  ): Promise<() => void> {}
  topic<T extends NTTextType>(type: T, path: string): NetworkTablesTopic<T> {
    return new NetworkTablesTopic(this, path, type);
  }
}

export class NetworkTablesTopic<T extends NTTextType> {
  nt: NetworkTables;
  path: string;
  constructor(nt: NetworkTables, path: string, type: T) {
    this.nt = nt;
    this.path = path;
  }
  subscribe(
    cb: (val: NTToTypescriptType<T>) => void,
    opt?: NTSubscriptionOptions,
  ) {}
}
