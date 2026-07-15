import { EMPTY, filter, fromEvent, skip, switchMap } from "rxjs";
import "../drag-and-drop";
import "../editor-toolbar";
import "../nt-checkbox";
import "../nt-string";
import "../nt-int";
import "../nt-value";
import "../connection-state";
import "../edit-menu";
import "../add-dialog";
import "../configure-dialog";
import "../address-input";
import templateRaw from "./template.html?raw";
import $template from "../template.ts";
const template = $template(templateRaw);
import defaultLayout from "./defaultLayout.html?raw";
import { createNtValue } from "../nt-value";
import type { DragAndDropElement } from "../drag-and-drop";
function getTopMostParentOf(
  element: HTMLElement,
  container: HTMLElement,
): HTMLElement | null {
  let current: HTMLElement | null = element;

  while (current && current.parentElement !== container) {
    current = current.parentElement as HTMLElement | null;
  }

  return current;
}
function serializeDnd(dnd: DragAndDropElement): string {
  return dnd.innerHTML;
}
function deserializeDnd(dnd: DragAndDropElement, s: string) {
  dnd.innerHTML = s;
}
export function mountApp() {
  document.body.appendChild(template.content.cloneNode(true));
  const dnd = document.body.querySelector("drag-and-drop")!;
  if (localStorage.getItem("saved-layout")) {
    deserializeDnd(dnd, localStorage.getItem("saved-layout")!);
  } else {
    deserializeDnd(dnd, defaultLayout);
  }
  document.addEventListener("mouseup", (e) => {
    if (e.button != 0) return;
    const serialized = serializeDnd(dnd);
    console.log("Serialized dnd:", serialized);
    localStorage.setItem("saved-layout", serialized);
  });
  const toolbar = document.body.querySelector("editor-toolbar")!;
  toolbar.tool$.subscribe((it) => {
    document.body.classList.remove("mode:select", "mode:interact", "mode:add");
    document.body.classList.add("mode:" + it);
  });
  toolbar.tool$.subscribe((it) => {
    dnd.enableDragging = it == "select";
  });
  toolbar.tool$
    .pipe(
      switchMap((tool) =>
        tool === "add"
          ? fromEvent<PointerEvent>(document.body, "click").pipe(skip(1))
          : EMPTY,
      ),
      filter(() => document.querySelectorAll("add-dialog").length < 1),
    )
    .subscribe((e) => {
      function addNewElement(el: HTMLElement) {
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
        dnd.appendChild(el);
      }
      const dialog = document.createElement("add-dialog");
      dialog.addEventListener("add-element", ({ detail: element }) => {
        if ("topic" in element) {
          switch (element.type) {
            case "boolean": {
              addNewElement(
                createNtValue(element.topic, element.type, "nt-checkbox"),
              );
              break;
            }
            case "string": {
              addNewElement(
                createNtValue(element.topic, element.type, "nt-string"),
              );
              break;
            }
            case "int": {
              addNewElement(
                createNtValue(element.topic, element.type, "nt-int"),
              );
              break;
            }
            default: {
              alert("TODO: Unsupported NetworkTables type: " + element.type);
            }
          }
        } else {
          switch (element.element) {
            case "connection-state": {
              addNewElement(document.createElement("connection-state"));
              break;
            }
            case "label": {
              const p = document.createElement("p");
              p.textContent = "Label";
              p.classList.add("dummy-label");
              addNewElement(p);
              break;
            }
            case "force-reconnect": {
              const button = document.createElement("button");
              button.textContent = "Reconnect";
              button.setAttribute("onclick", "nt.disconnect(false)");
              addNewElement(button);
              break;
            }
            case "address-input": {
              addNewElement(document.createElement("address-input"));
              break;
            }
            default: {
              alert(`TODO: add custom element: ${element.element}`);
            }
          }
        }
      });
      document.body.appendChild(dialog);
    });
  toolbar.tool$
    .pipe(
      switchMap((tool) =>
        tool === "select"
          ? fromEvent<PointerEvent>(document.body, "contextmenu")
          : EMPTY,
      ),
    )
    .subscribe((e) => {
      e.preventDefault();
      document.querySelectorAll("edit-menu").forEach((it) => it.remove());
      const editTarget = getTopMostParentOf(e.target as HTMLElement, dnd);
      const contextMenu = document.createElement("edit-menu");
      contextMenu.setAttribute("element", editTarget!.nodeName.toLowerCase());
      contextMenu.style.left = `${e.clientX}px`;
      contextMenu.style.top = `${e.clientY}px`;
      contextMenu.addEventListener("menu-delete", () => {
        editTarget?.remove();
      });
      contextMenu.addEventListener("menu-configure", () => {
        const configureDialog = document.createElement("configure-dialog");
        configureDialog.target = editTarget!;
        document.body.appendChild(configureDialog);
      });
      document.body.appendChild(contextMenu);
    });
}
