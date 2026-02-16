import React, { act, createContext, useContext, useState } from 'react';

const CodeContext = createContext(null);

export function CodeProvider({ children }) {
  const [code, setCode] = useState([
    'def fib(n):',
    '    if n <= 1:',
    '        return n',
    '    return fib(n-1) + fib(n-2)',
    '',
    'print(fib(10))'
  ].join('\n'));

  const [activeLine, setActiveLine] = useState(0); // Start at empty line

  const handleActiveLineChange = (newActiveLine) => {
    if (newActiveLine < 0) return;
    setCode(prev => {
      const lines = prev.split('\n');
      if (newActiveLine >= lines.length) {
        return [...lines, ''].join('\n');
      }
      return prev;
    });
    setActiveLine(newActiveLine);
    setStatusMessage(`Moved to line ${newActiveLine + 1}`);
  };

  const executeCommand = (command) => {
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
      const lines = code.split('\n');
      const nonEmpty = lines.filter(l => l.trim() && !l.startsWith('#')).length;
      setStatusMessage(`${lines.length} lines, ${nonEmpty} code lines`);
    } else {
      setStatusMessage(`Unknown command: ${command}`);
    }
  };

  const value = {
    code,
    setCode,
    activeLine,
    setActiveLine,
  };

  return (
    <CodeContext.Provider value={value}>
      {children}
    </CodeContext.Provider>
  );
}

export function useCode() {
  const context = useContext(CodeContext);
  if (!context) {
    throw new Error('useCode must be used within a CodeProvider');
  }
  return context;
}
