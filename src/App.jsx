import React, { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor.jsx';
import Terminal from './components/Terminal.jsx';
import CommandPanel from './components/CommandPanel.jsx';
import { CodeProvider, useCode } from './contexts/CodeContext.jsx';
import Switch from '@mui/material/Switch';
import OneLineTerminal from './components/OneLineTerminal.jsx';

function SaveShortcut() {
  const { saveFile } = useCode();
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [saveFile]);
  return null;
}

export function App() {
  const [mode, setMode] = useState('terminal');
  const [isBlindMode, setIsBlindMode] = useState(true);

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

  const blindModeStyles = isBlindMode ? ' opacity-0 !h-0 w-0 scale-0 flex-none' : '';

  return (
    <CodeProvider>
      <SaveShortcut />
      <div className="absolute top-0 right-0 flex items-center gap-2 z-50">
        <span className="text-gray-300">Blind Mode</span>
        <Switch
          checked={isBlindMode}
          onChange={(e) => setIsBlindMode(e.target.checked)}
          color="primary"
        />
      </div>
        <main className="flex flex-col h-screen bg-gray-900 gap-px justify-center">
          <div className={"h-10 bg-gray-700 border-b border-gray-600 p-2" + blindModeStyles}>
            <span className="text-gray-300">Code Editor</span>
          </div>
          <section className={"flex-1 bg-gray-900 overflow-hidden flex flex-col" + blindModeStyles}>
            <CodeEditor mode={mode} />
          </section>
          <div className={"h-10 bg-gray-700 border-b border-gray-600 p-2" + blindModeStyles}>
            <span className="text-gray-300">Terminal</span>
          </div>
          <section className="flex bg-gray-900 overflow-hidden flex-col">
            <OneLineTerminal mode={mode} />
          </section>
        </main>

    </CodeProvider>
  );
}

export default App;