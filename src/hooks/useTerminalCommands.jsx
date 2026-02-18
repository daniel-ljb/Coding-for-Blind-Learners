import { useState, useCallback } from 'react';
import { useCode } from '../contexts/CodeContext.jsx';
import {
  getIndentLevel,
  findNextLineWithIndent,
  findPrevLineWithIndent,
  getBlock,
  findFunction,
  findComment,
  getCommandHelp,
  parseCommand,
} from '../utils/terminalCommands.jsx';

/**
 * Hook that provides all terminal command implementations and status message.
 * Code state (code, activeLine) comes from CodeContext; statusMessage is local to the terminal.
 */
export function useTerminalCommands() {
  const { code, setCode, activeLine, setActiveLine } = useCode();
  const [statusMessage, setStatusMessage] = useState('');

  const handleActiveLineChange = useCallback(
    (newActiveLine) => {
      const lines = code.split('\n');
      if (newActiveLine < 0) return;
      if (newActiveLine >= lines.length) {
        setActiveLine(Math.max(0, lines.length - 1));
        return;
      }
      setActiveLine(newActiveLine);
    },
    [code, setActiveLine]
  );

  const createLineAfter = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    const nextIdx = findNextLineWithIndent(lines, activeLine, currentIndent);
    const target = nextIdx !== -1 ? nextIdx : activeLine + 1;
    const indent = getIndentLevel(lines[target] ?? '');
    lines.splice(target, 0, ' '.repeat(indent));
    setCode(lines.join('\n'));
    handleActiveLineChange(target);
    setStatusMessage('Created new line after');
  }, [code, activeLine, setCode, handleActiveLineChange]);

  const createLineBefore = useCallback(() => {
    const lines = code.split('\n');
    const currentLine = lines[activeLine];
    const indent = getIndentLevel(currentLine);
    lines.splice(activeLine, 0, ' '.repeat(indent));
    setCode(lines.join('\n'));
    setStatusMessage('Created new line before');
  }, [code, activeLine, setCode]);

  const moveToNextIndent = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    const nextIdx = findNextLineWithIndent(lines, activeLine, currentIndent);
    if (nextIdx !== -1) {
      handleActiveLineChange(nextIdx);
      setStatusMessage(`Moved to line ${nextIdx + 1}`);
    } else {
      setStatusMessage('No next line with same indentation');
    }
  }, [code, activeLine, handleActiveLineChange]);

  const moveToPrevIndent = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    const prevIdx = findPrevLineWithIndent(lines, activeLine, currentIndent);
    if (prevIdx !== -1) {
      handleActiveLineChange(prevIdx);
      setStatusMessage(`Moved to line ${prevIdx + 1}`);
    } else {
      setStatusMessage('No previous line with same indentation');
    }
  }, [code, activeLine, handleActiveLineChange]);

  const moveOutOneLevel = useCallback(() => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    if (currentIndent === 0) {
      setStatusMessage('Already at root level');
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
      setStatusMessage('No parent level found');
      return;
    }
    for (let i = activeLine - 1; i >= 0; i--) {
      if (!lines[i].trim()) continue;
      const indent = getIndentLevel(lines[i]);
      if (indent === targetIndent) {
        handleActiveLineChange(i);
        setStatusMessage(`Moved up to line ${i + 1}`);
        return;
      }
      if (indent < targetIndent) break;
    }
    setStatusMessage('No parent level found');
  }, [code, activeLine, handleActiveLineChange]);

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
      setStatusMessage('No child level found');
      return;
    }
    for (let i = activeLine + 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const indent = getIndentLevel(lines[i]);
      if (indent === targetIndent) {
        handleActiveLineChange(i);
        setStatusMessage(`Moved in to line ${i + 1}`);
        return;
      }
      if (indent < currentIndent) break;
    }
    setStatusMessage('No child level found');
  }, [code, activeLine, handleActiveLineChange]);

  const jumpToFunction = useCallback(
    (funcName) => {
      const lines = code.split('\n');
      const idx = findFunction(lines, funcName);
      if (idx !== -1) {
        handleActiveLineChange(idx);
        setStatusMessage(`Jumped to function '${funcName}' at line ${idx + 1}`);
      } else {
        setStatusMessage(`Function '${funcName}' not found`);
      }
    },
    [code, handleActiveLineChange]
  );

  const jumpToComment = useCallback(
    (commentName) => {
      const lines = code.split('\n');
      const idx = findComment(lines, commentName);
      if (idx !== -1) {
        handleActiveLineChange(idx);
        setStatusMessage(`Jumped to comment '${commentName}' at line ${idx + 1}`);
      } else {
        setStatusMessage(`Comment '${commentName}' not found`);
      }
    },
    [code, handleActiveLineChange]
  );

  const readLine = useCallback(() => {
    const lines = code.split('\n');
    setStatusMessage(`Line ${activeLine + 1}: ${lines[activeLine]}`);
  }, [code, activeLine]);

  const readBlock = useCallback(() => {
    const lines = code.split('\n');
    const { start, end } = getBlock(lines, activeLine);
    setStatusMessage(`Reading block (lines ${start + 1}-${end + 1})`);
  }, [code, activeLine]);

  const readFunction = useCallback(() => {
    const lines = code.split('\n');
    let funcStart = activeLine;
    while (funcStart >= 0 && !lines[funcStart].includes('def ')) {
      funcStart--;
    }
    if (funcStart < 0 || !lines[funcStart].includes('def ')) {
      setStatusMessage('Not in a function');
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
    setStatusMessage(`Reading function (lines ${funcStart + 1}-${funcEnd + 1})`);
  }, [code, activeLine]);

  const loadFile = useCallback(
    (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target.result);
        setActiveLine(0);
        setStatusMessage(`Loaded file: ${file.name}`);
      };
      reader.onerror = () => {
        setStatusMessage(`Error reading file: ${file.name}`);
      };
      reader.readAsText(file);
    },
    [setCode, setActiveLine]
  );

  const saveFile = useCallback(
    (filename = 'code.py') => {
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
        setStatusMessage(`Saved file: ${filename}`);
      } catch (error) {
        setStatusMessage(`Error saving file: ${error.message}`);
      }
    },
    [code]
  );

  /** Run a command string. Pass triggerLoad, handleRun, handleClear from the terminal (or no-ops). */
  const executeCommand = useCallback(
    (cmd, { triggerLoad = () => {}, handleRun = () => {}, handleClear = () => {} } = {}) => {
      const parsed = parseCommand(cmd, {
        moveToNextIndent,
        moveToPrevIndent,
        moveOutOneLevel,
        moveInOneLevel,
        createLineAfter,
        createLineBefore,
        jumpToFunction,
        jumpToComment,
        readLine,
        readBlock,
        readFunction,
        saveFile,
        getCommandHelp,
        triggerLoad,
        handleRun,
        handleClear,
      });
      if (parsed.type === 'action') parsed.action();
    },
    [
      moveToNextIndent,
      moveToPrevIndent,
      moveOutOneLevel,
      moveInOneLevel,
      createLineAfter,
      createLineBefore,
      jumpToFunction,
      jumpToComment,
      readLine,
      readBlock,
      readFunction,
      saveFile,
    ]
  );

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
    statusMessage,
    setStatusMessage,
    getCommandHelp,
    executeCommand,
  };
}
