import {
  type DocNodeClass,
  type ClassPropertyDef,
  type ClassMethodDef,
  type ClassConstructorDef,
  type JsDocTagParam,
} from "https://deno.land/x/deno_doc@0.94.0/types.d.ts"

export {
  type ClassPropertyDef,
  type ClassMethodDef,
  type ClassConstructorDef,
  type JsDocTagParam
}

export type StateData = {
  name: string,
  node_data: DocNodeClass,
}

export const CLASSNAMES = [
  "mxClient",
  "mxGraph",
  "mxGraphModel",
  "mxResources",
]