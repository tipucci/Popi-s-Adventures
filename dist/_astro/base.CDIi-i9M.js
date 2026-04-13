function a(s="/"){if(s==="/")return"/";const e="/".endsWith("/")?"/".slice(0,-1):"/",n=s.startsWith("/")?s:`/${s}`;return`${e}${n}`||"/"}export{a as w};
