import React, { useState } from 'react';
import CodeEditor from './components/CodeEditor.jsx';
import CustomShortcuts from './components/CustomShortcuts.jsx';
import { AppProvider } from './contexts/AppContext.jsx';
import Switch from '@mui/material/Switch';
import OneLineTerminal from './components/OneLineTerminal.jsx';

function AppContent() {
  const [isBlindMode, setIsBlindMode] = useState(true);

  const blindModeStyles = isBlindMode ? ' opacity-0 !h-0 w-0 scale-0 flex-none' : '';

  return (
    <>
      <CustomShortcuts />
      <div className="absolute top-0 right-0 flex items-center gap-2 z-50">
        <span className="text-gray-300">Test Mode</span>
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
          <CodeEditor />
        </section>
        <div className={"h-10 bg-gray-700 border-b border-gray-600 p-2" + blindModeStyles}>
          <span className="text-gray-300">Terminal</span>
        </div>
        <section className="flex bg-gray-900 overflow-hidden flex-col">
          <OneLineTerminal />
        </section>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}