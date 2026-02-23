import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useCodeActions } from '../hooks/useCodeActions';

function OneLineTerminal() {
	const [input, setInput] = useState('');
	const {
		activeLine,
		terminalOutput,
		setTerminalOutput,
		mode,
	} = useApp();
	
	const {
		createLineAfter,
		createLineBefore,
		moveToNextIndent,
		moveToPrevIndent,
		moveOutOneLevel,
		moveInOneLevel,
		jumpToFunction,
		jumpToComment,
		readActiveLine,
		readActiveBlock,
		readActiveFunction,
		loadFile,
		saveFile,
		initCodeRunner,
		runCode,
	} = useCodeActions();

	useEffect(() => {
		if (mode === 'terminal') {
			document.getElementById('one-line-terminal-input')?.focus();
		}
	}, [mode]);

  useEffect(() => {
    initCodeRunner();
  });

	const getCommandHelp = (cmdName) => {
		const commands = {
		'next': 'next / down - Go to next line with same indentation',
		'down': 'next / down - Go to next line with same indentation',
		'prev': 'prev / up - Go to previous line with same indentation',
		'up': 'prev / up - Go to previous line with same indentation',
		'leave': 'leave / left - Move up one indentation level',
		'left': 'leave / left - Move up one indentation level',
		'in': 'in / right - Move down one indentation level',
		'right': 'in / right - Move down one indentation level',
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
		setTerminalOutput('Ready for input. Type ? for available commands.');
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
			return { type: 'action', action: readActiveLine };
		}
		if (trimmed === 'read block') {
			return { type: 'action', action: readActiveBlock };
		}
		if (trimmed === 'read func') {
			return { type: 'action', action: readActiveFunction };
		}

		// Special commands
		if (trimmed === 'run') {
			return { type: 'action', action: runCode };
		}
		if (trimmed === 'clear') {
			return { type: 'action', action: handleClear };
		}
		if (trimmed === 'load') {
			return { type: 'action', action: loadFile };
		}
		if (trimmed === 'save' || trimmed.startsWith('save ')) {
			const filename = trimmed.substring(4).trim() || 'code.py';
			return { type: 'action', action: () => saveFile(filename) };
		}

		return { type: 'error', text: `Unknown command: ${trimmed}` };
	};

	const handleTerminalInput = (e) => {
		e.preventDefault();
		const value = input.trim();
		if (!value) return;

		const parsed = parseCommand(value);

		if (parsed.type === 'help') {
			setTerminalOutput(parsed.text);
		} else if (parsed.type === 'error') {
			setTerminalOutput(parsed.text);
		} else if (parsed.type === 'action') {
			parsed.action();
		}

		setInput('');
	};

	const handleKeyDown = (e) => {
		if (mode !== 'terminal') return;
		if (e.key === 'ArrowDown' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
			e.preventDefault();
			moveToNextIndent();
		}
		else if (e.key === 'ArrowUp' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
			e.preventDefault();
			moveToPrevIndent();
		}
		else if (e.key === 'ArrowLeft' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
			e.preventDefault();
			moveOutOneLevel();
		}
		else if (e.key === 'ArrowRight' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
			e.preventDefault();
			moveInOneLevel();
		}
	};

	return (
		<div className="h-auto w-full flex flex-col bg-black text-green-300 font-mono">
			<div className="px-4 py-2 text-sm border-b border-gray-800 whitespace-pre-wrap break-words">
				{terminalOutput}
			</div>

			<form className="px-4 py-2" onSubmit={handleTerminalInput}>
				<label className="absolute w-px h-px p-0 m-[-1px] overflow-hidden clip-rect(0, 0, 0, 0) whitespace-nowrap border-0" htmlFor="one-line-terminal-input">
					Terminal input
				</label>
				<div className="flex items-center gap-2 text-sm">
					<span className="text-green-400">$</span>
					<input
						autoFocus={mode === 'terminal'}
						disabled={mode !== 'terminal'}
						autoComplete='off'
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
