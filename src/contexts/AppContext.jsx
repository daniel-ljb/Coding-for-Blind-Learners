import React, { createContext, useContext, useMemo, useState } from 'react';
import { announce, clearAnnouncer } from '@react-aria/live-announcer';
import { createTree } from '../utils/pythonParser';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [code, setCode] = useState([
    'def fib(n):',
    '    if n <= 1:',
    '        return n',
    '    return fib(n-1) + fib(n-2)',
    '',
    'print(fib(10))'
  ].join('\n'));

  const [activeLine, setActiveLine] = useState(0);
  const syntaxTree = useMemo(() => createTree(code), [code]);

  const [terminalOutput, setTerminalOutput_] = useState('Press ? for available commands.');
  const setTerminalOutput = (msg) => {
    clearAnnouncer()
    announce(msg);
    setTerminalOutput_(msg);
  };

  const [mode, setMode] = useState('terminal');

  const handleActiveLineChange = (newActiveLine) => {
    const lines = code.split('\n');
    if (newActiveLine < 0) return;
    if (newActiveLine >= lines.length) {
      setActiveLine(lines.length - 1);
      return;
    }
    setActiveLine(newActiveLine);
  };

  const value = {
    code,
    setCode,
    syntaxTree,
    activeLine,
    setActiveLine,
    handleActiveLineChange,
    terminalOutput,
    setTerminalOutput,
    mode,
    setMode,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
