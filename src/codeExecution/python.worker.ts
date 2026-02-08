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
        self.postMessage({type: 'output', data: args.join(" ")})
    }
    function pyInput(promptText="") {
        pyOutput(promptText)
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
                const asyncCode = data.replace(/\binput\s*\(/g, "await input(");
                const result = await pyodideInstance.runPythonAsync(asyncCode);

                self.postMessage({
                    type: 'terminated',
                    result: result?.toString() || 'Program completed successfully'
                });

            } catch (error: any) {
                self.postMessage({
                    type: 'error',
                    error: error.toString(),
                    traceback: error.message
                });
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