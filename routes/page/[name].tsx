import { useEffect } from "preact/hooks"
import { Handlers, PageProps } from "$fresh/server.ts"
import { Head } from "$fresh/runtime.ts"

import Page from "../../islands/Page.tsx"
import { StateData, ClassPropertyDef, ClassMethodDef } from "../../types.ts"


export const handler: Handlers<StateData> = {
  async GET(req, ctx) {
    const name = req.url.split("/").at(-1)!
    const node_data = await Deno.readTextFile(`./static/denoDoc_${name}.json`)
      .then(tx => JSON.parse(tx))
      .then(list => list[0]) as StateData["node_data"]
    //const node_data = await fetch(`/denoDoc_${name}.json`).then(res => res.json()) as StateData["node_data"]
    return ctx.render({ name, node_data });
  },
}


export default function MyPage(props: PageProps<StateData>) {
  return (
    <>
      <Head>
        <title>{props.data.name}</title>
        <link
          href="https://unpkg.com/@speed-highlight/core/dist/themes/visual-studio-dark.css"
          rel="stylesheet"></link>
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap"
          rel="stylesheet"></link>
        <style>{`
          .text-nowrap {text-wrap: nowrap;}
          .font-hira {font-family: 'Fira Code'}
          ::backdrop { background-color: black; opacity: 0.6;}
        `}</style>
      </Head>
      <Page {...props.data}/>
    </>
  )
}