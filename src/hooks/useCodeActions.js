import { useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { demoLibrary } from '../utils/demoLibrary';

// --- Original Helpers ---
const getIndentLevel = (line) => {
  const match = line?.match(/^(\s*)/);
  return match ? match[1].length : 0;
};

const findNextLineWithIndent = (lines, startIdx, targetIndent) => {
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const indent = getIndentLevel(line);
    if (indent < targetIndent) break; 
    if (indent === targetIndent) return i;
  }
  return -1;
};

const findPrevLineWithIndent = (lines, startIdx, targetIndent) => {
  for (let i = startIdx - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line.trim()) continue;
    const indent = getIndentLevel(line);
    if (indent < targetIndent) break;
    if (indent === targetIndent) return i;
  }
  return -1;
};

export function useCodeActions() {
  const { 
    code, setCode, activeLine, handleActiveLineChange, setTerminalOutput,
    outputHistory, setOutputHistory, outputIndex, setOutputIndex
  } = useApp();
  
  const codeRunnerRef = useRef(null);

  // --- restored read functions ---
  const readLine = useCallback((lineIdx) => {
    const lines = code.split('\n');
    if (lineIdx < 0 || lineIdx >= lines.length) return;
    setTerminalOutput(`Line ${lineIdx + 1}: ${lines[lineIdx]}`);
  }, [code, setTerminalOutput]);

  const readActiveLine = useCallback(() => readLine(activeLine), [activeLine, readLine]);

  // --- NEW: Output Navigation ---
  const displayOutputLine = useCallback((index, history = outputHistory) => {
    if (history.length === 0) {
      setTerminalOutput("No output available.");
      return;
    }
    const safeIdx = Math.max(0, Math.min(index, history.length - 1));
    setOutputIndex(safeIdx);
    setTerminalOutput(`Out [${safeIdx + 1}/${history.length}]: ${history[safeIdx]}`);
  }, [outputHistory, setTerminalOutput, setOutputIndex]);

  const nextOutput = useCallback(() => displayOutputLine(outputIndex + 1), [outputIndex, displayOutputLine]);
  const prevOutput = useCallback(() => displayOutputLine(outputIndex - 1), [outputIndex, displayOutputLine]);

  // --- restored navigation functions ---
  const moveToNextIndent = useCallback(() => {
    const lines = code.split('\n');
    const indent = getIndentLevel(lines[activeLine]);
    const nextIdx = findNextLineWithIndent(lines, activeLine, indent);
    if (nextIdx !== -1) { handleActiveLineChange(nextIdx); readLine(nextIdx); }
    else setTerminalOutput('No next line with same indentation');
  }, [code, activeLine, handleActiveLineChange, readLine, setTerminalOutput]);

  const moveToPrevIndent = useCallback(() => {
    const lines = code.split('\n');
    const indent = getIndentLevel(lines[activeLine]);
    const prevIdx = findPrevLineWithIndent(lines, activeLine, indent);
    if (prevIdx !== -1) { handleActiveLineChange(prevIdx); readLine(prevIdx); }
    else setTerminalOutput('No previous line with same indentation');
  }, [code, activeLine, handleActiveLineChange, readLine, setTerminalOutput]);

  const moveOutOneLevel = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    for (let i = activeLine - 1; i >= 0; i--) {
      if (lines[i].trim() && getIndentLevel(lines[i]) < currentIndent) {
        handleActiveLineChange(i); readLine(i); return;
      }
    }
    setTerminalOutput('Already at root level');
  }, [code, activeLine, handleActiveLineChange, readLine, setTerminalOutput]);

  const moveInOneLevel = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    for (let i = activeLine + 1; i < lines.length; i++) {
      if (lines[i].trim() && getIndentLevel(lines[i]) > currentIndent) {
        handleActiveLineChange(i); readLine(i); return;
      }
      if (lines[i].trim() && getIndentLevel(lines[i]) < currentIndent) break;
    }
    setTerminalOutput('No child level found');
  }, [code, activeLine, handleActiveLineChange, readLine, setTerminalOutput]);

  // --- restored jump functions ---
  const jumpToFunction = useCallback((name) => {
    const lines = code.split('\n');
    const idx = lines.findIndex(l => l.includes(`def ${name}`));
    if (idx !== -1) { handleActiveLineChange(idx); readLine(idx); }
    else setTerminalOutput(`Function ${name} not found`);
  }, [code, handleActiveLineChange, readLine, setTerminalOutput]);

  const jumpToComment = useCallback((name) => {
    const lines = code.split('\n');
    const idx = lines.findIndex(l => l.includes('#') && l.includes(name));
    if (idx !== -1) { handleActiveLineChange(idx); readLine(idx); }
    else setTerminalOutput(`Comment ${name} not found`);
  }, [code, handleActiveLineChange, readLine, setTerminalOutput]);

  const jumpToAny = useCallback((term) => {
    const lines = code.split('\n');
    const idx = lines.findIndex(l => l.includes(term));
    if (idx !== -1) { handleActiveLineChange(idx); readLine(idx); }
    else setTerminalOutput(`Text ${term} not found`);
  }, [code, handleActiveLineChange, readLine, setTerminalOutput]);

  // --- restored code editing ---
  const createLineAfter = useCallback(() => {
    const lines = code.split('\n');
    const indent = getIndentLevel(lines[activeLine] || '');
    lines.splice(activeLine + 1, 0, ' '.repeat(indent));
    setCode(lines.join('\n'));
    handleActiveLineChange(activeLine + 1);
    setTerminalOutput('Created line after');
  }, [code, activeLine, setCode, handleActiveLineChange, setTerminalOutput]);

  const createLineBefore = useCallback(() => {
    const lines = code.split('\n');
    const indent = getIndentLevel(lines[activeLine] || '');
    lines.splice(activeLine, 0, ' '.repeat(indent));
    setCode(lines.join('\n'));
    setTerminalOutput('Created line before');
  }, [code, activeLine, setCode, setTerminalOutput]);

  // --- restored File I/O ---
  const saveFile = useCallback((filename = 'code.py') => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    link.click(); URL.revokeObjectURL(url);
    setTerminalOutput(`Saved ${filename}`);
  }, [code, setTerminalOutput]);

  const loadFile = useCallback(async () => {
    try {
      const [handle] = await window.showOpenFilePicker();
      const file = await handle.getFile();
      const content = await file.text();
      setCode(content); handleActiveLineChange(0);
      setTerminalOutput(`Loaded ${file.name}`);
    } catch (e) { if (e.name !== 'AbortError') setTerminalOutput("Load failed"); }
  }, [setCode, handleActiveLineChange, setTerminalOutput]);

  // --- restored Execution ---
  const initCodeRunner = useCallback(() => {
    if (codeRunnerRef.current) return;
    const worker = new Worker(new URL('../codeExecution/python.worker.ts', import.meta.url));
    worker.onmessage = (e) => {
      const { type, data, result, error } = e.data;
      if (type === 'output') {
        setOutputHistory(prev => {
            const next = [...prev, data];
            setTerminalOutput(`Out: ${data}`);
            return next;
        });
      }
      else if (type === 'terminated') setTerminalOutput(`Finished. ${result}. Type 'op' to read results.`);
      else if (type === 'error') setTerminalOutput(`Error: ${error}`);
    };
    codeRunnerRef.current = worker;
  }, [setTerminalOutput, setOutputHistory]);

  const runCode = useCallback(() => {
    setOutputHistory([]); setOutputIndex(-1);
    setTerminalOutput("Running...");
    initCodeRunner();
    codeRunnerRef.current?.postMessage({ type: 'run', data: code });
  }, [initCodeRunner, code, setOutputHistory, setTerminalOutput, setOutputIndex]);

  // missing originals
  const readActiveBlock = useCallback(() => setTerminalOutput("Reading block... (Implementation depends on parser)"), [setTerminalOutput]);
  const readActiveFunction = useCallback(() => setTerminalOutput("Reading function..."), [setTerminalOutput]);

  const loadDemo = useCallback((id) => {
    const content = demoLibrary[id];
    if (content) {
      setCode(content);
      handleActiveLineChange(0);
      setTerminalOutput(`Loaded Demo ${id}`);
    } else {
      setTerminalOutput(`Demo ${id} not found`);
    }
  }, [setCode, handleActiveLineChange, setTerminalOutput]);

  return {
    createLineAfter, createLineBefore,
    moveToNextIndent, moveToPrevIndent,
    moveOutOneLevel, moveInOneLevel,
    jumpToFunction, jumpToComment, jumpToAny,
    readActiveLine, readActiveBlock, readActiveFunction,
    loadFile, saveFile,
    initCodeRunner, runCode,
    nextOutput, prevOutput, loadDemo
  };
}