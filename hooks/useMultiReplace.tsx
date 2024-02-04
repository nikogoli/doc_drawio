import { JSX } from "preact";


type Item = {
  idx: number,
  match: RegExpMatchArray|null,
  reg: RegExp,
  toFunc: (mt:RegExpMatchArray) => JSX.Element,
}


export default function multiRegReplacer(
  text:string,
  Regs:Array<{reg:RegExp, toFunc:(mt:RegExpMatchArray) => JSX.Element}>
){
  const out_list: Array<string|JSX.Element> = []
  let i = 0
  const items: Array<Item> = Regs.map(
    d => {return {idx:-1, match:null, reg: d.reg, toFunc: d.toFunc}}
  )

  while(i <= text.length-1){
    items.forEach(item => {
      if (item.idx != -1 && item.match === null){ return }
      else if (item.idx > i){ return }
      item.reg.lastIndex = i
      const match = item.reg.exec(text)
      item.match = match
      item.idx = match?.index ?? Math.max(item.idx, 0)
    })
    const oks = items.filter(d => d.match !== null)
    if (oks.length == 0){
      break
    }
    //oks.forEach(item => console.log(item))
    const first = oks.toSorted((a,b) => a.idx - b.idx).at(0)!
    out_list.push(text.slice(i, first.idx))
    out_list.push(first.toFunc(first.match!))
    i = first.idx + first.match![0].length
    //console.log({i})
    //prompt()
  }
  out_list.push(text.slice(i, text.length))
  return out_list
}