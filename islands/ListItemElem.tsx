import { ComponentProps } from "preact"

import DocPartElems from "./DocPartElems.tsx"
import { ClassPropertyDef, ClassMethodDef, ClassConstructorDef } from "../types.ts"


const ButtonWithPop = (props:ComponentProps<"button">&{
  popovertarget:string,
  popovertargetaction?: "show"|"hide"
}) => <button {...props}/>


const DivWithPop = (props:ComponentProps<"div">&{
  popover: "auto"|"manual",
}) => <div {...props}/>


export default function ListItemElem(props:{
  data_type: "properties" | "methods" | "constructors",
  data: ClassPropertyDef | ClassMethodDef | ClassConstructorDef,
}){
  const { data_type, data } = props
  const [totalCol, span1st, span2nd] = (data.name.length < 24)
    ? ["grid-cols-3", "col-span-1", "col-span-2"]
    : ["grid-cols-3 grid-row-2 gap-1", "col-span-2", "row-start-2 col-start-2 col-span-2"]

 
  const innerTextHandler = (text:string, is_code:boolean) => is_code
    ? <code class="text-sm bg-[#f0f0f0] font-hira px-0.5 rounded">{text}</code>
    : <span>{text}</span>


  const [first_texts, ...others] = data.jsDoc?.doc?.split("\n") ?? ["", ""]
  const para_elems = first_texts.split("`").map((text, idx) => innerTextHandler(text,idx % 2 == 1))
  const is_abst = (data_type == "methods") || others.length >= 1
  
  const type_dic:{[k in typeof data_type]: "Method"|"Property"|"Constructor"} = {
    methods: "Method", properties: "Property", constructors: "Constructor"
  }

  return(
    <div class={`grid ${totalCol}`} name={`item_${data.name.toLocaleLowerCase()}`}>
      <div class={`flex gap-3 items-center ${span1st}`}>
        { data_type == "properties" ? <CircleElemP />
          : data_type == "methods" ?  <CircleElemM />
          : <CircleElemC /> }
        { is_abst
          ? <ButtonWithPop popovertarget={`pop_${data.name}`} popovertargetaction="show"
                    class="font-hira font-medium text-sky-500">
              {data.name}
            </ButtonWithPop>
          : <span class="font-hira font-medium">{data.name}</span> }
      </div>
      <p class={span2nd + (is_abst ? " text-nowrap overflow-hidden text-ellipsis" : "")}>
        {para_elems}
      </p>
      {is_abst
        ? <DivWithPop id={`pop_${data.name}`} popover="auto"
                class="w-[87%] max-h-[90%] overflow-y-scroll rounded">
            <div class="flex flex-col gap-2.5 p-6">
              <DocPartElems {...{
                attrType: type_dic[data_type],
                data: data,
                codeLang: "js",
                paragraphHandler: (elems) => <p class="">{elems}</p>,
                innerTextHandler: (text, is_code) => is_code
                    ? <code class="text-sm bg-[#f0f0f0] font-hira px-0.5 rounded">{text}</code>
                    : <span>{text}</span>,
                listItemHandler: (name, text_elems) => (
                  <div class="flex gap-2">
                    <p class="min-w-[6rem] shrink-0 flex gap-1 font-semibold">
                      <span>・</span><span>{name}</span>
                    </p>
                    <p>{text_elems}</p>
                  </div>)
              }} />
            </div>
          </DivWithPop>
        : <></>}
    </div>
  )
}


const CircleElemP = () => 
  <div class="bg-purple-100 rounded-xl w-6 h-6 grid place-content-center">
    <span class="text-purple-500 mb-1 text-base">p</span>
  </div>


const CircleElemM = () =>
    <div class="bg-sky-100 rounded-xl w-6 h-6 grid place-content-center">
      <span class="text-sky-500 mb-1 text-base">m</span>
    </div>


const CircleElemC = () =>
<div class="bg-orange-100 rounded-xl w-6 h-6 grid place-content-center">
  <span class="text-orange-500 mb-1 text-base">c</span>
</div>