import { JSX, Fragment } from "preact"

import tokenize from "../hooks/useTokenize.ts"
import { type ShjLanguage } from "../hooks/useTokenize.ts"
import { ClassPropertyDef, ClassMethodDef, ClassConstructorDef, JsDocTagParam } from "../types.ts"


export default function DocPartElems(props:{
  attrType: "Class"|"Constructor"|"Method"|"Property",
  data: ClassPropertyDef | ClassMethodDef | ClassConstructorDef,
  codeLang: ShjLanguage,
  paragraphHandler: (elems:Array<JSX.Element>) => JSX.Element,
  innerTextHandler: (text:string, is_code:boolean) => JSX.Element,
  listItemHandler:  (name:string, text_elems:Array<JSX.Element>) => JSX.Element,
  hideLineNumbers?: true,
}){
  const { attrType, data, codeLang,
        paragraphHandler, innerTextHandler, listItemHandler, hideLineNumbers } = props
  if (!data.jsDoc?.doc){
    return (<></>)
  }

  const text = data.jsDoc.doc
  const parts = (!text.includes("```"))
    ? [{text, is_codeElem: false}]
    : text.split("```").map((t, idx) => {
        return { text: t.trimEnd(), is_codeElem: idx % 2 == 1 }
      })

  const params = data?.jsDoc?.tags
      ? data.jsDoc.tags.filter(d => d.kind == "param") as Array<JsDocTagParam>
      : []

  const headname = params.length > 0
    ? data.name + "( " + params.map(d => d.name).join(", ") + " )"
    : data.name

  const replacer = (ar: Array<string>) => ar.map((text, idx) => innerTextHandler(text,  idx % 2 == 1))
  
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
              const [name, text] = tx.replace("- ", "").split("：")
              return listItemHandler(name, replacer(text.split("`")))
            } else {
              return paragraphHandler(replacer(tx.split("`")))
            }
          })}
        </Fragment>
      )}
      { params.length == 0
        ? <></>
        : <ul class="list-disc mt-1">
            {params.map(d => <li class="flex gap-3 py-1">
              <span class="font-semibold min-w-[5rem] pt-px shrink-0">{d.name}</span>
              <p>
                {d.doc ? replacer(d.doc.split("`")) : <></>}
              </p>
            </li>)}
          </ul>
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