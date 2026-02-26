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
    outputHistory, setOutputHistory, outputIndex, setOutputIndex,
    outputMode, setOutputMode
  } = useApp();
  
  const codeRunnerRef = useRef(null);
  const searchRef = useRef({ mode: 'any', term: '', matches: [], idx: -1 });

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
    setTerminalOutput(`Output [${safeIdx + 1} of ${history.length}]: ${history[safeIdx]}`);
  }, [outputHistory, setTerminalOutput, setOutputIndex]);

  const enterOutputMode = useCallback((history = outputHistory) => {
    if (history.length === 0) {
      setTerminalOutput("No output available.");
      setOutputMode(false);
      return;
    }
    setOutputMode(true);
    setOutputIndex(-1);
    setTerminalOutput(
      `Viewing output. Use n/p to navigate. Press n for first line. Type out or exit to leave.`
    );
  }, [outputHistory, setOutputMode, setOutputIndex, setTerminalOutput]);

  const exitOutputMode = useCallback(() => {
    setOutputMode(false);
    setTerminalOutput("Exited output.");
    readActiveLine();
  }, [setOutputMode, setTerminalOutput, readActiveLine]);

  const nextOutput = useCallback(() => {
    if (outputHistory.length === 0) {
      setTerminalOutput("No output available.");
      return;
    }
    const nextIdx = outputIndex < 0 ? 0 : outputIndex + 1;
    displayOutputLine(nextIdx);
  }, [outputIndex, outputHistory, displayOutputLine, setTerminalOutput]);
  
  const prevOutput = useCallback(() => {
    if (outputHistory.length === 0) {
      setTerminalOutput("No output available.");
      return;
    }
    const prevIdx = outputIndex <= 0 ? 0 : outputIndex - 1;
    displayOutputLine(prevIdx);
  }, [outputIndex, outputHistory, displayOutputLine, setTerminalOutput]);

  // --- restored navigation functions ---
  const moveToNextIndent = useCallback(() => {
    if (outputMode) return nextOutput();

    const lines = code.split('\n');
    const indent = getIndentLevel(lines[activeLine]);
    const nextIdx = findNextLineWithIndent(lines, activeLine, indent);
    if (nextIdx !== -1) { handleActiveLineChange(nextIdx); readLine(nextIdx); }
    else setTerminalOutput('No next line with same indentation');
  }, [outputMode, nextOutput, code, activeLine, handleActiveLineChange, readLine, setTerminalOutput]);

  const moveToPrevIndent = useCallback(() => {
    if (outputMode) return prevOutput();

    const lines = code.split('\n');
    const indent = getIndentLevel(lines[activeLine]);
    const prevIdx = findPrevLineWithIndent(lines, activeLine, indent);
    if (prevIdx !== -1) { handleActiveLineChange(prevIdx); readLine(prevIdx); }
    else setTerminalOutput('No previous line with same indentation');
  }, [outputMode, prevOutput, code, activeLine, handleActiveLineChange, readLine, setTerminalOutput]);

  const moveOutOneLevel = useCallback(() => {
    if (outputMode) return exitOutputMode();

    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    for (let i = activeLine - 1; i >= 0; i--) {
      if (lines[i].trim() && getIndentLevel(lines[i]) < currentIndent) {
        handleActiveLineChange(i); readLine(i); return;
      }
    }
    setTerminalOutput('Already at root level');
  }, [outputMode, exitOutputMode, code, activeLine, handleActiveLineChange, readLine, setTerminalOutput]);

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

  const startSearch = useCallback((mode, term, matches) => {
    const t = (term || '').trim();
    if (!t) {
      setTerminalOutput(
        mode === 'func' ? t = 'f'
        : mode === 'com' ? t = 'c'
        : 'Usage: j <term>'
      );
      return;
    }

    if (!matches || matches.length === 0) {
      searchRef.current = { mode, term: t, matches: [], idx: -1 };
      setTerminalOutput(`No matches for "${t}".`);
      return;
    }

    searchRef.current = { mode, term: t, matches, idx: 0 };

    const lineIdx = matches[0];
    const lines = code.split('\n');
    handleActiveLineChange(lineIdx);

    if (matches.length > 1) {
      setTerminalOutput(`Found ${matches.length} matches for "${t}". Jumped to 1/${matches.length}. Use jn/jp to navigate. ` +
        `Line ${lineIdx + 1}: ${lines[lineIdx]}`);
    } else {
      setTerminalOutput(`Found 1 match for "${t}". Line ${lineIdx + 1} : ${lines[lineIdx]}.`);
    }
  }, [handleActiveLineChange, code, setTerminalOutput]);

  // --- restored jump functions ---
  const jumpToFunction = useCallback((name) => {
    const t = (name || '').trim();
    const lines = code.split('\n');
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      if (t && lines[i].includes(`def ${t}`)) matches.push(i);
    }
    startSearch('func', t, matches);
  }, [code, startSearch]);

  const jumpToComment = useCallback((name) => {
    const t = (name || '').trim();
    const lines = code.split('\n');
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      if (t && lines[i].includes('#') && lines[i].includes(t)) matches.push(i);
    }
    startSearch('com', t, matches);
  }, [code, startSearch]);

  const jumpToAny = useCallback((term) => {
    const t = (term || '').trim();
    const lines = code.split('\n');
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      if (t && lines[i].includes(t)) matches.push(i);
    }
    startSearch('any', t, matches);
  }, [code, startSearch]);

  const gotoMatch = useCallback((newIdx) => {
    const { matches, term } = searchRef.current;
    if (!matches || matches.length === 0) {
      setTerminalOutput('No active search. Use j <term>, j f <name>, or j c <term> first.');
      return;
    }
    const safeIdx = ((newIdx % matches.length) + matches.length) % matches.length; // wrap
    searchRef.current.idx = safeIdx;

    const lineIdx = matches[safeIdx];
    const lines = code.split('\n');
    handleActiveLineChange(lineIdx);
    setTerminalOutput(`Match ${safeIdx + 1}/${matches.length} for "${term}". Line ${lineIdx + 1}: ${lines[lineIdx]}`);
  }, [handleActiveLineChange, code, setTerminalOutput]);

  const jumpNextMatch = useCallback(() => {
    gotoMatch(searchRef.current.idx + 1);
  }, [gotoMatch]);

  const jumpPrevMatch = useCallback(() => {
    gotoMatch(searchRef.current.idx - 1);
  }, [gotoMatch]);

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
            return next;
        });
      }
      else if (type === 'terminated'){
        setOutputHistory(prev => {
          if (prev.length === 0) {
            setTerminalOutput(`Finished. ${result ?? ''}`.trim());
            setOutputMode(false);
          } else {
            // Enter output mode with instructions, don't auto-read line 1
            setOutputMode(true);
            setOutputIndex(-1);
            setTerminalOutput(
              `Viewing output. Use n/p to navigate. Press n for first line. Type out or exit to leave.`
            );
          }
          return prev;
        });
      }
      else if (type === 'error') {
        setTerminalOutput(`Error: ${error}`);
        setOutputMode(false);
      }
    };
    codeRunnerRef.current = worker;
  }, [setTerminalOutput, setOutputHistory]);

  const runCode = useCallback(() => {
    setOutputMode(false);
    setOutputHistory([]); setOutputIndex(-1);
    setTerminalOutput("Running...");
    initCodeRunner();
    codeRunnerRef.current?.postMessage({ type: 'run', data: code });
  }, [initCodeRunner, code, setOutputHistory, setTerminalOutput, setOutputIndex, setOutputMode]);

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
    jumpNextMatch, jumpPrevMatch,
    readActiveLine, readActiveBlock, readActiveFunction,
    loadFile, saveFile,
    initCodeRunner, runCode,
    nextOutput, prevOutput,
    enterOutputMode, exitOutputMode,
    loadDemo
  };
}