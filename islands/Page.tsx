import { useEffect } from "preact/hooks"

import AttrPart from "./AttrPart.tsx"
import DocPartElems from "./DocPartElems.tsx"
import { StateData, ClassPropertyDef, ClassMethodDef } from "../types.ts"


export default function Page(props: StateData) {
  const { name } = props.node_data

  useEffect(() => {
    sessionStorage.setItem("button_on_type", "Properties")
  }, [])
  
  return (
    <div class="h-screen w-full p-6 font-magic flex relative">
      <div class="h-full flex flex-col gap-6 w-full">
        <ClassPart {...{name, data: props.node_data as unknown as ClassPropertyDef}}/>
        <AttrPart {...props}/>
      </div>
    </div>
  )
}


function ClassPart(props:{
  name: string,
  data: ClassPropertyDef | ClassMethodDef,
}){
  return(
    <div class="h-fit flex flex-col gap-2 text-lg">
      <DocPartElems {...{
        attrType: "Class",
        data: props.data,
        codeLang: "js",
        paragraphHandler: (elems) => <p>{elems}</p>,
        innerTextHandler: (text, is_code) => is_code
            ? <code class="text-sm bg-[#f0f0f0] font-hira px-0.5 rounded">{text}</code>
            : <span>{text}</span>,
        listItemHandler: (name, text_elems) => (
          <div class="flex gap-2">
            <p class="flex gap-1 font-semibold">
              <span>・</span><span>{name+"："}</span>
            </p>
            <p>{text_elems}</p>
          </div>)
      }} />
    </div>
  )
}