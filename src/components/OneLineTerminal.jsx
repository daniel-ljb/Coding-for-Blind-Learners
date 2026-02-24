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
		'next': 'next / n - Go to next line with same indentation',
		'n': 'n / next - Go to next line with same indentation',
		'down': 'down / d - Go to next line with same indentation',
		'd': 'd / down - Go to next line with same indentation',
		'prev': 'prev / p - Go to previous line with same indentation',
		'p': 'p / prev - Go to previous line with same indentation',
		'up': 'up / u - Go to previous line with same indentation',
		'u': 'u / up - Go to previous line with same indentation',
		'out': 'out / o - Move up one indentation level',
		'o': 'o / out - Move up one indentation level',
		'left': 'left - Move up one indentation level',
		'in': 'in / i - Move down one indentation level',
		'i': 'i / in - Move down one indentation level',
		'right': 'right - Move down one indentation level',
		'newline': 'newline / nl [after / a, before / b] creates a new line before or after current',
		'nl a': 'nl a - Create new line after current',
		'nl b': 'nl b - Create new line before current',
		'jump': 'jump x / j x - Jump to first occurrence of x. jump func "name" for functions, jump com "name" for comments.',
		'j': 'j x / jump x - Jump to first occurrence of x.',
		'jump func': 'jump func "name" - Jump to function with given name',
		'jump com': 'jump com "name" - Jump to comment with given name',
		'read': 'read / r - See read options',
		'r': 'r / read - See read options',
		'read line': 'read line / r l - Read current line',
		'r l': 'r l / read line - Read current line',
		'read block': 'read block / r b - Read current block',
		'r b': 'r b / read block - Read current block',
		'read func': 'read func / r f - Read current function',
		'r f': 'r f / read func - Read current function',
		'load': 'load / l - Open file picker to load a Python file',
		'l': 'l / load - Open file picker to load a Python file',
		'save': 'save / s [filename] - Download code as a Python file (default: code.py)',
		's': 's / save [filename] - Download code as a Python file (default: code.py)'
		};
		return commands[cmdName] || 'Command not found';
	};

	const handleClear = () => {
		setTerminalOutput('Ready for input. Type ? for available commands.');
	};

	const parseCommand = (cmd) => {
		const trimmed = cmd.trim();
		const split = trimmed.split(' ');

		// Help commands
		if (trimmed === '?') {
			return {
				type: 'help',
				text: `Available commands:\nnext, prev, leave, in\nnew line before, new line after\njump, read\nrun, clear, ? "command"`
			};
		}

		if (split[0] == "?") {
			return {
				type: 'help',
				text: getCommandHelp(split.slice(1).join(' '))
			};
		}

		// Navigation with indentation
		if (['next','n','down','d'].includes(split[0])) {
			return { type: 'action', action: moveToNextIndent };
		}
		if (['prev','p','up','u'].includes(split[0])) {
			return { type: 'action', action: moveToPrevIndent };
		}
		if (['leave','l','left'].includes(split[0])) {
			return { type: 'action', action: moveOutOneLevel };
		}
		if (['in','i','right', 'r'].includes(split[0])) {
			return { type: 'action', action: moveInOneLevel };
		}

		// Line creation
		if (split[0] == "newline" || split[0] == "nl") {
			if (split[1] == "after" || split[1] == "a") {
				return { type: 'action', action: createLineAfter };
			}
			if (split[1] == "before" || split[1] == "b") {
				return { type: 'action', action: createLineBefore };
			}
		}
		
		// Jump commands
		if (split[0] == "jump" || split[0] == "j") {
			if (split[1] == "func" || split[1] == "f") {
				return { type: 'action', action: () => jumpToFunction(split.slice(2).join(" ")) };
			}
			if (split[1] == "com" || split[1] == "c") {
				return { type: 'action', action: () => jumpToComment(split.slice(2).join(" ")) };
			}
			return { type: 'action', action: () => jumpToAny(split.slice(2).join(" ")) };
		}

		// Read command
		if (split[0] == "read" || split[0] == "r") {
			if (split[1] == "line" || split[1] == "l") {
				return { type: 'action', action: readActiveLine };
			}
			if (split[1] == "block" || split[1] == "b") {
				return { type: 'action', action: readActiveBlock };
			}
			if (split[1] == "func" || split[1] == "f") {
				return { type: 'action', action: readActiveFunction };
			}
			return {
				type: 'help',
				text: 'read line / r l - Read current line.\nread block / r b - Read current block.\nread func / r f - Read current function.'
			};
		}

		// Special commands
		if (split[0] == 'run') {
			return { type: 'action', action: runCode };
		}
		if (split[0] == 'clear') {
			return { type: 'action', action: handleClear };
		}
		if (split[0] == 'load' || split[0] == 'l') {
			return { type: 'action', action: loadFile };
		}
		if (split[0] == 'save' || split[0] == 's') {
			const filename = trimmed.startsWith('save ')
				? trimmed.substring(5).trim() || 'code.py'
				: (trimmed.startsWith('s ') ? trimmed.substring(2).trim() || 'code.py' : 'code.py');
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
