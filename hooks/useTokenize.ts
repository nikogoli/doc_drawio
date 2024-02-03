
// definition of 'LANG' is in the bottom.

// ignore: 'leanpub-md', 'html' & "innner-code"s of some langs such as 'http' and 'md'
export type ShjLanguage = 'asm'|'bash'|'bf'|'c'|'css'|'csv'|'diff'|'docker'|'git'|'go'|'http'|'ini'|'java'|'js'|'jsdoc'|'json'|'log'|'lua'|'make'|'md'|'pl'|'plain'|'py'|'regex'|'rs'|'sql'|'todo'|'toml'|'ts'|'uri'|'xml'|'yaml'

type ShjLanguageComponent =  {
  match: RegExp, type: string, sub?: undefined
} | {
  match: RegExp, type?: string, sub: ShjLanguage | ShjLanguageDefinition | ((code:string) => ShjLanguageComponent)
} | {
  expand: string
}

type ShjLanguageComponentForMatch = Extract<ShjLanguageComponent, {match: RegExp}> &
  {cached: RegExpExecArray | null, is_end: boolean}

type ShjLanguageDefinition = Array<ShjLanguageComponent>

const expandData: Record<string, Extract<ShjLanguageComponent, {type:string}>> = {
  num: {
    type: 'num',
    match: /(\.e?|\b)\d(e-|[\d.oxa-fA-F_])*(\.|\b)/g,
  },
  str: {
    type: 'str',
    match: /(["'])(\\[^]|(?!\1)[^\r\n\\])*\1?/g,
  },
  strDouble: {
    type: 'str',
    match: /"((?!")[^\r\n\\]|\\[^])*"?/g,
  }
}



function sanitize(str:string){
  return str.replaceAll('&', '&#38;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}


export default function tokenize(
  src: string,
  lang: ShjLanguage | ShjLanguageComponent,
  debug?: true,
) {
  const langData = typeof lang == "string" ? LANGS[lang] : [lang]
  const components: Array<ShjLanguageComponentForMatch> = langData.map(d => {
    return "expand" in d
      ? {...expandData[d.expand], cached: null, is_end: false}
      : {...d, cached: null, is_end: false}
  })

  let html_text = ""
  let i = 0
  while (i < src.length) {
    let firstMatch: null | ShjLanguageComponentForMatch = null
    components.forEach(comp => {
      if (comp.is_end){ return }

      let match: RegExpExecArray | null = comp.cached
      if (!comp.cached || comp.cached.index <= i){
        if (comp.cached && comp.cached.index <= i){
          comp.match.lastIndex = i
        }
        match = comp.match.exec(src)
        if (match){
          comp.cached = match
          comp.match.lastIndex = match.index + match[0].length
        } else {
          comp.is_end = true
        }
      }
      if (debug && match){ console.log(match, comp.match.lastIndex, comp.match) }
      if (match &&
          (firstMatch == null || match.index <= firstMatch.cached!.index) &&
          match[0] !== "//" // ignore a match to opertor for a match to comment
        ){
        firstMatch = comp
      }
    })
    if (firstMatch){
      const { match, sub, type, cached } = (firstMatch as ShjLanguageComponentForMatch)
      if (debug){ console.log({type}) }
      html_text += sanitize(src.slice(i, cached!.index))
      
      if (sub){
        const lang = (typeof sub === 'string') ? sub
          : (typeof sub === 'function') ? sub(cached![0])
          : firstMatch as ShjLanguageComponentForMatch
        html_text += tokenize(cached![0], lang)
      } else {
        html_text += `<span class="shj-syn-${type}">${sanitize(cached![0])}</span>`
      }
      i = match.lastIndex
      if (debug){ console.log({i}) }
    } else {
      break
    }
  }
  html_text += sanitize(src.slice(i, src.length))
  return html_text
}



const LANGS:Record<ShjLanguage, ShjLanguageDefinition> = {
  asm: [
    {type:"cmnt", match:/(;|#).*/gm},
    {expand:"str"}, {expand:"num"},
    {type:"num", match:/\$[\da-fA-F]*\b/g},
    {type:"kwd", match:/^[a-z]+\s+[a-z.]+\b/gm, sub:[{type:"func",match:/^[a-z]+/g}]},
    {type:"kwd", match:/^\t*[a-z][a-z\d]*\b/gm},
    {match:/%|\$/g,type:"oper"}
  ],
  bash: [
    {sub:"todo", match:/#.*/g},
    {type:"str", match:/(["'])((?!\1)[^\r\n\\]|\\[^])*\1?/g, sub:[{type:"var", match:/\$\w+|\${[^}]*}|\$\([^)]*\)/g}]},
    {type:"kwd", match:/-[a-zA-Z]+|$<|[&|;]+|\b(unset|readonly|shift|export|if|fi|else|elif|while|do|done|for|until|case|esac|break|continue|exit|return|trap|wait|eval|exec|then|declare|enable|local|select|typeset|time|add|remove|install|update|delete)\b/g},
    {expand:"num"},
    {type:"func", match:/\b(set|alias|bg|bind|builtin|caller|command|compgen|complete|dirs|disown|echo|enable|eval|exec|exit|fc|fg|getopts|hash|help|history|jobs|kill|let|logout|popd|printf|pushd|pwd|read|set|shift|shopt|source|suspend|test|times|trap|type|ulimit|umask|unalias|unset)\b/g},
    {type:"bool", match:/\b(true|false)\b/g},
    {type:"func", match:/[a-z_]+(?=\s*\()/g},
    {type:"oper", match:/[=(){}<>+*/!?~^-]+/g},
    {type:"var", match:/\w+(?=\s*=)/g},
    {type:"var", match:/\$\w+|\${[^}]*}|\$\([^)]*\)/g}
  ],
  bf: [
    {match:/[^\[\->+.<\]\s].*/g, sub:"todo"},
    {type:"func", match:/\.+/g},
    {type:"kwd", match:/[<>]+/g},
    {type:"oper", match:/[+-]+/g}
  ],
  c: [
    {match:/\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/g, sub:"todo"},   
   {expand:"str"},   
   {expand:"num"},   
   {type:"kwd", match:/#\s*include (<.*>|".*")/g, sub:[{type:"str", match:/(<|").*/g}]},   
   {match:/asm\s*{[^}]*}/g, sub:[{type:"kwd", match:/^asm/g},   
   {match:/[^{}]*(?=}$)/g, sub:"asm"}]},   
   {type:"kwd", match:/\*|&|#[a-z]+\b|\b(asm|auto|double|int|struct|break|else|long|switch|case|enum|register|typedef|char|extern|return|union|const|float|short|unsigned|continue|for|signed|void|default|goto|sizeof|volatile|do|if|static|while)\b/g},   
   {type:"oper", match:/[/*+:?&|%^~=!,<>.^-]+/g},   
   {type:"func", match:/[a-zA-Z_][\w_]*(?=\s*\()/g},   
   {type:"class", match:/\b[A-Z][\w_]*\b/g}
  ],
  css: [
    {match:/\/\*((?!\*\/)[^])*(\*\/)?/g, sub:"todo"}, 
    {expand:"str"}, 
    {type:"kwd", match:/@\w+\b|\b(and|not|only|or)\b|\b[a-z-]+(?=[^{}]*{)/g}, 
    {type:"var", match:/\b[\w-]+(?=\s*:)|(::?|\.)[\w-]+(?=[^{}]*{)/g}, 
    {type:"func", match:/#[\w-]+(?=[^{}]*{)/g}, 
    {type:"num", match:/#[\da-f]{3,8}/g}, 
    {type:"num", match:/\d+(\.\d+)?(cm|mm|in|px|pt|pc|em|ex|ch|rem|vm|vh|vmin|vmax|%)?/g, sub:[{type:"var", match:/[a-z]+|%/g}]}, 
    {match:/url\([^)]*\)/g, sub:[{type:"func", match:/url(?=\()/g}, {type:"str", match:/[^()]+/g}]}, 
    {type:"func", match:/\b[a-zA-Z]\w*(?=\s*\()/g}, 
    {type:"num", match:/\b[a-z-]+\b/g}
  ],
  csv: [
    {expand:"strDouble"},
    {type:"oper",match:/,/g}
  ],
  diff: [
    {type:"deleted", match:/^[-<].*/gm}, 
    {type:"insert", match:/^[+>].*/gm}, 
    {type:"kwd", match:/!.*/gm}, 
    {type:"section", match:/^@@.*@@$|^\d.*|^([*-+])\1\1.*/gm}
  ],
  docker: [
    {type:"kwd", match:/^(FROM|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/gmi},
    {sub:"todo", match:/#.*/g},
    {type:"str", match:/(["'])((?!\1)[^\r\n\\]|\\[^])*\1?/g, sub:[{type:"var", match:/\$\w+|\${[^}]*}|\$\([^)]*\)/g}]},
    {type:"kwd", match:/-[a-zA-Z]+|$<|[&|;]+|\b(unset|readonly|shift|export|if|fi|else|elif|while|do|done|for|until|case|esac|break|continue|exit|return|trap|wait|eval|exec|then|declare|enable|local|select|typeset|time|add|remove|install|update|delete)\b/g},
    {expand:"num"},
    {type:"func", match:/\b(set|alias|bg|bind|builtin|caller|command|compgen|complete|dirs|disown|echo|enable|eval|exec|exit|fc|fg|getopts|hash|help|history|jobs|kill|let|logout|popd|printf|pushd|pwd|read|set|shift|shopt|source|suspend|test|times|trap|type|ulimit|umask|unalias|unset)\b/g},
    {type:"bool", match:/\b(true|false)\b/g},
    {type:"func", match:/[a-z_]+(?=\s*\()/g},
    {type:"oper", match:/[=(){}<>+*/!?~^-]+/g},
    {type:"var", match:/\w+(?=\s*=)/g},
    {type:"var", match:/\$\w+|\${[^}]*}|\$\([^)]*\)/g}
  ],
  git: [
    {match:/^#.*/gm, sub:"todo"},
    {expand:"str"},
    {type:"deleted", match:/^[-<].*/gm},
    {type:"insert", match:/^[+>].*/gm},
    {type:"kwd", match:/!.*/gm},
    {type:"section", match:/^@@.*@@$|^\d.*|^([*-+])\1\1.*/gm},
    {type:"func", match:/^(\$ )?git(\s.*)?$/gm},
    {type:"kwd", match:/^commit \w+$/gm}
  ],
  go: [
    {match:/\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/g, sub:"todo"},
    {expand:"str"},
    {expand:"num"},
    {type:"kwd", match:/\*|&|\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/g},
    {type:"func", match:/[a-zA-Z_][\w_]*(?=\s*\()/g},
    {type:"class", match:/\b[A-Z][\w_]*\b/g},
    {type:"oper", match:/[+\-*\/%&|^~=!<>.^-]+/g}
  ],
  http: [
    {type:"kwd", match:/^(GET|HEAD|POST|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH|PRI|SEARCH)\b/gm}, 
    {expand:"str"}, 
    {type:"section", match:/\bHTTP\/[\d.]+\b/g}, 
    {expand:"num"},
    {type:"oper", match:/[,;:=]/g}, 
    {type:"var", match:/[a-zA-Z][\w-]*(?=:)/g}
  ],
 ini: [
    {match:/(^[ \f\t\v]*)[#;].*/gm, sub:"todo"}, 
    {type:"str", match:/.*/g}, 
    {type:"var", match:/.*(?==)/g}, 
    {type:"section", match:/^\s*\[.+\]\s*$/gm}, 
    {type:"oper", match:/=/g}
  ],
  java: [
    {match:/\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/g, sub:"todo"}, 
    {expand:"str"}, 
    {expand:"num"}, 
    {type:"kwd", match:/\b(abstract|assert|boolean|break|byte|case|catch|char|class|continue|const|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|package|private|protected|public|requires|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|var|void|volatile|while)\b/g}, 
    {type:"oper", match:/[/*+:?&|%^~=!,<>.^-]+/g}, 
    {type:"func", match:/[a-zA-Z_][\w_]*(?=\s*\()/g}, 
    {type:"class", match:/\b[A-Z][\w_]*\b/g}
  ],
  js: [
    {match:/\/\*\*((?!\*\/)[^])*(\*\/)?/g, sub:"jsdoc"}, 
    {match:/\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/g, sub:"todo"}, 
    {expand:"str"}, 
    {type:"kwd", match:/=>|\b(this|set|get|as|async|await|break|case|catch|class|const|constructor|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|let|var|of|new|package|private|protected|public|return|static|super|switch|throw|throws|try|typeof|void|while|with|yield)\b/g}, 
    {match:/\/((?!\/)[^\r\n\\]|\\.)+\/[dgimsuy]*/g, sub:"regex"}, 
    {expand:"num"}, 
    {type:"num", match:/\b(NaN|null|undefined|[A-Z][A-Z_]*)\b/g}, 
    {type:"bool", match:/\b(true|false)\b/g}, 
    {type:"oper", match:/[/*+:?&|%^~=!,<>.^-]+/g}, 
    {type:"class", match:/\b[A-Z][\w_]*\b/g}, 
    {type:"func", match:/[a-zA-Z$_][\w$_]*(?=\s*((\?\.)?\s*\(|=\s*(\(?[\w,{}\[\])]+\)? =>|function\b)))/g}
  ],
  jsdoc: [
    {type:"kwd", match:/@\w+/g},
    {type:"class", match:/{[\w\s|<>,.@\[\]]+}/g},
    {type:"var", match:/\[[\w\s="']+\]/g},
    {type:"err", match:/\b(TODO|FIXME|DEBUG|OPTIMIZE|WARNING|XXX|BUG)\b/g},
    {type:"class", match:/\bIDEA\b/g},
    {type:"insert", match:/\b(CHANGED|FIX|CHANGE)\b/g},
    {type:"oper", match:/\bQUESTION\b/g}
  ],
  json: [
    {type:"var", match:/("|')?[a-zA-Z]\w*\1(?=\s*:)/g},
    {expand:"str"},
    {expand:"num"},
    {type:"num", match:/\bnull\b/g},
    {type:"bool", match:/\b(true|false)\b/g}
  ],
  log: [
    {type:"cmnt", match:/^#.*/gm},
    {expand:"strDouble"},
    {expand:"num"},
    {type:"err", match:/\b(err(or)?|[a-z_-]*exception|warn|warning|failed|ko|invalid|not ?found|alert|fatal)\b/gi},
    {type:"num", match:/\b(null|undefined)\b/gi},
    {type:"bool", match:/\b(false|true|yes|no)\b/gi},
    {type:"oper", match:/\.|,/g}
  ],
  lua: [
    {match:/^#!.*|--(\[(=*)\[((?!--\]\2\])[^])*--\]\2\]|.*)/g, sub:"todo"},
    {expand:"str"},
    {type:"kwd", match:/\b(and|break|do|else|elseif|end|for|function|if|in|local|not|or|repeat|return|then|until|while)\b/g},
    {type:"bool", match:/\b(true|false|nil)\b/g},
    {type:"oper", match:/[+*/%^#=~<>:,.-]+/g},
    {expand:"num"},
    {type:"func", match:/[a-z_]+(?=\s*[({])/g}
  ],
  make: [
    {match:/^\s*#.*/gm, sub:"todo"},
    {expand:"str"},
    {type:"oper", match:/[${}()]+/g},
    {type:"class", match:/.PHONY:/gm},
    {type:"section", match:/^[\w.]+:/gm},
    {type:"kwd", match:/\b(ifneq|endif)\b/g},
    {expand:"num"},
    {type:"var", match:/[A-Z_]+(?=\s*=)/g},
    {match:/^.*$/gm, sub:"bash"}
  ],
  md: [
    {type:"cmnt",match:/^>.*|(=|-)\1+/gm},
    {type:"class",match:/\*\*((?!\*\*).)*\*\*/g},
    {type:"str",match:/`[^`]*`/g},
    {type:"var",match:/~~((?!~~).)*~~/g},
    {type:"kwd",match:/_[^_]*_|\*[^*]*\*/g},
    {type:"kwd",match:/^\s*(\*|\d+\.)\s/gm},
    {type:"oper",match:/\[[^\]]*]/g},
    {type:"func",match:/\([^)]*\)/g}
  ],
  pl: [
    {match:/#.*/g, sub:"todo"},
    {type:"str", match:/(["'])(\\[^]|(?!\1)[^])*\1?/g},
    {expand:"num"},
    {type:"kwd", match:/\b(any|break|continue|default|delete|die|do|else|elsif|eval|for|foreach|given|goto|if|last|local|my|next|our|package|print|redo|require|return|say|state|sub|switch|undef|unless|until|use|when|while|not|and|or|xor)\b/g},
    {type:"oper", match:/[-+*/%~!&<>|=?,]+/g},
    {type:"func", match:/[a-z_]+(?=\s*\()/g}
  ],
  plain: [{expand:"strDouble"}],
  py: [
    {match:/#.*/g, sub:"todo"},
    {match:/("""|''')(\\[^]|(?!\1)[^])*\1?/g, sub:"todo"},
    {type:"str", match:/f("|')(\\[^]|(?!\1).)*\1?|f((["'])\4\4)(\\[^]|(?!\3)[^])*\3?/gi, sub:[{type:"var", match:/{[^{}]*}/g, sub:[{match:/(?!^{)[^]*(?=}$)/g, sub:"py"}]}]},
    {expand:"str"},
    {type:"kwd", match:/\b(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g},
    {type:"bool", match:/\b(False|True|None)\b/g},
    {expand:"num"},
    {type:"func", match:/[a-z_]+(?=\s*\()/g},
    {type:"oper", match:/[-/*+<>,=!&|^%]+/g},
    {type:"class", match:/\b[A-Z][\w_]*\b/g}
  ],
  regex: [
    {match:/^(?!\/).*/gm, sub:"todo"},
     {type:"num", match:/\[((?!\])[^\\]|\\.)*\]/g},
     {type:"kwd", match:/\||\^|\$|\\.|\w+($|\r|\n)/g},
     {type:"var", match:/\*|\+|\{\d+,\d+\}/g}
  ],
  rs: [
    {match:/\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/g, sub:"todo"},
    {expand:"str"},
    {expand:"num"},
    {type:"kwd", match:/\b(as|break|const|continue|crate|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|async|await|dyn|abstract|become|box|do|final|macro|override|priv|typeof|unsized|virtual|yield|try)\b/g},
    {type:"oper", match:new RegExp("[/*+:?&|%^~=!,<>.^-]+", "g")},
    {type:"class", match:/\b[A-Z][\w_]*\b/g},
    {type:"func", match:/[a-zA-Z_][\w_]*(?=\s*!?\s*\()/g}
  ],
  sql: [
    {match:/--.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/g, sub:"todo"},
    {expand:"str"},
    {type:"func", match:/\b(AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/g},
    {type:"kwd", match:/\b(ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|kwdS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:S|ING)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/g},
    {type:"num", match:/\.?\d[\d.oxa-fA-F-]*|\bNULL\b/g},
    {type:"bool", match:/\b(TRUE|FALSE)\b/g},
    {type:"oper", match:/[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|IN|ILIKE|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/g},
    {type:"var", match:/@\S+/g}
  ],
  todo: [
    {type:"err", match:/\b(TODO|FIXME|DEBUG|OPTIMIZE|WARNING|XXX|BUG)\b/g},
    {type:"class", match:/\bIDEA\b/g},
    {type:"insert", match:/\b(CHANGED|FIX|CHANGE)\b/g},
    {type:"oper", match:/\bQUESTION\b/g},
    {type:"cmnt", match:/.+/g},
  ],
  toml: [
    {match:/#.*/g, sub:"todo"},
    {type:"str", match:/("""|''')((?!\1)[^]|\\[^])*\1?/g},
    {expand:"str"},
    {type:"section", match:/^\[.+\]\s*$/gm},
    {type:"num", match:/\b(inf|nan)\b|\d[\d:ZT.-]*/g},
    {expand:"num"},
    {type:"bool", match:/\b(true|false)\b/g},
    {type:"oper", match:/[+,.=-]/g},
    {type:"var", match:/\w+(?= \=)/g}
  ], 
  ts: [
    {type:"type", match:/:\s*(any|void|number|boolean|string|object|never|enum)\b/g},
    {type:"kwd", match:/\b(type|namespace|typedef|interface|public|private|protected|implements|declare|abstract|readonly)\b/g},
    {match:/\/\*\*((?!\*\/)[^])*(\*\/)?/g, sub:"jsdoc"},
    {match:/\/\/.*\n?|\/\*((?!\*\/)[^])*(\*\/)?/g, sub:"todo"},
    {expand:"str"},
    {type:"kwd", match:/=>|\b(this|set|get|as|async|await|break|case|catch|class|const|constructor|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|let|var|of|new|package|private|protected|public|return|static|super|switch|throw|throws|try|typeof|void|while|with|yield)\b/g},
    {match:/\/((?!\/)[^\r\n\\]|\\.)+\/[dgimsuy]*/g, sub:"regex"},
    {expand:"num"},
    {type:"num", match:/\b(NaN|null|undefined|[A-Z][A-Z_]*)\b/g},
    {type:"bool", match:/\b(true|false)\b/g},
    {type:"oper", match:/[/*+:?&|%^~=!,<>.^-]+/g},
    {type:"class", match:/\b[A-Z][\w_]*\b/g},
    {type:"func", match:/[a-zA-Z$_][\w$_]*(?=\s*((\?\.)?\s*\(|=\s*(\(?[\w,{}\[\])]+\)? =>|function\b)))/g}
  ],
  uri: [
    {match:/^#.*/gm, sub:"todo"},
    {type:"class", match:/^\w+(?=:?)/gm},
    {type:"num", match:/:\d+/g},
    {type:"oper", match:/[:/&?]|\w+=/g},
    {type:"func", match:/[.\w]+@|#[\w]+$/gm},
    {type:"var", match:/\w+\.\w+(\.\w+)*/g}
  ],
  xml: [
    {match:/<!--((?!-->)[^])*-->/g, sub:"todo"},
    {type:"class", match:RegExp(`<\\?xml\\s*(\\s+[a-z-]+\\s*(=\\s*([^"']\\S*|("|')(\\\\[^]|(?!\\4)[^])*\\4?)?)?\\s*)*\\?>`, "gi"), sub:[{type:"oper", match:/^<\?|\?>$/g},
    {type:"str", match:/"[^"]*"|'[^']*'/g},
    {type:"var", match:/xml/gi}]},
    {type:"class", match:/<!\[CDATA\[[\s\S]*?\]\]>/gi},
    {match:RegExp(`</?[a-z_-]+\\s*(\\s+[a-z-]+\\s*(=\\s*([^"']\\S*|("|')(\\\\[^]|(?!\\4)[^])*\\4?)?)?\\s*)*/?>`, "g"), sub:[
      {type:"var", match:/^<\/?[^\s>\/]+/g, sub:[{type:"oper", match:/^<\/?/g}]},
      {type:"str", match:/=\s*([^"']\S*|("|')(\\[^]|(?!\2)[^])*\2?)/g, sub:[{type:"oper", match:/^=/g}]},
      {type:"oper", match:/\/?>/g},
      {type:"class", match:/[a-z-]+/gi}
    ]},
    {type:"var", match:/&(#x?)?[\da-z]{1,8};/gi}
  ],
  yaml: [
    {match:/#.*/g, sub:"todo"},
    {expand:"str"},
    {type:"str", match:/(>|\|)\r?\n((\s[^\n]*)?(\r?\n|$))*/g},
    {type:"type", match:/!![a-z]+/g},
    {type:"bool", match:/\b(Yes|No)\b/g},
    {type:"oper", match:/[+:-]/g},
    {expand:"num"},
    {type:"var", match:/[a-zA-Z]\w*(?=:)/g}
  ]
}
