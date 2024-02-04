import { ComponentProps } from "preact"
import { useEffect } from "preact/hooks"

import AttrPart from "./AttrPart.tsx"
import DocPartElems from "./DocPartElems.tsx"
import ChangeClassButton from "./ChangeClassButton.tsx"
import { StateData, ClassPropertyDef, ClassMethodDef } from "../types.ts"


export default function Page(props: StateData) {
  const { name } = props.node_data

  useEffect(() => {
    sessionStorage.setItem("button_on_type", "Properties")
  }, [])
  
  return (
    <div class="h-screen w-full p-6 font-magic flex">
      <div class="h-full flex flex-col gap-6 w-full relative">
        <ChangeClassButton current={name} />
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
  const innerTextHandler = (text:string, is_code:boolean) => is_code
    ? <code class="text-sm bg-[#f0f0f0] font-hira px-0.5 rounded">{text}</code>
    : <span>{text}</span>

  const first_texts = props.data.jsDoc?.doc?.split("\n")[0] ?? ""
  const para_elems = first_texts.split("`").map((text, idx) => innerTextHandler(text,idx % 2 == 1))
  const not_bt = ["mxGraph"].includes(props.name)

  return(
    <div class="h-fit flex flex-col gap-2 text-lg">
      <div class="flex gap-4 font-semibold mb-1">
        <span class="text-lime-600">Class</span>
        <span>{props.name}</span>
      </div>
      { not_bt == false
        ? <ButtonWithPop popovertarget={`pop_cls_${props.name}`} popovertargetaction="show"
                          class="p-1 w-full hover:bg-lime-100">
            <p class=" text-nowrap overflow-hidden text-ellipsis">
              {para_elems}
            </p>
          </ButtonWithPop>
        : <p class=" text-nowrap overflow-hidden text-ellipsis">
            {para_elems}
          </p>
      }
      { not_bt
        ? <></>
        : <DivWithPop id={`pop_cls_${props.name}`} popover="auto"
                        class="w-[87%] max-h-[90%] overflow-y-scroll rounded">
            <div class="flex flex-col gap-2.5 p-6">
              <DocPartElems {...{
                attrType: "Class",
                data: props.data,
                codeLang: "js",
                paragraphHandler: (elems) => <p>{elems}</p>,
                listItemHandler: (name, text_elems) => (
                  <div class="flex gap-2">
                    <p class="flex gap-1 font-semibold">
                      <span>・</span><span>{name+"："}</span>
                    </p>
                    <p>{text_elems}</p>
                  </div>)
              }} />
            </div>
          </DivWithPop>
      }
    </div>
  )
}


const ButtonWithPop = (props:ComponentProps<"button">&{
  popovertarget:string,
  popovertargetaction?: "show"|"hide"
}) => <button {...props}/>


const DivWithPop = (props:ComponentProps<"div">&{
  popover: "auto"|"manual",
}) => <div {...props}/>