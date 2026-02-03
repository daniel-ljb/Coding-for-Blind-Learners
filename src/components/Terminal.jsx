import React, { useState } from 'react';

/**
 * Terminal Component
 * Handles program execution and runtime I/O
 */
function Terminal({ mode, terminalOutput, onClear, onRun, onTerminalInput }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const value = input.trim();
    if (!value) return;

    if (value === 'run') {
      onRun();
    } else {
      onTerminalInput?.(value);
    }

    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="flex justify-between items-center bg-gray-700 border-b border-gray-600">
        <h2 className="bg-gray-700 text-gray-300 p-2 text-base border-b border-gray-600 flex-1">Terminal</h2>
        <button
          className="bg-blue-600 text-white border-0 p-1 m-2 rounded cursor-pointer hover:bg-blue-500"
          onClick={onClear}
          aria-label="Clear terminal output"
        >
          Clear
        </button>
      </div>

      {/* Output area */}
      <div
        className="flex-1 p-4 overflow-y-auto font-mono"
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
      >
        {terminalOutput.length === 0 ? (
          <div className="mb-1 flex items-start gap-2 text-gray-500 italic">
            Terminal cleared. Ready for input.
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
                output.type === 'error' ? 'text-red-600' : ''
              }`}>
                {output.type.toUpperCase()}:
              </span>
              <span className="flex-1 text-gray-300">
                {output.message}
              </span>
            </div>
          ))
        )}
      </div>

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
          placeholder="Type 'run' or program input"
          aria-label="Terminal input"
        />
      </form>
    </div>
  );
}

export default Terminal;