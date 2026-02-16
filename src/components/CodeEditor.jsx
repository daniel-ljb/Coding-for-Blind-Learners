import React, { useState, useRef, useEffect } from 'react';
import { useCode } from '../contexts/CodeContext';
// Prism is kept for potential styling or manual highlighting if needed
import 'prismjs/themes/prism-dark.css'; 
import './CodeEditor.css'; 

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

function CodeEditor({ mode }) {
  // Access global code context
  const { code, setCode, activeLine, setActiveLine, syntaxTree } = useCode();
  
  // Local state for the node-based structure
  const [nodes, setNodes] = useState([]);
  const [error, setError] = useState(null);
  const inputRefs = useRef({});
  const lastSyncedCode = useRef(code);
  const idCounter = useRef(0);

  const makeId = () => `line-${idCounter.current++}`;

  const getIndentLevel = (line) => {
    const match = line.match(/^(\s*)/);
    return match ? Math.floor(match[1].length / 4) : 0;
  };

  const getLineStarts = (text) => {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') starts.push(i + 1);
    }
    return starts;
  };

  const getLineIndexFromOffset = (lineStarts, offset) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lineStarts[mid] <= offset) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return Math.max(0, high);
  };

  const buildNodesFromSyntaxTree = (tree, source) => {
    const lines = source.split('\n');
    const lineStarts = getLineStarts(source);
    const nodeByLine = new Array(lines.length).fill(null);

    const placeStatement = (stmt) => {
      const lineIndex = getLineIndexFromOffset(lineStarts, stmt.from);
      const lineText = lines[lineIndex] || '';
      const indent = getIndentLevel(lineText);

      if (stmt.type === 'COMPOUND') {
        nodeByLine[lineIndex] = {
          id: makeId(),
          type: 'keyword',
          keyword: stmt.keyword,
          expression: stmt.arguments,
          text: '',
          indent,
        };

        if (stmt.body) {
          stmt.body.forEach(placeStatement);
        }
      } else {
        nodeByLine[lineIndex] = {
          id: makeId(),
          type: 'command',
          text: stmt.raw,
          indent,
        };
      }
    };

    (tree || []).forEach(placeStatement);

    return lines.map((line, index) => {
      if (nodeByLine[index]) return nodeByLine[index];
      return {
        id: makeId(),
        type: 'command',
        text: line.trim(),
        indent: getIndentLevel(line),
      };
    });
  };
  
  // SYNC: When code changes externally, rebuild nodes from the syntax tree
  useEffect(() => {
    if (code === lastSyncedCode.current) return;
    idCounter.current = 0;
    const nextNodes = buildNodesFromSyntaxTree(syntaxTree, code);
    setNodes(nextNodes);
    lastSyncedCode.current = code;
  }, [code, syntaxTree]);

  // SYNC: Whenever nodes change, generate the Python string for the Context
  useEffect(() => {
    const pythonString = nodes.map(node => {
      const spaces = "    ".repeat(node.indent);
      if (node.type === 'keyword') {
        const expr = node.expression ? ` ${node.expression}` : '';
        return `${spaces}${node.keyword}${expr}:`;
      }
      return node.text.trim() || node.indent > 0 ? `${spaces}${node.text}` : "";
    }).join('\n');

    if (pythonString !== lastSyncedCode.current) {
      lastSyncedCode.current = pythonString;
      setCode(pythonString);
    }
  }, [nodes]);


  const validateIndent = (keyword, indent, index) => {
    const rule = BLOCK_RULES[keyword];
    if (!rule || !rule.isContinuation) return true;
    for (let i = index - 1; i >= 0; i--) {
      if (nodes[i].indent > indent) continue;
      if (nodes[i].indent === indent) {
        return nodes[i].type === 'keyword' && rule.validParents.includes(nodes[i].keyword);
      }
      if (nodes[i].indent < indent) return false;
    }
    return false;
  };

  const handleKeyDown = (e, node, index) => {
    const trimmed = node.text.trim().toLowerCase();
    setActiveLine(index);

    // 1. Convert command to Keyword Block on Space
    if (e.key === ' ' && node.type === 'command' && BLOCK_RULES[trimmed]) {
      e.preventDefault();
      if (!validateIndent(trimmed, node.indent, index)) {
        setError(`Syntax Error: '${trimmed}' cannot appear here.`);
        return;
      }
      const newNodes = [...nodes];
      newNodes[index] = { ...node, type: 'keyword', keyword: trimmed, text: '', expression: '' };
      
      // Auto-indent next line
      const nextNode = nodes[index + 1];
      if (!nextNode || nextNode.indent <= node.indent) {
        newNodes.splice(index + 1, 0, {
          id: Math.random().toString(36).substr(2, 9),
          type: 'command', text: '', indent: node.indent + 1
        });
      }
      setNodes(newNodes);
      setError(null);
      setTimeout(() => {
        if (BLOCK_RULES[trimmed].hasExpression) {
          inputRefs.current[`${node.id}-exp`]?.focus();
        } else {
          inputRefs.current[`${newNodes[index+1].id}-txt`]?.focus();
        }
      }, 0);
    }

    // 2. Handle Indentation (Shift+Tab or Backspace at start)
    if (((e.key === 'Backspace' && node.text === '' && (!node.expression || node.expression === '')) || (e.key === 'Tab' && e.shiftKey)) && node.indent > 0) {
      e.preventDefault();
      setNodes(nodes.map((n, i) => i === index ? { ...n, indent: n.indent - 1, type: 'command' } : n));
    }

    // 3. New Line logic
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextId = Math.random().toString(36).substr(2, 9);
      const newNodes = [...nodes];
      newNodes.splice(index + 1, 0, {
        id: nextId, type: 'command', text: '', 
        indent: node.type === 'keyword' ? node.indent + 1 : node.indent 
      });
      setNodes(newNodes);
      setTimeout(() => inputRefs.current[`${nextId}-txt`]?.focus(), 0);
    }

    // 4. Arrow Navigation
    if (e.key === 'ArrowUp' && index > 0) {
        const prevId = nodes[index-1].id;
        inputRefs.current[`${prevId}-txt`]?.focus() || inputRefs.current[`${prevId}-exp`]?.focus();
    }
    if (e.key === 'ArrowDown' && index < nodes.length - 1) {
        const nextId = nodes[index+1].id;
        inputRefs.current[`${nextId}-txt`]?.focus() || inputRefs.current[`${nextId}-exp`]?.focus();
    }
  };

  useEffect(() => {
    if (mode === 'edit') {
      // auto focus
    }
  }, [mode]);

  return (
    <div className="code-editor-container h-full overflow-auto bg-[#0d1117] p-4 font-mono text-sm">
      <div className="mb-2 h-4 text-xs text-red-400">
        {error && <span>⚠️ {error}</span>}
      </div>

      <div className="space-y-1">
        {nodes.map((node, index) => {
          const isActive = index === activeLine;
          
          return (
            <div 
              key={node.id} 
              className={`group relative flex items-center min-h-[24px] ${isActive ? 'bg-blue-900 bg-opacity-20' : ''}`}
              onClick={() => setActiveLine(index)}
            >
              {/* Line Number */}
              <span className="editorLineNumber mr-4 w-8 text-right opacity-30 select-none">
                {index + 1}
              </span>

              {/* Indentation Guides */}
              {[...Array(node.indent)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute h-full border-l border-gray-700" 
                  style={{ left: `${(i * 32) + 48}px` }} 
                />
              ))}

              <div className="flex items-center w-full" style={{ paddingLeft: `${node.indent * 32}px` }}>
                {node.type === 'keyword' ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#ff7b72]">{node.keyword}</span>
                    {BLOCK_RULES[node.keyword].hasExpression ? (
                      <input
                        ref={el => inputRefs.current[`${node.id}-exp`] = el}
                        className="bg-[#161b22] border border-[#30363d] text-[#d29922] px-2 rounded outline-none focus:border-[#58a6ff] w-64"
                        value={node.expression}
                        readOnly={mode === 'read'}
                        onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? {...n, expression: e.target.value} : n))}
                        onKeyDown={(e) => handleKeyDown(e, node, index)}
                      />
                    ) : null}
                    <span className="text-gray-500">:</span>
                  </div>
                ) : (
                  <div className="flex items-center w-full gap-2">
                    <span className="text-gray-600 opacity-40">❯</span>
                    <input
                      ref={el => inputRefs.current[`${node.id}-txt`] = el}
                      className="bg-transparent outline-none w-full text-[#7ee787]"
                      placeholder={index === nodes.length - 1 ? "Type code or keyword..." : ""}
                      value={node.text}
                      readOnly={mode === 'read'}
                      onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? {...n, text: e.target.value} : n))}
                      onKeyDown={(e) => handleKeyDown(e, node, index)}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CodeEditor;