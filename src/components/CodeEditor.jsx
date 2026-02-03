import React from 'react';
import { useCode } from '../contexts/CodeContext';

/**
 * Code Editor Component
 * Displays all code lines with the active line highlighted
 * Handles keyboard navigation within the code area
 */
function CodeEditor({ mode }) {
  const { codeLines, activeLine, handleLineUpdate, handleActiveLineChange } = useCode();

  /**
   * Handle keyboard events for navigation and editing
   */
  const handleKeyDown = (event) => {
    if (mode !== 'edit' && mode !== 'command') return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      handleActiveLineChange(activeLine - 1);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      handleActiveLineChange(activeLine + 1);
    }
  };

  /**
   * Handle focus events for accessibility
   */
  const handleFocus = () => {
    console.log('Code editor focused');
  };

  const handleBlur = () => {
    console.log('Code editor blurred');
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="bg-gray-700 text-gray-300 p-2 text-base border-b border-gray-600">Code Editor</h2>
      
      {/* Code display area */}
      <div 
        className="flex-1 p-4 overflow-y-auto font-mono bg-gray-900"
        tabIndex={0}
        role="region"
        aria-label="Code editor, read-only"
        aria-describedby="editor-help"
        onKeyDown={handleKeyDown}
      >
        {codeLines.map((line, index) => (
          <div 
            key={index}
            className={`flex items-center min-h-[1.5rem] py-0.5 relative ${
              index === activeLine ? 'bg-blue-800 border-l-4 border-blue-600' : ''
            }`}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="text-gray-500 mr-4 select-none min-w-[3rem] text-right">
              {String(index + 1).padStart(3, ' ')}
            </span>
            <span className="flex-1 whitespace-pre text-gray-300">
              {line || ' '} {/* Show space for empty lines */}
            </span>
            {index === activeLine && (
              <span className="text-blue-600 ml-2 font-bold" aria-label="Active line">
                ▶
              </span>
            )}
          </div>
        ))}
      </div>

      {mode === 'edit' && (
        <div className="bg-gray-700 border-t border-gray-600 p-2">
          <label className="absolute w-px h-px p-0 m-[-1px] overflow-hidden clip-rect(0, 0, 0, 0) whitespace-nowrap border-0" htmlFor="line-editor">
            Edit active line {activeLine + 1}
          </label>
          <input
            id="line-editor"
            type="text"
            className="w-full p-2 bg-gray-600 text-white border border-gray-500 rounded font-mono"
            value={codeLines[activeLine] || ''}
            onChange={(e) =>
              handleLineUpdate(activeLine, e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                handleActiveLineChange(activeLine - 1);
              }

              if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleActiveLineChange(activeLine + 1);
              }
            }}
            autoFocus
            aria-label={`Editing line ${activeLine + 1}`}
          />
        </div>
      )}

      {/* Help text for screen readers */}
      <div id="editor-help" className="absolute w-px h-px p-0 m-[-1px] overflow-hidden clip-rect(0, 0, 0, 0) whitespace-nowrap border-0">
        Use arrow keys to navigate lines. Edit the active line using the edit input below.
        Current mode: {mode}. Active line: {activeLine + 1}.
      </div>
    </div>
  );
}

export default CodeEditor;
