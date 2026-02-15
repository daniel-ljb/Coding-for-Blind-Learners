import React, { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor.jsx';
import Terminal from './components/Terminal.jsx';
import CommandPanel from './components/CommandPanel.jsx';
import { CodeProvider } from './contexts/CodeContext.jsx';

export function App() {
  /**
   * Modes available:
   * 'edit' - User can type/edit the active line
   * 'command' - User can navigate and issue commands
   * 'terminal' - User can interact with terminal
   */
  const [mode, setMode] = useState('edit');

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setMode((prev) => {
          if (prev === 'edit') return 'terminal';
          return 'edit';
        });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <CodeProvider>
      {/* <main className="flex-1 grid grid-cols-[3fr_1fr] grid-rows-[2fr_1fr] gap-px bg-gray-700 h-screen">
        <section className="col-span-1 row-span-1 bg-gray-900 overflow-hidden">
          <CodeEditor mode={mode} />
        </section>

        <section className="col-span-1 row-span-2 bg-gray-800 overflow-y-auto">
          <CommandPanel
            mode={mode}
            onModeChange={handleModeChange}
          />
        </section>

        <section className="col-span-1 row-span-1 bg-gray-800 overflow-hidden">
          <Terminal mode={mode} />
        </section>
      </main> */}
      <main className="flex flex-col h-screen bg-gray-700 gap-px">
        <section className="flex-1 bg-gray-900 overflow-hidden">
          <CodeEditor mode={mode} />
        </section>

        <section className="flex-1 bg-gray-800 overflow-hidden">
          <Terminal mode={mode} />
        </section>
      </main>
    </CodeProvider>
  );
  return <SimplePyRunner></SimplePyRunner>
}

export default App;