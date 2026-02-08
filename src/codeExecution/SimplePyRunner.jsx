import { useState, useRef } from "react";

export default function SimplePyRunner() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [inputValue, setInputValue] = useState("");
  const workerRef = useRef(null); // <- THIS MUST BE useRef(null)

  const startWorker = () => {
    if (workerRef.current) return;

    const worker = new Worker(new URL("./python.worker.ts", import.meta.url));
    worker.onmessage = (e) => {
      const { type, data, result, error } = e.data;
      console.log(type)
      if (type === "output") setOutput((o) => o + data + "\n");
      if (type === "terminated") setOutput((o) => o + result + "\n");
      if (type === "error") setOutput((o) => o + "Error: " + error + "\n");
    };

    workerRef.current = worker; // <- assign the Worker to current
  };

  const runCode = () => {
    startWorker();
    setOutput("");
    workerRef.current?.postMessage({ type: "run", data: code });
  };

  const sendInput = () => {
    if (!inputValue) return;
    workerRef.current?.postMessage({ type: "input", data: inputValue });
    setInputValue("");
  };

  return (
    <div>
      <textarea
        style={{ width: 300, height: 100 }}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter code here"
      />
      <br />
      <button onClick={runCode}>Run</button>
      <br />
      <input
        style={{ width: 200 }}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Input for code"
      />
      <button onClick={sendInput}>Send Input</button>
      <pre
        style={{
          border: "1px solid black",
          padding: 5,
          width: 300,
          height: 150,
          overflow: "auto",
        }}
      >
        {output}
      </pre>
    </div>
  );
}
