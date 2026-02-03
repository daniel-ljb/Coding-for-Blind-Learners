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
    <div className="h-full p-4 overflow-y-auto">
      <h2 className="bg-gray-700 text-gray-300 p-2 text-base border-b border-gray-600 m-[-1rem] mb-4">Command Panel</h2>

      {/* Current Status */}
      <div className="mb-6">
        <h3 className="text-white mb-2 text-sm">Status</h3>
        <div className="space-y-1">
          <p className="mb-1 text-gray-400 text-xs">
            <strong>Mode:</strong>{' '}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </p>
          <p className="mb-1 text-gray-400 text-xs">
            <strong>Line:</strong> {activeLine + 1} of {totalLines}
          </p>
          <p className="mb-1 text-gray-400 text-xs text-teal-400 italic">{statusMessage}</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6">
        <h3 className="text-white mb-2 text-sm">Mode Control</h3>
        <button
          className={`block w-full mb-2 p-2 rounded cursor-pointer ${
            mode === 'edit'
              ? 'bg-blue-600 text-white border border-blue-600'
              : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
          }`}
          onClick={() => onModeChange('edit')}
          aria-pressed={mode === 'edit'}
        >
          Edit Mode
        </button>
        <button
          className={`block w-full mb-2 p-2 rounded cursor-pointer ${
            mode === 'command'
              ? 'bg-blue-600 text-white border border-blue-600'
              : 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600'
          }`}
          onClick={() => onModeChange('command')}
          aria-pressed={mode === 'command'}
        >
          Command Mode
        </button>
      </div>

      {/* Command Input */}
      <div className="mb-6">
        <h3 className="text-white mb-2 text-sm">Commands</h3>
        <form onSubmit={handleCommandSubmit}>
          <label className="absolute w-px h-px p-0 m-[-1px] overflow-hidden clip-rect(0, 0, 0, 0) whitespace-nowrap border-0" htmlFor="command-input">
            Command input
          </label>
          <input
            autoFocus={mode === 'command'}
            disabled={mode !== 'command'}
            id="command-input"
            type="text"
            className="w-full p-2 mb-2 bg-gray-700 text-white border border-gray-600 rounded font-mono disabled:opacity-50"
            placeholder="Enter command (e.g. next, jump 5, summary)"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            aria-disabled={mode !== 'command'}
            aria-label="Command input"
          />
          <button
            type="submit"
            className="w-full p-2 bg-blue-700 text-white border-0 rounded cursor-pointer hover:bg-blue-800 disabled:opacity-50"
            disabled={mode !== 'command'}
          >
            Execute
          </button>
        </form>
      </div>

      {/* Available Commands */}
      <div className="mb-6">
        <h3 className="text-white mb-2 text-sm">Available Commands</h3>
        {mode === 'command' ? (
          <ul className="list-none pl-0">
            <li className="text-gray-400 text-xs mb-1 p-1 bg-gray-600 rounded">next — move to next line</li>
            <li className="text-gray-400 text-xs mb-1 p-1 bg-gray-600 rounded">prev — move to previous line</li>
            <li className="text-gray-400 text-xs mb-1 p-1 bg-gray-600 rounded">jump N — jump to line N</li>
            <li className="text-gray-400 text-xs mb-1 p-1 bg-gray-600 rounded">summary — summarize code</li>
          </ul>
        ) : (
          <ul className="list-none pl-0">
            <li className="text-gray-400 text-xs mb-1 p-1 bg-gray-600 rounded">Switch to Command Mode to use commands</li>
          </ul>
        )}
      </div>
    </div>
  );
}

export default CommandPanel;