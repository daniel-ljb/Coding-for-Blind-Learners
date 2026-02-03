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
    <div className="terminal">
      <div className="terminal-header">
        <h2 className="section-title">Terminal</h2>
        <button
          className="clear-button"
          onClick={onClear}
          aria-label="Clear terminal output"
        >
          Clear
        </button>
      </div>

      {/* Output area */}
      <div
        className="terminal-content"
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
      >
        {terminalOutput.length === 0 ? (
          <div className="terminal-line empty">
            Terminal cleared. Ready for input.
          </div>
        ) : (
          terminalOutput.map((output, index) => (
            <div
              key={index}
              className={`terminal-line ${output.type}`}
            >
              <span className={`terminal-type type-${output.type}`}>
                {output.type.toUpperCase()}:
              </span>
              <span className="terminal-message">
                {output.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Input prompt */}
      <form className="terminal-input" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="terminal-input">
          Terminal input
        </label>
        <input
          autoFocus={mode === 'terminal'}
          disabled={mode !== 'terminal'}
          id="terminal-input"
          type="text"
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