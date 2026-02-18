import React, { useState, useRef, useEffect } from 'react';
import { useCode } from '../contexts/CodeContext';
import { useTerminalCommands } from '../hooks/useTerminalCommands.jsx';
import { parseCommand } from '../utils/terminalCommands.jsx';

/**
 * Terminal Component
 * Handles program execution and runtime I/O
 */
function Terminal({ mode }) {
  const [input, setInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState([]);
  const { code } = useCode();
  const {
    statusMessage,
    createLineAfter,
    createLineBefore,
    moveToNextIndent,
    moveToPrevIndent,
    moveOutOneLevel,
    moveInOneLevel,
    jumpToFunction,
    jumpToComment,
    readLine,
    readBlock,
    readFunction,
    loadFile,
    saveFile,
    getCommandHelp,
  } = useTerminalCommands();

  const workerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (mode === 'terminal') {
      document.getElementById('terminal-input')?.focus();
    }
  }, [mode]);

  useEffect(() => {
    if (statusMessage) {
      setTerminalOutput(prev => [...prev, { type: 'info', message: statusMessage }]);
    }
  }, [statusMessage]);

  const handleClear = () => {
    setTerminalOutput([]);
  };

  const startWorker = () => {
    if (workerRef.current) return;

    const worker = new Worker(new URL("../codeExecution/python.worker.ts", import.meta.url));
    worker.onmessage = (e) => {
      const { type, data, result, error } = e.data;
      if (type === "output") setTerminalOutput(prev => [...prev, { type: "output", message: data }]);
      if (type === "terminated") setTerminalOutput(prev => [...prev, { type: "info", message: result }]);
      if (type === "error") setTerminalOutput(prev => [...prev, { type: "error", message: error }]);
    };

    workerRef.current = worker;
  };

  const handleRun = () => {
    startWorker();
    setTerminalOutput(prev => [...prev, { type: 'info', message: 'Running code...' }]);
    workerRef.current?.postMessage({ type: "run", data: code });
  };

  const parseCommandWithHandlers = (cmd) =>
    parseCommand(cmd, {
      moveToNextIndent,
      moveToPrevIndent,
      moveOutOneLevel,
      moveInOneLevel,
      createLineAfter,
      createLineBefore,
      jumpToFunction,
      jumpToComment,
      readLine,
      readBlock,
      readFunction,
      saveFile,
      getCommandHelp,
      triggerLoad: () => fileInputRef.current?.click(),
      handleRun,
      handleClear,
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;

    setTerminalOutput(prev => [...prev, { type: 'input', message: value }]);

    const parsed = parseCommandWithHandlers(value);

    if (parsed.type === 'help') {
      setTerminalOutput(prev => [...prev, { type: 'info', message: parsed.text }]);
    } else if (parsed.type === 'error') {
      setTerminalOutput(prev => [...prev, { type: 'error', message: parsed.text }]);
    } else if (parsed.type === 'action') {
      parsed.action();
    }

    setInput('');
  };

  const handleKeyDown = (e) => {
    if (mode !== 'terminal') return;

    // Handle keyboard shortcuts
    if (e.shiftKey && e.key === 'ArrowUp') {
      e.preventDefault();
      createLineBefore();
      setTerminalOutput(prev => [...prev, { type: 'info', message: 'Created new line before' }]);
    } else if (e.shiftKey && e.key === 'ArrowDown') {
      e.preventDefault();
      createLineAfter();
      setTerminalOutput(prev => [...prev, { type: 'info', message: 'Created new line after' }]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveToNextIndent();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveToPrevIndent();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveOutOneLevel();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveInOneLevel();
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      readLine();
    } else if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      readBlock();
    } else if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      readFunction();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="flex justify-between items-center bg-gray-700 border-b border-gray-600 h-10">
        <h2 className="bg-gray-700 text-gray-300 p-2 text-base border-b border-gray-600 flex-1">Terminal</h2>
        <button
          className="bg-blue-600 text-white border-0 p-1 m-2 rounded cursor-pointer hover:bg-blue-500"
          onClick={handleClear}
          aria-label="Clear terminal output"
        >
          Clear
        </button>
      </div>

      {/* Output area */}
      <div
        className="flex-1 p-4 overflow-y-auto font-mono"
        role="log"
        aria-live="assertive"
        aria-label="Terminal output"
      >
        {terminalOutput.length === 0 ? (
          <div className="mb-1 flex items-start gap-2 text-gray-500 italic">
            Terminal cleared. Ready for input. Type '?' for available commands.
          </div>
        ) : (
          terminalOutput.map((output, index) => (
            <div
              key={index}
              className="mb-1 flex items-start gap-2"
            >
              <span className={`font-bold min-w-[4rem] ${
                output.type === 'info' ? 'text-teal-400' :
                output.type === 'success' ? 'text-blue-400' :
                output.type === 'error' ? 'text-red-600' :
                output.type === 'output' ? 'text-green-300' :
                output.type === 'input' ? 'text-yellow-400' : ''
              }`}>
                {output.type.toUpperCase()}:
              </span>
              <span className="flex-1 text-gray-300 whitespace-pre-wrap break-words">
                {output.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".py"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            loadFile(e.target.files[0]);
          }
        }}
        aria-label="Load Python file"
      />

      {/* Input prompt */}
      <form className="p-4 border-t border-gray-600" onSubmit={handleSubmit}>
        <label className="absolute w-px h-px p-0 m-[-1px] overflow-hidden clip-rect(0, 0, 0, 0) whitespace-nowrap border-0" htmlFor="terminal-input">
          Terminal input
        </label>
        <input
          autoFocus={mode === 'terminal'}
          disabled={mode !== 'terminal'}
          id="terminal-input"
          type="text"
          className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded font-mono disabled:opacity-50"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command or '?' for help"
          aria-label="Terminal input"
        />
      </form>
    </div>
  );
}

export default Terminal;