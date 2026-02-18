import React, { createContext, useContext, useMemo, useState } from 'react';
import { createTree } from '../utils/pythonParser';

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

  const [activeLine, setActiveLine] = useState(0);
  const syntaxTree = useMemo(() => createTree(code), [code]);

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
