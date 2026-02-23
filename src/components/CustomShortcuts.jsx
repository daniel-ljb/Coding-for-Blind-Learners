import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useCodeActions } from '../hooks/useCodeActions';

function CustomShortcuts() {
  const { code, activeLine, mode, setMode } = useApp();
  const {
    createLineAfter,
    createLineBefore,
    moveToNextIndent,
    moveToPrevIndent,
    moveOutOneLevel,
    moveInOneLevel,
    readActiveLine,
    readActiveBlock,
    readActiveFunction,
    saveFile,
  } = useCodeActions();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+M: Toggle mode
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setMode((prev) => {
          if (prev === 'edit') return 'terminal';
          return 'edit';
        });
      }
      // Shift+ArrowUp: Create line before
      else if (e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault();
        createLineBefore();
      }
      // Shift+ArrowDown: Create line after
      else if (e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        createLineAfter();
      }
      // Ctrl+L: Read line
      else if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        readActiveLine();
      }
      // Ctrl+B: Read block
      else if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        readActiveBlock();
      }
      // Ctrl+F: Read function
      else if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        readActiveFunction();
      }
      // Ctrl+S: Save file
      else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [code, activeLine, mode, setMode, createLineAfter, createLineBefore, moveToNextIndent, moveToPrevIndent, moveOutOneLevel, moveInOneLevel, readActiveLine, readActiveBlock, readActiveFunction, saveFile]);

  return null;
}

export default CustomShortcuts;
