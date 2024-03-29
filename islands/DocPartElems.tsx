import { JSX, Fragment } from "preact"

import tokenize from "../hooks/useTokenize.ts"
import { type ShjLanguage } from "../hooks/useTokenize.ts"
import multiRegReplacer from "../hooks/useMultiReplace.tsx"
import { ClassPropertyDef, ClassMethodDef, ClassConstructorDef, JsDocTagParam } from "../types.ts"


export default function DocPartElems(props:{
  attrType: "Class"|"Constructor"|"Method"|"Property",
  data: ClassPropertyDef | ClassMethodDef | ClassConstructorDef,
  codeLang: ShjLanguage,
  paragraphHandler: (elems:Array<JSX.Element|string>) => JSX.Element,
  listItemHandler:  (name:string, text_elems:Array<JSX.Element|string>) => JSX.Element,
  hideLineNumbers?: true,
}){
  const { attrType, data, codeLang,
        paragraphHandler, listItemHandler, hideLineNumbers } = props
  if (!data.jsDoc?.doc){
    return (<></>)
  }

  const text = data.jsDoc.doc
  const parts = (!text.includes("```"))
    ? [{text, is_codeElem: false}]
    : text.split("```").map((t, idx) => {
        return { text: t.trim(), is_codeElem: idx % 2 == 1 }
      })

  const params = data?.jsDoc?.tags
      ? data.jsDoc.tags.filter(d => d.kind == "param") as Array<JsDocTagParam>
      : []

  const headname = (attrType == "Method") || (params.length > 0)
    ? `${data.name}( ${params.map(d => d.name+(d.doc?.startsWith("Optional") ? "?" : "")).join(", ")} )`
    : data.name

  const innerTextHandler = (text: string) => {
    if (text == ""){ return [text] }
    try {
      return multiRegReplacer(text, [
        { reg: /`(.+?)`/g,
          toFunc: (mt) => <code class="text-sm bg-[#f0f0f0] font-hira px-0.5 rounded">{mt[1]}</code>},
        { reg: /(True|true|False|false|Null|null)/g,
          toFunc: (mt) => <code class="text-sm bg-[#f0f0f0] font-hira px-0.5 rounded">{mt[1]}</code> },
        { reg: /^Optional/g,
          toFunc: (_mt) => <span class="text-emerald-700">Optional</span>},
        { reg: /(String|string|Number|number|Integer|integer|Boolean|boolean)/g,
          toFunc: (mt) => <span class="text-purple-700">{mt[1]}</span>},
        { reg: /(Default|default|Returns|returns)/g,
          toFunc:  (mt) => <span class="text-rose-700">{mt[1]}</span>}
      ])  
    } catch (error) {
      console.error(`multiRegReplacer failed for ${data.name}`)
      return [text]
    }
  }
  
  const color_dic: {[k in "Class"|"Constructor"|"Method"|"Property"]: string} = {
    Class: "text-lime-600",
    Constructor: "text-orange-600",
    Method: "text-sky-600",
    Property: "text-purple-600"
  }

  return (
    <Fragment>
       <div class="flex gap-4 font-semibold mb-1">
        <span class={color_dic[attrType]}>{attrType}</span>
        <span>{headname}</span>
      </div>
      {parts.map(d => d.is_codeElem
        ? <CodePart {...{htmlText: tokenize(d.text, codeLang).trim(), hideLineNumbers}}/>
        : <Fragment>
          {d.text.split("\n").map(tx => {
            if (tx.startsWith("-")){
              const t = tx.replace("- ", "")
              const [name, text] = t.includes("：") ? t.split("：")
                : t.includes(",") ? t.split(",")
                : ["", t]
              return listItemHandler(name, innerTextHandler(text))
            } else {
              return paragraphHandler(innerTextHandler(tx))
            }
          })}
        </Fragment>
      )}
      { params.length == 0
        ? <></>
        : <Fragment>
            <span class="text-neutral-400 font-bold mt-2 -mb-3">Parameters</span>
            <ul class="list-disc mt-1">
              {params.map(d => <li class="flex gap-3 py-1 ml-2">
                <span class="font-semibold min-w-[5rem] pt-px shrink-0">{d.name}</span>
                <p>
                  {d.doc ? innerTextHandler(d.doc) : <></>}
                </p>
              </li>)}
            </ul>
          </Fragment>
      }
    </Fragment>
  )
}


function CodePart(props:{
  htmlText: string,
  hideLineNumbers?: true,
}) {
  const { htmlText, hideLineNumbers } = props
  return (
    <div class="shj-lang-js" style={{marginTop:"4px", marginBottom:"4px"}}>
      <div class="flex">
        <div class="shj-numbers">
          { hideLineNumbers
            ? <></>
            : [...Array(htmlText.split('\n').length)].map(_x => <div></div>) }
        </div>
        <p>
          {htmlText.split("\n").map(
            txt => <p dangerouslySetInnerHTML={{__html: txt !== "" ? txt : "　"}}></p>
          )}
        </p>
      </div>
    </div>
  )
}