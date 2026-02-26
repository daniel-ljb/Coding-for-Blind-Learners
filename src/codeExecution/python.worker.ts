/// <reference lib="webworker" />

importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js");

let pyodide: any = null;
let inputResolution: ((value: string) => void) | null = null;

function inputPromise() {
  return new Promise(resolve => {
    inputResolution = resolve;
  });
}

async function initializePyodide(): Promise<any> {
    if(pyodide) return pyodide;
    // @ts-ignore - Pyodide will be loaded from CDN
    pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/"
    })

    function pyOutput(...args:any[]) {
        console.log(args.join(" "))
        self.postMessage({type: 'output', data: args.join(" ")})
    }
    function pyInput(promptText="") {
        self.postMessage({type: 'inputRequest', data: promptText})
        return new Promise(resolve => {inputResolution = resolve})
    }

    pyodide.globals.set("print", pyOutput);
    pyodide.globals.set("input", pyInput);

    return pyodide;
}

self.onmessage = async (event: MessageEvent) => {
    const { type, data } = event.data;

    switch (type) {
        case 'run':
            try {
                const pyodideInstance = await initializePyodide();

                const userCode = data.replace(/\binput\s*\(/g, "await input(");
                const wrappedCode = `async def __user_main__():\n${userCode.split("\n").map(l => "    " + l).join("\n")}`;

                const asyncCode = `
import traceback

source = """${wrappedCode}
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
`;
                console.log(asyncCode)
                const result = await pyodideInstance.runPythonAsync(asyncCode);
                self.postMessage({
                    type: 'terminated',
                    result: result?.toString() || 'Program completed successfully'
                });
            } catch (error: any) {
                self.postMessage({ type: 'error', error: error.toString() });
            }
            break;

        case 'input':
            if(inputResolution == null) break;
            inputResolution(data)
            inputResolution = null;
            break;
    }
};

self.onerror = (error) => {
    self.postMessage({ type: 'error', error: error });
};

