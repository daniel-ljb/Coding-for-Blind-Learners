import { useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';

// Helper: Get indentation level of a line
const getIndentLevel = (line) => {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
};

// Helper: Find next line with same indentation in same block
const findNextLineWithIndent = (lines, startIdx, targetIndent) => {
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines
    const indent = getIndentLevel(line);
    if (indent < targetIndent) break; // Left the block
    if (indent === targetIndent) return i;
  }
  return -1;
};

// Helper: Find previous line with same indentation in same block
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

// Helper: Get current code block (same indentation level)
const getBlock = (lines, startIdx) => {
  const targetIndent = getIndentLevel(lines[startIdx]);
  const start = startIdx;
  let end = startIdx;
  
  for (let i = startIdx + 1; i < lines.length; i++) {
    const indent = getIndentLevel(lines[i]);
    if (!lines[i].trim()) continue;
    if (indent < targetIndent) break;
    if (indent === targetIndent) end = i;
  }
  return { start, end };
};

// Helper: Find function by name
const findFunction = (lines, funcName) => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`def ${funcName}`)) return i;
  }
  return -1;
};

// Helper: Find comment by name
const findComment = (lines, commentName) => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('#') && lines[i].includes(commentName)) return i;
  }
  return -1;
};

export function useCodeActions() {
  const { code, setCode, activeLine, handleActiveLineChange, setTerminalOutput } = useApp();
  const codeRunnerRef = useRef(null);

  const createLineAfter = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine] ?? '');
    const insertIdx = activeLine + 1;
    lines.splice(insertIdx, 0, ' '.repeat(currentIndent));
    setCode(lines.join('\n'));
    handleActiveLineChange(insertIdx);
    setTerminalOutput('Created new line after');
  }, [code, activeLine, setCode, handleActiveLineChange, setTerminalOutput]);

  const createLineBefore = useCallback(() => {
    const lines = code.split('\n');
    const currentLine = lines[activeLine];
    const indent = getIndentLevel(currentLine);
    lines.splice(activeLine, 0, ' '.repeat(indent));
    setCode(lines.join('\n'));
    setTerminalOutput('Created new line before');
  }, [code, activeLine, setCode, setTerminalOutput]);

  const moveToNextIndent = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    const nextIdx = findNextLineWithIndent(lines, activeLine, currentIndent);
    if (nextIdx !== -1) {
      handleActiveLineChange(nextIdx);
      setTerminalOutput(`Moved to line ${nextIdx + 1}`);
    } else {
      setTerminalOutput('No next line with same indentation');
    }
  }, [code, activeLine, handleActiveLineChange, setTerminalOutput]);

  const moveToPrevIndent = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    const prevIdx = findPrevLineWithIndent(lines, activeLine, currentIndent);
    if (prevIdx !== -1) {
      handleActiveLineChange(prevIdx);
      setTerminalOutput(`Moved to line ${prevIdx + 1}`);
    } else {
      setTerminalOutput('No previous line with same indentation');
    }
  }, [code, activeLine, handleActiveLineChange, setTerminalOutput]);

  const moveOutOneLevel = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    if (currentIndent === 0) {
      setTerminalOutput('Already at root level');
      return;
    }

    let targetIndent = null;
    for (let i = activeLine - 1; i >= 0; i--) {
      if (!lines[i].trim()) continue;
      const indent = getIndentLevel(lines[i]);
      if (indent < currentIndent) {
        targetIndent = indent;
        break;
      }
    }

    if (targetIndent === null) {
      setTerminalOutput('No parent level found');
      return;
    }

    for (let i = activeLine - 1; i >= 0; i--) {
      if (!lines[i].trim()) continue;
      const indent = getIndentLevel(lines[i]);
      if (indent === targetIndent) {
        handleActiveLineChange(i);
        setTerminalOutput(`Moved up to line ${i + 1}`);
        return;
      }
      if (indent < targetIndent) break;
    }

    setTerminalOutput('No parent level found');
  }, [code, activeLine, handleActiveLineChange, setTerminalOutput]);

  const moveInOneLevel = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);

    let targetIndent = null;
    for (let i = activeLine + 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const indent = getIndentLevel(lines[i]);
      if (indent > currentIndent) {
        targetIndent = indent;
        break;
      }
      if (indent < currentIndent) break;
    }

    if (targetIndent === null) {
      setTerminalOutput('No child level found');
      return;
    }

    for (let i = activeLine + 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const indent = getIndentLevel(lines[i]);
      if (indent === targetIndent) {
        handleActiveLineChange(i);
        setTerminalOutput(`Moved in to line ${i + 1}`);
        return;
      }
      if (indent < currentIndent) break;
    }

    setTerminalOutput('No child level found');
  }, [code, activeLine, handleActiveLineChange, setTerminalOutput]);

  const jumpToFunction = useCallback((funcName) => {
    const lines = code.split('\n');
    const idx = findFunction(lines, funcName);
    if (idx !== -1) {
      handleActiveLineChange(idx);
      setTerminalOutput(`Jumped to function '${funcName}' at line ${idx + 1}`);
    } else {
      setTerminalOutput(`Function '${funcName}' not found`);
    }
  }, [code, handleActiveLineChange, setTerminalOutput]);

  const jumpToComment = useCallback((commentName) => {
    const lines = code.split('\n');
    const idx = findComment(lines, commentName);
    if (idx !== -1) {
      handleActiveLineChange(idx);
      setTerminalOutput(`Jumped to comment '${commentName}' at line ${idx + 1}`);
    } else {
      setTerminalOutput(`Comment '${commentName}' not found`);
    }
  }, [code, handleActiveLineChange, setTerminalOutput]);

  const readLine = useCallback(() => {
    const lines = code.split('\n');
    setTerminalOutput(`Line ${activeLine + 1}: ${lines[activeLine]}`);
  }, [code, activeLine, setTerminalOutput]);

  const readBlock = useCallback(() => {
    const lines = code.split('\n');
    const { start, end } = getBlock(lines, activeLine);
    setTerminalOutput(`Reading block (lines ${start + 1}-${end + 1})`);
  }, [code, activeLine, setTerminalOutput]);

  const readFunction = useCallback(() => {
    const lines = code.split('\n');
    let funcStart = activeLine;
    while (funcStart >= 0 && !lines[funcStart].includes('def ')) {
      funcStart--;
    }

    if (funcStart < 0 || !lines[funcStart].includes('def ')) {
      setTerminalOutput('Not in a function');
      return;
    }

    let funcEnd = funcStart;
    const defIndent = getIndentLevel(lines[funcStart]);
    for (let i = funcStart + 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const indent = getIndentLevel(lines[i]);
      if (indent <= defIndent) break;
      funcEnd = i;
    }

    setTerminalOutput(`Reading function (lines ${funcStart + 1}-${funcEnd + 1})`);
  }, [code, activeLine, setTerminalOutput]);

  const loadFile = useCallback(async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Python files', accept: { 'text/plain': ['.py'] } }],
      });
      const file = await fileHandle.getFile();
      const content = await file.text();
      setCode(content);
      handleActiveLineChange(0);
      setTerminalOutput(`Loaded file: ${file.name}`);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setTerminalOutput(`Error loading file: ${err.message}`);
      }
    }
  }, [setCode, handleActiveLineChange, setTerminalOutput]);

  const saveFile = useCallback((filename = 'code.py') => {
    try {
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setTerminalOutput(`Saved file: ${filename}`);
    } catch (error) {
      setTerminalOutput(`Error saving file: ${error.message}`);
    }
  }, [code, setTerminalOutput]);

  const initCodeRunner = useCallback(() => {
    if (codeRunnerRef.current) return;

    const codeRunner = new Worker(new URL('../codeExecution/python.worker.ts', import.meta.url));
    codeRunner.onmessage = (e) => {
      const { type, data, result, error } = e.data;
      if (type === 'output') setTerminalOutput(data);
      if (type === 'terminated') setTerminalOutput(result);
      if (type === 'error') setTerminalOutput(error);
    };

    codeRunnerRef.current = codeRunner;
  }, [setTerminalOutput]);

  const runCode = useCallback(() => {
    initCodeRunner();
    codeRunnerRef.current?.postMessage({ type: 'run', data: code });
  }, [initCodeRunner, code]);

  return {
    createLineAfter,
    createLineBefore,
    moveToNextIndent,
    moveToPrevIndent,
    moveOutOneLevel,
    moveInOneLevel,
    jumpToFunction,
    jumpToComment,
    readLine,
    readBlock,
    readFunction,
    loadFile,
    saveFile,
    initCodeRunner,
    runCode,
  };
}
