import React, { useState } from 'react';

/**
 * Command Panel Component
 * Navigation and inspection only
 */
function CommandPanel({
  mode,
  activeLine,
  totalLines,
  statusMessage,
  onModeChange,
  onCommandExecute
}) {
  const [commandInput, setCommandInput] = useState('');

  const handleCommandSubmit = (event) => {
    event.preventDefault();

    const command = commandInput.trim();
    if (!command) return;

    onCommandExecute(command);
    setCommandInput('');
  };

  return (
    <div className="command-panel">
      <h2 className="section-title">Command Panel</h2>

      {/* Current Status */}
      <div className="status-section">
        <h3>Status</h3>
        <div className="status-info">
          <p>
            <strong>Mode:</strong>{' '}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </p>
          <p>
            <strong>Line:</strong> {activeLine + 1} of {totalLines}
          </p>
          <p className="status-message">{statusMessage}</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="mode-section">
        <h3>Mode Control</h3>
        <button
          className={`mode-button ${mode === 'edit' ? 'active' : ''}`}
          onClick={() => onModeChange('edit')}
          aria-pressed={mode === 'edit'}
        >
          Edit Mode
        </button>
        <button
          className={`mode-button ${mode === 'command' ? 'active' : ''}`}
          onClick={() => onModeChange('command')}
          aria-pressed={mode === 'command'}
        >
          Command Mode
        </button>
      </div>

      {/* Command Input */}
      <div className="command-input-section">
        <h3>Commands</h3>
        <form onSubmit={handleCommandSubmit}>
          <label className="sr-only" htmlFor="command-input">
            Command input
          </label>
          <input
            autoFocus={mode === 'command'}
            disabled={mode !== 'command'}
            id="command-input"
            type="text"
            className="command-input"
            placeholder="Enter command (e.g. next, jump 5, summary)"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            aria-disabled={mode !== 'command'}
            aria-label="Command input"
          />
          <button
            type="submit"
            className="execute-button"
            disabled={mode !== 'command'}
          >
            Execute
          </button>
        </form>
      </div>

      {/* Available Commands */}
      <div className="commands-list">
        <h3>Available Commands</h3>
        {mode === 'command' ? (
          <ul>
            <li>next — move to next line</li>
            <li>prev — move to previous line</li>
            <li>jump N — jump to line N</li>
            <li>summary — summarize code</li>
          </ul>
        ) : (
          <ul>
            <li>Switch to Command Mode to use commands</li>
          </ul>
        )}
      </div>
    </div>
  );
}

export default CommandPanel;