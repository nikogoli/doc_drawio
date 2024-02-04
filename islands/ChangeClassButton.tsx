import { ComponentProps } from "preact"

import IconListSearch from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/list-search.tsx"
import { CLASSNAMES } from "../types.ts"

export default function ChangeClassButton(props: {
  current: string
}) {
  const { current } = props
  const base = "p-2 rounded-lg text-lg text-center "
  const cls_a = base + "bg-neutral-100 hover:bg-lime-100"
  const cls_sp = base + "bg-amber-100"
  
  return (
    <div class="absolute top-0 right-2">
      <ButtonWithPop popovertarget={`pop_changecls`} popovertargetaction="show"
          class="p-1 rounded-lg bg-neutral-100 text-neutral-500">
        <IconListSearch />
      </ButtonWithPop>
      <DivWithPop id="pop_changecls" popover="auto"
                  class="w-[80%] max-h-[80%] min-h-[40%] overflow-y-scroll rounded">
          <div class="grid grid-cols-4 gap-4 p-6">
            { CLASSNAMES.map(name => name == current
                ? <span class={cls_sp}>{name}</span>
                : <a href={`/page/${name}`} class={cls_a}>{name}</a>
              ) }
          </div>
      </DivWithPop>
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