import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import 'prismjs/themes/prism-dark.css'; 
import './CodeEditor.css'; 
import { useCodeActions } from '../hooks/useCodeActions';

const BLOCK_RULES = {
  "if": { "hasExpression": true, "isContinuation": false},
  "elif": { "hasExpression": true, "isContinuation": true, "validParents": ["if", "elif"]},
  "else": { "hasExpression": false, "isContinuation": true, "validParents": ["if", "elif", "try", "except", "for", "while"]},
  "def": { "hasExpression": true, "isContinuation": false },
  "class": { "hasExpression": true, "isContinuation": false},
  "for": { "hasExpression": true, "isContinuation": false },
  "while": { "hasExpression": true, "isContinuation": false},
  "with": { "hasExpression": true, "isContinuation": false},
  "try": { "hasExpression": false, "isContinuation": false },
  "except": { "hasExpression": true, "isContinuation": true, "validParents": ["try", "except"]},
  "finally": { "hasExpression": false, "isContinuation": true, "validParents": ["try", "except", "else"] },
  "match": { "hasExpression": true, "isContinuation": false},
  "case": { "hasExpression": true, "isContinuation": true, "validParents": ["match", "case"] }
};

const BLOCK_HINT = {
  "if": "Enter if condition",
  "elif": "Enter elif condition",
  "def": "Enter function signature",
  "class": "Enter class",
  "for": "Enter for loop expression",
  "while": "Enter while loop condition",
  "with": "Enter with statement expression",
  "except": "Enter exception type",
  "match": "Enter match expression",
  "case": "Enter case pattern"
}

function CodeEditor() {
  const { code, setCode, activeLine, setActiveLine, syntaxTree, mode } = useApp();
  const [nodes, setNodes] = useState([]);
  const inputRefs = useRef({});
  const lastSyncedCode = useRef(code);
  const idCounter = useRef(0);

  const {
    createLineAfter,
    moveToPrevIndent,
    moveToNextIndent,
  } = useCodeActions();

  const { setTerminalOutput } = useApp();

  // auto focus on mode change
  useEffect(() => {
    if (mode === 'edit') {
      const activeNode = nodes[activeLine];
      console.log('Active Node on Mode Change:', activeNode);
      if (activeNode) {
        inputRefs.current[activeNode.id]?.focus();
        if (BLOCK_HINT[activeNode.keyword] && activeNode.content === '') {
          setTerminalOutput(BLOCK_HINT[activeNode.keyword]);
        }
      }
    }
  }, [mode]);

  const makeId = () => `line-${idCounter.current++}`;

  const splitComment = (line) => {
    let inString = false;
    let quoteChar = null;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if ((char === '"' || char === "'") && line[i - 1] !== '\\') {
        if (!inString) { inString = true; quoteChar = char; }
        else if (char === quoteChar) { inString = false; }
      }
      if (char === '#' && !inString) return [line.slice(0, i), line.slice(i + 1)];
    }
    return [line, null];
  };

  const getIndentLevel = (line) => {
    const match = line.match(/^(\s*)/);
    return match ? Math.floor(match[1].length / 4) : 0;
  };

  const buildNodesFromCode = (source) => {
    const lines = source.split('\n');
    return lines.map((line) => {
      const [codePart, commentPart] = splitComment(line);
      const indent = getIndentLevel(line);
      const trimmedCode = codePart.trim();
      const firstWord = trimmedCode.split(/\s|:/)[0];
      
      const common = {
        id: makeId(),
        comment: commentPart !== null ? commentPart.trim() : null,
        indent
      };

      if (BLOCK_RULES[firstWord]) {
        const hasExpr = BLOCK_RULES[firstWord].hasExpression;
        const content = hasExpr ? trimmedCode.slice(firstWord.length, trimmedCode.lastIndexOf(':')).trim() : '';
        return { ...common, type: 'keyword', keyword: firstWord, content };
      }
      return { ...common, type: 'command', content: trimmedCode };
    });
  };
  
  // When code changes by external means (like terminal commands), update nodes
  useEffect(() => {
    if (code === lastSyncedCode.current) return;
    idCounter.current = 0;
    setNodes(buildNodesFromCode(code));
    lastSyncedCode.current = code;
  }, [code]);

  // When nodes change (like user edits), update code
  useEffect(() => {
    const pythonString = nodes.map(node => {
      const spaces = "    ".repeat(node.indent);
      let line = node.type === 'keyword' 
        ? `${spaces}${node.keyword}${node.content ? ` ${node.content}` : ''}:`
        : (node.content?.trim() || node.indent > 0 ? `${spaces}${node.content}` : "");
      
      if (node.comment !== null) {
        const separator = line.trim() ? "    " : "";
        line = `${line}${separator}# ${node.comment}`;
      }
      return line;
    }).join('\n');

    if (pythonString !== lastSyncedCode.current) {
      lastSyncedCode.current = pythonString;
      setCode(pythonString);
    }
  }, [nodes]);

  const handleKeyDown = (e, node, index) => {
    const { selectionStart, value } = e.target;
    setActiveLine(index);

    const isInsideString = () => {
      let quotes = 0;
      for (let i = 0; i < selectionStart; i++) {
        if (value[i] === '"' || value[i] === "'") quotes++;
      }
      return quotes % 2 !== 0;
    };

    // 1. Comment Triggers (# or Tab at end)
    const isAtEnd = selectionStart === value.length;
    if ((e.key === '#' && !isInsideString()) || (e.key === 'Tab' && !e.shiftKey && isAtEnd)) {
      e.preventDefault();
      const newNodes = [...nodes];
      newNodes[index] = { ...node, comment: node.comment || "" };
      setNodes(newNodes);
      setTimeout(() => inputRefs.current[`${node.id}-cmt`]?.focus(), 0);
      return;
    }

    // 2. Keyword Conversion
    const trimmed = node.content?.trim().toLowerCase();
    if (e.key === ' ' && node.type === 'command' && BLOCK_RULES[trimmed]) {
      e.preventDefault();
      const newNodes = [...nodes];
      newNodes[index] = { ...node, type: 'keyword', keyword: trimmed, content: '' };
      setNodes(newNodes);
      if (BLOCK_HINT[trimmed])
        setTerminalOutput(BLOCK_HINT[trimmed]);
      setTimeout(() => inputRefs.current[node.id]?.focus(), 0);
    }

    // 3. New Line logic
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextId = Math.random().toString(36).substr(2, 9);
      const newNodes = [...nodes];
      newNodes.splice(index + 1, 0, {
        id: nextId, type: 'command', content: '', 
        indent: node.type === 'keyword' ? node.indent + 1 : node.indent,
        comment: null
      });
      setNodes(newNodes);
      setTimeout(() => inputRefs.current[nextId]?.focus(), 0);
    }

    // 4. Backspace: Indent Reduction & Line Deletion
    if (e.key === 'Backspace' && selectionStart === 0) {
      if (node.indent > 0) {
        e.preventDefault();
        setNodes(nodes.map((n, i) => i === index ? { ...n, indent: n.indent - 1 } : n));
      } else if (index > 0 && !node.content && node.comment === null) {
        // Only delete if totally empty and at indent 0
        e.preventDefault();
        const prevIndex = index - 1;
        const newNodes = nodes.filter((_, i) => i !== index);
        setNodes(newNodes);
        setActiveLine(prevIndex);
        setTimeout(() => {
          const prev = newNodes[prevIndex];
          const target = prev.comment !== null ? `${prev.id}-cmt` : prev.id;
          inputRefs.current[target]?.focus();
        }, 0);
      }
    }

    // 5. Navigation 
    if (e.key === 'ArrowUp' && !e.shiftKey && !e.ctrlKey && !e.altKey && index > 0) {
      e.preventDefault();
      moveToPrevIndent();
    }
    if (e.key === 'ArrowDown' && !e.shiftKey && !e.ctrlKey && !e.altKey && index < nodes.length - 1) {
      e.preventDefault();
      moveToNextIndent();
    }
  };

  return (
    <div className="code-editor-container h-full overflow-auto bg-[#0d1117] p-4 font-mono text-sm">
      <div className="space-y-1">
        {nodes.map((node, index) => (
          <div 
            key={node.id} 
            className={`group flex items-center min-h-[24px] ${index === activeLine ? 'bg-blue-900/20' : ''}`}
            onClick={() => setActiveLine(index)}
          >
            <span className="w-8 mr-4 text-right opacity-20 select-none text-xs">{index + 1}</span>
            <div className="flex items-center flex-1" style={{ paddingLeft: `${node.indent * 32}px` }}>
              <div className="flex items-center">
                {node.type === 'keyword' ? (
                  <>
                    <span className="font-bold text-[#ff7b72]">{node.keyword}</span>
                    {BLOCK_RULES[node.keyword].hasExpression && (
                      <input
                        ref={el => inputRefs.current[node.id] = el}
                        className="bg-[#161b22] border border-[#30363d] text-[#d29922] ml-2 px-1 rounded outline-none focus:border-[#58a6ff] min-w-[100px]"
                        style={{ width: `${Math.max(node.content.length + 2, 10)}ch` }}
                        value={node.content}
                        onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? {...n, content: e.target.value} : n))}
                        onKeyDown={(e) => handleKeyDown(e, node, index)}
                      />
                    )}
                    <span className="text-gray-500">:</span>
                  </>
                ) : (
                  <div className="flex items-center">
                    <span className="text-gray-600 opacity-40 mr-2">❯</span>
                    <input
                      ref={el => inputRefs.current[node.id] = el}
                      className="bg-transparent outline-none text-[#7ee787]"
                      style={{ width: `${Math.max(node.content?.length || 0, 15)}ch` }}
                      value={node.content || ''}
                      onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? {...n, content: e.target.value} : n))}
                      onKeyDown={(e) => handleKeyDown(e, node, index)}
                    />
                  </div>
                )}
              </div>

              {node.comment !== null && (
                <div className="flex items-center ml-8 text-gray-500 italic">
                  <span className="mr-2 opacity-50">#</span>
                  <input
                    ref={el => inputRefs.current[`${node.id}-cmt`] = el}
                    className="bg-transparent outline-none border-b border-transparent focus:border-gray-700 text-gray-500 w-64"
                    value={node.comment}
                    placeholder="comment..."
                    onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? {...n, comment: e.target.value} : n))}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && node.comment === '') {
                        e.preventDefault();
                        setNodes(nodes.map(n => n.id === node.id ? {...n, comment: null} : n));
                        setTimeout(() => inputRefs.current[node.id]?.focus(), 0);
                      }
                      if (['Enter', 'ArrowUp', 'ArrowDown'].includes(e.key)) handleKeyDown(e, node, index);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CodeEditor;