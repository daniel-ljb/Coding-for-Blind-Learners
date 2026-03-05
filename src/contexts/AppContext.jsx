import React, { createContext, useContext, useMemo, useState, useRef } from 'react';
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
    'print("Starting Fibonacci")',
    'print(fib(10))',
    'print("Done")'
  ].join('\n'));

  const [activeLine, setActiveLine] = useState(0);
  const [mode, setMode] = useState('edit');
  const [previousMode, setPreviousMode] = useState('edit');

  const [terminalOutput, setTerminalOutput_] = useState('');
  
  const [outputHistory, setOutputHistory] = useState([]);
  const [outputIndex, setOutputIndex] = useState(-1);

  const [argumentCallback, setArgumentCallback] = useState(null);

  const syntaxTree = useMemo(() => createTree(code), [code]);

  const announcerClarify = (msg) => msg.replace(/\bdef\b/g, 'deaf');

//   const [codeRunnerRef, setCodeRunnerRef] = useState(null);
  const codeRunnerRef = useRef(null)

  const speakLine = (msg) => {
    console.log(`Saying: ${msg}`)
    clearAnnouncer();
    announce(announcerClarify(msg));
  };

  const setTerminalOutput = (msg) => {
    setTerminalOutput_(msg);
  };

  const showAndSpeak = (msg) => {
    setTerminalOutput(msg);
    speakLine(msg);
  };

  const handleActiveLineChange = (newActiveLine) => {
    const lines = code.split('\n');
    if (newActiveLine < 0) return;
    if (newActiveLine >= lines.length) {
      setActiveLine(lines.length - 1);
      return;
    }
    //speakLine(lines[newActiveLine])
    setActiveLine(newActiveLine);
  };

  const value = {
    code, setCode,
    syntaxTree,
    activeLine, setActiveLine,
    handleActiveLineChange,
    speakLine,
    showAndSpeak,
    mode, setMode,
    previousMode, setPreviousMode,
    terminalOutput, setTerminalOutput,
    outputHistory, setOutputHistory,
    outputIndex, setOutputIndex,
    argumentCallback, setArgumentCallback,
    codeRunnerRef
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}