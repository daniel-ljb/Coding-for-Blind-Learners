import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCode } from '../contexts/CodeContext';
import {
  getIndentLevel,
  findNextLineWithIndent,
  findPrevLineWithIndent,
  getBlock,
  findFunction,
  findComment,
} from '../utils/terminalCommands.js'

function OneLineTerminal({ mode }) {
	const [input, setInput] = useState('');
	const [terminalOutput, setTerminalOutput] = useState([]);
	const {
		code,
		setCode,
		activeLine,
		setActiveLine,
		handleActiveLineChange,
	} = useCode();

	const workerRef = useRef(null);
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (mode === 'terminal') {
			document.getElementById('one-line-terminal-input')?.focus();
		}
	}, [mode]);

	/*useEffect(() => {
		if (statusMessage) {
			setTerminalOutput(prev => [...prev, { type: 'info', message: statusMessage }]);
		}
	}, [statusMessage]);*/

	const createLineAfter = () => {
		const lines = code.split('\n');
		const currentIndent = getIndentLevel(lines[activeLine] ?? '');
		const insertIdx = activeLine + 1;

		lines.splice(insertIdx, 0, ' '.repeat(currentIndent));

		setCode(lines.join('\n'));
		setActiveLine(insertIdx);
		setTerminalOutput(prev => [...prev, { type: 'info', message: 'Created new line after'}]);
	};

	const createLineBefore = () => {
		const lines = code.split('\n');
		const currentLine = lines[activeLine];
		const indent = getIndentLevel(currentLine);
		lines.splice(activeLine, 0, ' '.repeat(indent));
		setCode(lines.join('\n'));
		setTerminalOutput(prev => [...prev, { type: 'info', message: 'Created new line before'}]);
	};

	const moveToNextIndent = () => {
		const lines = code.split('\n');
		const currentIndent = getIndentLevel(lines[activeLine]);
		const nextIdx = findNextLineWithIndent(lines, activeLine, currentIndent);
		if (nextIdx !== -1) {
		handleActiveLineChange(nextIdx);
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Moved to line ${nextIdx + 1}`}]);
		} else {
		setTerminalOutput(prev => [...prev, { type: 'info', message: 'No next line with same indentation'}]);
		}
	};

	const moveToPrevIndent = () => {
		const lines = code.split('\n');
		const currentIndent = getIndentLevel(lines[activeLine]);
		const prevIdx = findPrevLineWithIndent(lines, activeLine, currentIndent);
		if (prevIdx !== -1) {
		handleActiveLineChange(prevIdx);
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Moved to line ${prevIdx + 1}`}]);
		} else {
		setTerminalOutput(prev => [...prev, { type: 'info', message: 'No previous line with same indentation'}]);
		}
	};

	const moveOutOneLevel = () => {
		const lines = code.split('\n');
		const currentIndent = getIndentLevel(lines[activeLine]);
		if (currentIndent === 0) {
		setTerminalOutput(prev => [...prev, { type: 'info', message: 'Already at root level'}]);
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
		setTerminalOutput(prev => [...prev, { type: 'info', message: 'No parent level found'}]);
		return;
		}

		for (let i = activeLine - 1; i >= 0; i--) {
		if (!lines[i].trim()) continue;
		const indent = getIndentLevel(lines[i]);
		if (indent === targetIndent) {
			handleActiveLineChange(i);
			setTerminalOutput(prev => [...prev, { type: 'info', message: `Moved up to line ${i + 1}`}]);
			return;
		}
		if (indent < targetIndent) break;
		}

		setTerminalOutput(prev => [...prev, { type: 'info', message: 'No parent level found'}]);
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
		setTerminalOutput(prev => [...prev, { type: 'info', message: 'No child level found'}]);
		return;
		}

		for (let i = activeLine + 1; i < lines.length; i++) {
		if (!lines[i].trim()) continue;
		const indent = getIndentLevel(lines[i]);
		if (indent === targetIndent) {
			handleActiveLineChange(i);
			setTerminalOutput(prev => [...prev, { type: 'info', message: `Moved in to line ${i + 1}`}]);
			return;
		}
		if (indent < currentIndent) break;
		}

		setTerminalOutput(prev => [...prev, { type: 'info', message: 'No child level found'}]);
	};

	const jumpToFunction = (funcName) => {
		const lines = code.split('\n');
		const idx = findFunction(lines, funcName);
		if (idx !== -1) {
		handleActiveLineChange(idx);
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Jumped to function '${funcName}' at line ${idx + 1}`}]);
		} else {
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Function '${funcName}' not found`}]);
		}
	};

	const jumpToComment = (commentName) => {
		const lines = code.split('\n');
		const idx = findComment(lines, commentName);
		if (idx !== -1) {
		handleActiveLineChange(idx);
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Jumped to comment '${commentName}' at line ${idx + 1}`}]);
		} else {
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Comment '${commentName}' not found`}]);
		}
	};

	const readLine = () => {
		const lines = code.split('\n');
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Line ${activeLine + 1}: ${lines[activeLine]}`}]);
		// TODO: Implement actual text-to-speech or screen reader announcement
	};

	const readBlock = () => {
		const lines = code.split('\n');
		const { start, end } = getBlock(lines, activeLine);
		const blockText = lines.slice(start, end + 1).join('\n');
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Reading block (lines ${start + 1}-${end + 1})`}]);
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
		setTerminalOutput(prev => [...prev, { type: 'info', message: 'Not in a function'}]);
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
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Reading function (lines ${funcStart + 1}-${funcEnd + 1})`}]);
		// TODO: Implement actual text-to-speech or screen reader announcement
	};

	const loadFile = (file) => {
		const reader = new FileReader();
		reader.onload = (e) => {
		const content = e.target.result;
		setCode(content);
		handleActiveLineChange(0);
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Loaded file: ${file.name}`}]);
		};
		reader.onerror = () => {
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Error reading file: ${file.name}`}]);
		};
		reader.readAsText(file);
	};

	const saveFile = (filename = 'code.py') => {
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
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Saved file: ${filename}`}]);
		} catch (error) {
		setTerminalOutput(prev => [...prev, { type: 'info', message: `Error saving file: ${error.message}`}]);
		}
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
		'load': 'load - Open file picker to load a Python file',
		'save': 'save [filename] - Download code as a Python file (default: code.py)'
		};
		return commands[cmdName] || 'Command not found';
	};

	const handleClear = () => {
		setTerminalOutput([]);
	};

	const startWorker = () => {
		if (workerRef.current) return;

		const worker = new Worker(new URL('../codeExecution/python.worker.ts', import.meta.url));
		worker.onmessage = (e) => {
			const { type, data, result, error } = e.data;
			if (type === 'output') setTerminalOutput(prev => [...prev, { type: 'output', message: data }]);
			if (type === 'terminated') setTerminalOutput(prev => [...prev, { type: 'info', message: result }]);
			if (type === 'error') setTerminalOutput(prev => [...prev, { type: 'error', message: error }]);
		};

		workerRef.current = worker;
	};

	const handleRun = () => {
		startWorker();
		workerRef.current?.postMessage({ type: 'run', data: code });
	};

	const parseCommand = (cmd) => {
		const trimmed = cmd.trim();

		// Help commands
		if (trimmed === '?') {
			return {
				type: 'help',
				text: `Available commands:\nnext/down, prev/up, leave/left, in/right\nnew line before, new line after\njump func "name", jump com "name"\nread line, read block, read func\nrun, clear, ? "command"`
			};
		}

		if (trimmed.startsWith('? ')) {
			const cmdName = trimmed.substring(2).trim();
			return {
				type: 'help',
				text: getCommandHelp(cmdName)
			};
		}

		// Navigation with indentation
		if (trimmed === 'next' || trimmed === 'down') {
			return { type: 'action', action: moveToNextIndent };
		}
		if (trimmed === 'prev' || trimmed === 'up') {
			return { type: 'action', action: moveToPrevIndent };
		}
		if (trimmed === 'leave' || trimmed === 'left') {
			return { type: 'action', action: moveOutOneLevel };
		}
		if (trimmed === 'in' || trimmed === 'right') {
			return { type: 'action', action: moveInOneLevel };
		}

		// Line creation
		if (trimmed === 'new line after') {
			return { type: 'action', action: createLineAfter };
		}
		if (trimmed === 'new line before') {
			return { type: 'action', action: createLineBefore };
		}

		// Jump commands
		if (trimmed.startsWith('jump func ')) {
			const funcName = trimmed.substring(9).replace(/"/g, '').trim();
			return { type: 'action', action: () => jumpToFunction(funcName) };
		}
		if (trimmed.startsWith('jump com ')) {
			const comName = trimmed.substring(9).replace(/"/g, '').trim();
			return { type: 'action', action: () => jumpToComment(comName) };
		}

		// Read commands
		if (trimmed === 'read line') {
			return { type: 'action', action: readLine };
		}
		if (trimmed === 'read block') {
			return { type: 'action', action: readBlock };
		}
		if (trimmed === 'read func') {
			return { type: 'action', action: readFunction };
		}

		// Special commands
		if (trimmed === 'run') {
			return { type: 'action', action: handleRun };
		}
		if (trimmed === 'clear') {
			return { type: 'action', action: handleClear };
		}
		if (trimmed === 'load') {
			return { type: 'action', action: () => fileInputRef.current?.click() };
		}
		if (trimmed === 'save' || trimmed.startsWith('save ')) {
			const filename = trimmed.substring(4).trim() || 'code.py';
			return { type: 'action', action: () => saveFile(filename) };
		}

		return { type: 'error', text: `Unknown command: ${trimmed}` };
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const value = input.trim();
		if (!value) return;

		setTerminalOutput(prev => [...prev, { type: 'input', message: value }]);

		const parsed = parseCommand(value);

		if (parsed.type === 'help') {
			setTerminalOutput(prev => [...prev, { type: 'info', message: parsed.text }]);
		} else if (parsed.type === 'error') {
			setTerminalOutput(prev => [...prev, { type: 'error', message: parsed.text }]);
		} else if (parsed.type === 'action') {
			parsed.action();
		}

		setInput('');
	};

	const handleKeyDown = (e) => {
		if (mode !== 'terminal') return;

		// Handle keyboard shortcuts
		if (e.shiftKey && e.key === 'ArrowUp') {
			e.preventDefault();
			createLineBefore();
			setTerminalOutput(prev => [...prev, { type: 'info', message: 'Created new line before' }]);
		} else if (e.shiftKey && e.key === 'ArrowDown') {
			e.preventDefault();
			createLineAfter();
			setTerminalOutput(prev => [...prev, { type: 'info', message: 'Created new line after' }]);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			moveToNextIndent();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			moveToPrevIndent();
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			moveOutOneLevel();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			moveInOneLevel();
		} else if (e.ctrlKey && e.key === 'l') {
			e.preventDefault();
			readLine();
		} else if (e.ctrlKey && e.key === 'b') {
			e.preventDefault();
			readBlock();
		} else if (e.ctrlKey && e.key === 'f') {
			e.preventDefault();
			readFunction();
		}
	};

	const lastOutput = useMemo(() => {
		if (terminalOutput.length === 0) {
			return { type: 'info', message: 'Ready for input. Type ? for available commands.' };
		}
		return terminalOutput[terminalOutput.length - 1];
	}, [terminalOutput]);


	return (
		<div className="h-auto w-full flex flex-col bg-black text-white font-mono">
			<div
				className="px-4 py-2 text-sm border-b border-gray-800 whitespace-pre-wrap break-words"
				role="log"
				aria-live="assertive"
				aria-label="Terminal output"
			>
				{lastOutput.message}
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept=".py"
				className="hidden"
				onChange={(e) => {
					if (e.target.files?.[0]) {
						loadFile(e.target.files[0]);
					}
				}}
				aria-label="Load Python file"
			/>

			<form className="px-4 py-2" onSubmit={handleSubmit}>
				<label className="absolute w-px h-px p-0 m-[-1px] overflow-hidden clip-rect(0, 0, 0, 0) whitespace-nowrap border-0" htmlFor="one-line-terminal-input">
					Terminal input
				</label>
				<div className="flex items-center gap-2 text-sm">
					<span>$</span>
					<input
						autoFocus={mode === 'terminal'}
						disabled={mode !== 'terminal'}
						id="one-line-terminal-input"
						type="text"
						className="w-full bg-transparent outline-none disabled:opacity-50"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder=""
						aria-label="Terminal input"
					/>
				</div>
			</form>
		</div>
	);
}

export default OneLineTerminal;
