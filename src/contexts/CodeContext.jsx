import React, { createContext, useContext, useMemo, useState } from 'react';
import { createTree } from '../utils/pythonParser';

const CodeContext = createContext(null);

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
  const [statusMessage, setStatusMessage] = useState('');
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

  const createLineAfter = () => {
    const lines = code.split('\n');
    const currentLine = lines[activeLine];
    const indent = getIndentLevel(currentLine);
    lines.splice(activeLine + 1, 0, ' '.repeat(indent));
    setCode(lines.join('\n'));
    setActiveLine(activeLine + 1);
    setStatusMessage('Created new line after');
  };

  const createLineBefore = () => {
    const lines = code.split('\n');
    const currentLine = lines[activeLine];
    const indent = getIndentLevel(currentLine);
    lines.splice(activeLine, 0, ' '.repeat(indent));
    setCode(lines.join('\n'));
    setStatusMessage('Created new line before');
  };

  const moveToNextIndent = () => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    const nextIdx = findNextLineWithIndent(lines, activeLine, currentIndent);
    if (nextIdx !== -1) {
      handleActiveLineChange(nextIdx);
      setStatusMessage(`Moved to line ${nextIdx + 1}`);
    } else {
      setStatusMessage('No next line with same indentation');
    }
  };

  const moveToPrevIndent = () => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    const prevIdx = findPrevLineWithIndent(lines, activeLine, currentIndent);
    if (prevIdx !== -1) {
      handleActiveLineChange(prevIdx);
      setStatusMessage(`Moved to line ${prevIdx + 1}`);
    } else {
      setStatusMessage('No previous line with same indentation');
    }
  };

  const moveOutOneLevel = () => {
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
  };

  const moveInOneLevel = () => {
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
  };

  const jumpToFunction = (funcName) => {
    const lines = code.split('\n');
    const idx = findFunction(lines, funcName);
    if (idx !== -1) {
      handleActiveLineChange(idx);
      setStatusMessage(`Jumped to function '${funcName}' at line ${idx + 1}`);
    } else {
      setStatusMessage(`Function '${funcName}' not found`);
    }
  };

  const jumpToComment = (commentName) => {
    const lines = code.split('\n');
    const idx = findComment(lines, commentName);
    if (idx !== -1) {
      handleActiveLineChange(idx);
      setStatusMessage(`Jumped to comment '${commentName}' at line ${idx + 1}`);
    } else {
      setStatusMessage(`Comment '${commentName}' not found`);
    }
  };

  const readLine = () => {
    const lines = code.split('\n');
    setStatusMessage(`Line ${activeLine + 1}: ${lines[activeLine]}`);
    // TODO: Implement actual text-to-speech or screen reader announcement
  };

  const readBlock = () => {
    const lines = code.split('\n');
    const { start, end } = getBlock(lines, activeLine);
    const blockText = lines.slice(start, end + 1).join('\n');
    setStatusMessage(`Reading block (lines ${start + 1}-${end + 1})`);
    // TODO: Implement actual text-to-speech or screen reader announcement
  };

  const readFunction = () => {
    const lines = code.split('\n');
    const currentIndent = getIndentLevel(lines[activeLine]);
    
    // Find function definition
    let funcStart = activeLine;
    while (funcStart >= 0 && !lines[funcStart].includes('def ')) {
      funcStart--;
    }
    
    if (funcStart < 0 || !lines[funcStart].includes('def ')) {
      setStatusMessage('Not in a function');
      return;
    }

    // Find function end (next line with less or equal indentation that's not empty)
    let funcEnd = funcStart;
    const defIndent = getIndentLevel(lines[funcStart]);
    for (let i = funcStart + 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const indent = getIndentLevel(lines[i]);
      if (indent <= defIndent) break;
      funcEnd = i;
    }

    const funcText = lines.slice(funcStart, funcEnd + 1).join('\n');
    setStatusMessage(`Reading function (lines ${funcStart + 1}-${funcEnd + 1})`);
    // TODO: Implement actual text-to-speech or screen reader announcement
  };

  const loadFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setCode(content);
      setActiveLine(0);
      setStatusMessage(`Loaded file: ${file.name}`);
    };
    reader.onerror = () => {
      setStatusMessage(`Error reading file: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const getCommandHelp = (cmdName) => {
    const commands = {
      'next': 'next / down - Go to next line with same indentation',
      'prev': 'prev / up - Go to previous line with same indentation',
      'leave': 'leave / left - Move up one indentation level',
      'in': 'in / right - Move down one indentation level',
      'new line after': 'new line after / Shift+Down - Create new line after current',
      'new line before': 'new line before / Shift+Up - Create new line before current',
      'jump func': 'jump func "name" - Jump to function with given name',
      'jump com': 'jump com "name" - Jump to comment with given name',
      'read line': 'read line / Ctrl+L - Read current line',
      'read block': 'read block / Ctrl+B - Read current block',
      'read func': 'read func / Ctrl+F - Read current function',
      'load': 'load - Open file picker to load a Python file'
    };
    return commands[cmdName] || 'Command not found';
  };

  const value = {
    code,
    setCode,
    syntaxTree,
    activeLine,
    setActiveLine,
    handleActiveLineChange,
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
    statusMessage,
    setStatusMessage,
    getCommandHelp,
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
