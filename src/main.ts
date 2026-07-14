import { debounce, debounceTime, filter, fromEvent, map } from 'rxjs'
import { NetworkTables, type NTTopicType } from './nt'
import './style.css'

const knobs = document.getElementById("knobs") as HTMLDivElement
const addressField = document.getElementById("address") as HTMLInputElement
fromEvent(addressField, 'input').pipe(debounceTime(500), map(() => addressField.value), map(it => Number.isInteger(+it) ? +it : it))
const nt = new NetworkTables('127.0.0.1');
(window as unknown as any).nt = nt
nt.messages$.pipe(filter(it => it.method == 'announce')).subscribe(it => {
  const topic = it.params.name
  const type = it.params.type as NTTopicType
  const wrap = document.createElement('label')
  wrap.appendChild(document.createTextNode(topic))
  const observer = nt.subscribe<any>(topic)
  const publisher = nt.publish<any>(topic, 'string')
  const input = document.createElement('input')
  wrap.appendChild(input)
  switch (type) {
    case "string": {
      observer.subscribe(it => input.value = it)
      fromEvent(input, 'input').pipe(debounceTime(2000), map(() => input.value)).subscribe(it => publisher.next(it))
      break;
    }
    case "int": {
      observer.subscribe(it => input.value = it)
      input.type = 'number'
      fromEvent(input, 'input').pipe(debounceTime(2000), map(() => input.value)).subscribe(it => publisher.next(it))
      break;
    }
    case "boolean": {
      observer.subscribe(it => input.checked = it)
      input.type = 'checkbox'
      fromEvent(input, 'click').pipe(debounceTime(500), map(() => input.checked)).subscribe(it => publisher.next(it))
      break;
    }
    default: {
      input.readOnly = true
      observer.subscribe(it => input.value = JSON.stringify(it))
    }
  }
  wrap.appendChild(document.createTextNode(`(${type})`))
  knobs.appendChild(wrap)
  knobs.appendChild(document.createElement('br'))
})
const forceDisconnect = document.getElementById("force-disconnect")!
forceDisconnect.addEventListener('click', () => {
  knobs.replaceChildren()
  nt.disconnect(false)
})

nt.connectionState$.pipe(filter(it => it == 'connected')).subscribe(() => {
  nt.sendFrame({ method: 'subscribe', params: { topics: ['/'], subuid: nt.subscriberCounter++, options: { prefix: true, topicsonly: true } } })
})
nt.connect()