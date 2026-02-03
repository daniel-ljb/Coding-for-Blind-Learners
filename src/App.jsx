import React, { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor.jsx';
import Terminal from './components/Terminal.jsx';
import CommandPanel from './components/CommandPanel.jsx';
import './App.css';

/**
 * Main Application Component
 * Manages all shared state and renders the three-panel layout
 */
function App() {
    // ===== SHARED APPLICATION STATE =====
    
    /**
     * Array of code lines - each line is a string
     * This represents the entire program being edited
     */
    const [codeLines, setCodeLines] = useState([
        '# Welcome to Accessible IDE Demo',
        '# Start coding below',
        '',
        'def hello_world():',
        '    print("Hello, World!")',
        '',
        '# Add your code here'
    ]);

    /**
     * Index of the currently active line (0-based)
     * Only one line can be active at a time
     */
    const [activeLine, setActiveLine] = useState(2); // Start at empty line

    /**
     * Current interaction mode
     * 'edit' - User can type/edit the active line
     * 'command' - User can navigate and issue commands
     */
    const [mode, setMode] = useState('edit');

    /**
     * Terminal output lines for displaying system messages
     * Each entry is an object: { type: 'info'|'success'|'error', message: string }
     */
    const [terminalOutput, setTerminalOutput] = useState([
        { type: 'info', message: 'Accessible IDE Demo initialized' },
        { type: 'info', message: 'Use Tab to navigate between sections' },
        { type: 'success', message: 'Ready for input!' }
    ]);

    /**
     * Current status message displayed in the command panel
     */
    const [statusMessage, setStatusMessage] = useState('Ready to code! Use arrow keys to navigate.');

    // ===== STATE UPDATE FUNCTIONS =====
    // These will be passed to child components as props
    // Logic implementation will go here later

    const handleCodeLineUpdate = (lineIndex, newContent) => {
        // TODO: Implement line update logic
        setCodeLines(prev => {
            const updated = [...prev];
            updated[lineIndex] = normalizeLine(newContent);
            return updated;
        });
        setStatusMessage(`Updated line ${lineIndex + 1}`);
    };

    const normalizeLine = (line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('print ') && !trimmed.includes('(')) {
            return `print("${trimmed.slice(6)}")`;
        }
        return line;
    };

    const handleActiveLineChange = (newActiveLine) => {
        if (newActiveLine < 0) return;
        setCodeLines(prev => {
            if (newActiveLine >= prev.length) {
            return [...prev, ''];
            }
            return prev;
        });
        setActiveLine(newActiveLine);
        setStatusMessage(`Moved to line ${newActiveLine + 1}`);
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
        setStatusMessage(`${newMode === 'edit' ? 'Edit' : 'Command'} mode enabled`);
    };

    const handleCommandExecution = (command) => {
        const parts = command.trim().split(' ');
        const cmd = parts[0];
         
        if (cmd === 'next') {
            handleActiveLineChange(activeLine + 1);
        } else if (cmd === 'prev') {
            handleActiveLineChange(activeLine - 1);
        } else if (cmd === 'jump') {
            const n = parseInt(parts[1], 10);
            if (!isNaN(n)) handleActiveLineChange(n - 1);
        } else if (cmd === 'summary') {
            const nonEmpty = codeLines.filter(l => l.trim() && !l.startsWith('#')).length;
            setStatusMessage(`${codeLines.length} lines, ${nonEmpty} code lines`);
        } else {
            setStatusMessage(`Unknown command: ${command}`);
        }
    };

    const addTerminalMessage = (type, message) => {
        // TODO: Implement terminal message addition
        console.log('Add terminal message:', type, message);
    };

    const runProgram = () => {
        const output = [];
        codeLines.forEach(line => {
            if (line.trim().startsWith('print(')) {
            const content = line.match(/print\("(.*)"\)/);
            if (content) output.push(content[1]);
            }
        });

        setTerminalOutput(prev => [
            ...prev,
            { type: 'info', message: 'Running program...' },
            ...output.map(o => ({ type: 'success', message: o }))
        ]);
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                setMode((prev) => {
                    if (prev === 'edit') return 'command';
                    if (prev === 'command') return 'terminal';
                    return 'edit';
                });
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // ===== RENDER =====
    return (
        <div className="app">
        {/* Screen reader announcements area */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
            {statusMessage}
        </div>

        {/* Main application header */}
        <header className="app-header">
            <h1>Accessible Programming Environment Demo</h1>
            <p className="mode-indicator">
            Current Mode: <strong>{mode.toUpperCase()}</strong> | 
            Active Line: <strong>{activeLine + 1}</strong> of <strong>{codeLines.length}</strong>
            </p>
        </header>

        {/* Three-panel layout using CSS Grid */}
        <main className="app-main">
            {/* Code Editor - Top Left (3/4 width) */}
            <section className="editor-section">
            <CodeEditor
                codeLines={codeLines}
                activeLine={activeLine}
                mode={mode}
                onLineUpdate={handleCodeLineUpdate}
                onActiveLineChange={handleActiveLineChange}
            />
            </section>

            {/* Terminal - Bottom Left (3/4 width) */}
            <section className="terminal-section">
            <Terminal
                mode={mode}
                terminalOutput={terminalOutput}
                onClear={() => setTerminalOutput([])}
                onRun={runProgram}
                onTerminalInput={(value) =>
                    setTerminalOutput(prev => [
                    ...prev,
                    { type: 'info', message: `Input received: ${value}` }
                    ])
                }
            />
            </section>

            {/* Command Panel - Right Side (1/4 width) */}
            <section className="command-section">
            <CommandPanel
                mode={mode}
                activeLine={activeLine}
                totalLines={codeLines.length}
                statusMessage={statusMessage}
                onModeChange={handleModeChange}
                onCommandExecute={handleCommandExecution}
            />
            </section>
        </main>

        {/* Footer with keyboard shortcuts */}
        <footer className="app-footer">
            <p>Keyboard Navigation: Tab/Shift+Tab to move between sections | Arrow keys to navigate code</p>
        </footer>
        </div>
    );

    
}


export default App;