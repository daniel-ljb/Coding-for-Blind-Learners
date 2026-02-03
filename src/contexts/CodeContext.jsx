import React, { createContext, useContext, useState } from 'react';

const CodeContext = createContext(null);

export function CodeProvider({ children }) {
  const [codeLines, setCodeLines] = useState([
    '# Welcome to Accessible IDE Demo',
    '# Start coding below',
    '',
    'def hello_world():',
    '    print("Hello, World!")',
    '',
    '# Add your code here'
  ]);

  const [activeLine, setActiveLine] = useState(2); // Start at empty line
  const [statusMessage, setStatusMessage] = useState('Ready to code! Use arrow keys to navigate.');

  const normalizeLine = (line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('print ') && !trimmed.includes('(')) {
      return `print("${trimmed.slice(6)}")`;
    }
    return line;
  };

  const handleLineUpdate = (lineIndex, newContent) => {
    setCodeLines(prev => {
      const updated = [...prev];
      updated[lineIndex] = normalizeLine(newContent);
      return updated;
    });
    setStatusMessage(`Updated line ${lineIndex + 1}`);
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
      const nonEmpty = codeLines.filter(l => l.trim() && !l.startsWith('#')).length;
      setStatusMessage(`${codeLines.length} lines, ${nonEmpty} code lines`);
    } else {
      setStatusMessage(`Unknown command: ${command}`);
    }
  };

  const value = {
    codeLines,
    activeLine,
    statusMessage,
    handleLineUpdate,
    handleActiveLineChange,
    executeCommand,
    setStatusMessage
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
