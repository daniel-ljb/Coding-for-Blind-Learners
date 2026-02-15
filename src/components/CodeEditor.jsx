import React from 'react';
import { useCode } from '../contexts/CodeContext';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-python'; 
import 'prismjs/themes/prism-dark.css';

import './CodeEditor.css'; 

function CodeEditor({ mode }) {
  const { code, setCode, activeLine, setActiveLine } = useCode();
  
  const highlightPython = (code) => {
    return highlight(code, languages.python).
      split('\n')
      .map((line, idx) => {
        const isActive = idx === activeLine;
        if (isActive) {
          return `<span class='editorLineNumber'>${idx + 1}</span><div class='bg-blue-900 bg-opacity-50'>${line ? line : ' '}</div>`;
        }
        return `<span class='editorLineNumber'>${idx + 1}</span>${line}\n`;
      })
      .join('');
  };

  const updateActiveLine = () => {
    const textarea = document.getElementById('codeArea');
    if (!textarea) return;
    const selectionStart = textarea.selectionStart;
    const newActiveLine = code.substr(0, selectionStart).split('\n').length - 1;
    setActiveLine(newActiveLine);
  };

  return (
    <Editor
      value={code}
      onValueChange={setCode}
      highlight={highlightPython}
      padding={10}
      className="h-full overflow-auto text-gray-300 font-mono editor"
      readOnly={mode !== 'edit'}
      textareaId='codeArea'
      onKeyDown={updateActiveLine}
      onKeyUp={updateActiveLine}
      onClick={updateActiveLine}
      onScroll={updateActiveLine}
    />
  );
}

export default CodeEditor;
