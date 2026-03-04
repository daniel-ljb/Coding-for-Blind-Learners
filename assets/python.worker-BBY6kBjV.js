(function(){"use strict";importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js");let e=null,s=null;async function i(){if(e)return e;e=await loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.29.3/full/"});function r(...t){self.postMessage({type:"output",data:t.join(" ")})}function o(t=""){return self.postMessage({type:"inputRequest",data:t}),new Promise(n=>{s=n})}return e.globals.set("print",r),e.globals.set("input",o),e}self.onmessage=async r=>{const{type:o,data:t}=r.data;switch(o){case"run":try{const n=await i(),a=`
import traceback

source = """${`async def __user_main__():
${t.replace(/\binput\s*\(/g,"await input(").split(`
`).map(p=>"    "+p).join(`
`)}`}
"""

def print_error_for_screen_reader(exc: BaseException) -> str:
    if isinstance(exc, SyntaxError):
        msg = exc.msg or exc.args[0]
        text = (exc.text or "").strip()
        print(f"SyntaxError: {msg}")
        print(f"{exc.lineno} {text}")


    tb = traceback.TracebackException.from_exception(exc)
    print(f"{type(exc).__name__}: {exc}")
    code_lines = source.split("\\n")
    for frame in reversed(tb.stack):
        if frame.lineno > len(code_lines):
            continue

        code = (frame.line or source.split("\\n")[frame.lineno-1] or "").strip()
        print(f"{frame.lineno} {code}")

async def __run_user_code__():
    try:
        exec(source, globals())
        await globals()["__user_main__"]()
    except Exception as e:
        print_error_for_screen_reader(e)

await __run_user_code__()
`,c=await n.runPythonAsync(a);self.postMessage({type:"terminated",result:c?.toString()||"Program completed successfully"})}catch(n){self.postMessage({type:"error",error:n.toString()})}break;case"input":if(s==null)break;s(t),s=null;break}},self.onerror=r=>{self.postMessage({type:"error",error:r})}})();
