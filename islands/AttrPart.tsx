import { JSX } from "preact"
import { useRef } from "preact/hooks"

import IconSearch from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/search.tsx"

import AttributesPart from "../islands/AttrbutesPart.tsx"
import { StateData } from "../types.ts"


export default function AttrPart(props:StateData){
  const { properties, methods, constructors } = props.node_data.classDef
  const check_ref_p = useRef<HTMLInputElement>(null)
  const check_ref_m = useRef<HTMLInputElement>(null)
  const check_ref_c = useRef<HTMLInputElement>(null)

  const get_ref = (arg:"Properties"|"Methods"|"Constructors") => arg == "Properties"
    ? check_ref_p
    : arg == "Methods" ? check_ref_m
    : check_ref_c

  const bt_func = (
    ev:JSX.TargetedMouseEvent<HTMLButtonElement>,
    current_bt: "Properties"|"Methods"|"Constructors",
  ) => {
    const prev_bt = sessionStorage.getItem("button_on_type") as "Properties"|"Methods"|"Constructors"
    if (prev_bt == current_bt){ return }
    const prev_bt_elem = document.querySelector<HTMLElement>(`button[name="${prev_bt}"]`)!
    ev.currentTarget.style.cssText = 'background-color: white;'
    prev_bt_elem.style.cssText = ""
    get_ref(prev_bt).current!.click()
    get_ref(current_bt).current!.click()
    sessionStorage.setItem("button_on_type", current_bt)
  }

  return(
    <div class="flex flex-col gap-2 min-h-0">
      <div class="flex justify-between">
        <div class="flex gap-4 rounded bg-neutral-200 p-1 w-fit">
          { (["Properties", "Methods", "Constructors"] as const).map((nm, idx) =>
            <button onClick={ev => bt_func(ev, nm)} name={nm}
              style={idx == 0 ? {backgroundColor:"white"} : {}}
              class={`rounded "bg-neutral-200 w-40 text-center`}
            >{nm}</button>)
          }
        </div>
        <div class="flex gap-4 px-2 rounded-xl bg-[#f0f0f0] mr-6">
          <IconSearch class="self-center text-neutral-500"/>
          <input type="search" class="bg-inherit focus:outline-none"
             onInput={ev => {
                const input = ev.currentTarget.value
                document.querySelectorAll<HTMLDivElement>(`div[name^="item_"]`).forEach(el => {
                  const name = el.getAttribute("name")
                  if (input == "" || (name && name.includes(input))){ el.style.cssText = "" }
                  else { el.style.cssText = "display: none;" }
                })
              }}  />
        </div>
      </div>
      <div class="p-4 rounded-lg border flex flex-col h-[90%]">
        <AttributesPart {...{data_type:"properties", datas: properties, check_ref:check_ref_p}}/>
        <AttributesPart {...{data_type:"methods", datas: methods, check_ref:check_ref_m}}/>
        <AttributesPart {...{data_type:"constructors", datas: constructors, check_ref:check_ref_c}}/>
      </div>
    </div>
  )
}