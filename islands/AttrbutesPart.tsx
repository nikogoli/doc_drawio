import { Ref } from "preact"

import ListItemElem from "./ListItemElem.tsx"
import { ClassPropertyDef, ClassMethodDef, ClassConstructorDef } from "../types.ts"


export default function AttributesPart(props:{
  data_type: "properties" | "methods" | "constructors",
  datas: Array<ClassPropertyDef> | Array<ClassMethodDef> | Array<ClassConstructorDef>,
  check_ref: Ref<HTMLInputElement>,
}){
  const { data_type, datas, check_ref } = props
  const sorted = datas.sort((a,b) => a.name.localeCompare(b.name))
  return(
    <div class="overflow-y-scroll pr-2">
      <input type="checkbox" class="hidden peer" name={data_type}
            checked={data_type=="properties"} ref={check_ref} />
      <div class="peer-checked:flex flex-col gap-5 hidden">
        <span class="text-gray-500 font-bold">{data_type.toLocaleUpperCase()}</span>
        {sorted.map(data => <ListItemElem {...{data_type, data}} />
        )}
      </div>
    </div>
  )
}