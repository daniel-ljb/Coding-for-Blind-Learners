import React from 'react';

/**
 * Code Editor Component
 * Displays all code lines with the active line highlighted
 * Handles keyboard navigation within the code area
 */
function CodeEditor({ 
  codeLines, 
  activeLine, 
  mode, 
  onLineUpdate, 
  onActiveLineChange 
}) {
  
  /**
   * Handle keyboard events for navigation and editing
   * TODO: Implement keyboard event handling
   */
  const handleKeyDown = (event) => {
    if (mode !== 'edit' && mode !== 'command') return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onActiveLineChange(activeLine - 1);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onActiveLineChange(activeLine + 1);
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
    <div className="code-editor">
      <h2 className="section-title">Code Editor</h2>
      
      {/* Code display area */}
      <div 
        className="code-container"
        tabIndex={0}
        role="region"
        aria-label="Code editor, read-only"
        aria-describedby="editor-help"
        onKeyDown={handleKeyDown}
      >
        {codeLines.map((line, index) => (
          <div 
            key={index}
            className={`code-line ${index === activeLine ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="line-number">
              {String(index + 1).padStart(3, ' ')}
            </span>
            <span className="line-content">
              {line || ' '} {/* Show space for empty lines */}
            </span>
            {index === activeLine && (
              <span className="active-indicator" aria-label="Active line">
                ▶
              </span>
            )}
          </div>
        ))}
      </div>

      {mode === 'edit' && (
        <div className="editor-input">
          <label className="sr-only" htmlFor="line-editor">
            Edit active line {activeLine + 1}
          </label>
          <input
            id="line-editor"
            type="text"
            value={codeLines[activeLine] || ''}
            onChange={(e) =>
              onLineUpdate(activeLine, e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                onActiveLineChange(activeLine - 1);
              }

              if (e.key === 'ArrowDown') {
                e.preventDefault();
                onActiveLineChange(activeLine + 1);
              }
            }}
            autoFocus
            aria-label={`Editing line ${activeLine + 1}`}
          />
        </div>
      )}

      {/* Help text for screen readers */}
      <div id="editor-help" className="sr-only">
        Use arrow keys to navigate lines. Edit the active line using the edit input below.
        Current mode: {mode}. Active line: {activeLine + 1}.
      </div>
    </div>
  );
}

export default CodeEditor;
