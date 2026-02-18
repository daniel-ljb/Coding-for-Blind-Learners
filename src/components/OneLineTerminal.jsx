import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCode } from '../contexts/CodeContext';
import { useTerminalCommands } from '../hooks/useTerminalCommands.jsx';
import { parseCommand } from '../utils/terminalCommands.jsx';

function OneLineTerminal({ mode }) {
	const [input, setInput] = useState('');
	const [terminalOutput, setTerminalOutput] = useState([]);
	const { code } = useCode();
	const {
		statusMessage,
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
		getCommandHelp,
	} = useTerminalCommands();

	const workerRef = useRef(null);
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (mode === 'terminal') {
			document.getElementById('one-line-terminal-input')?.focus();
		}
	}, [mode]);

	useEffect(() => {
		if (statusMessage) {
			setTerminalOutput(prev => [...prev, { type: 'info', message: statusMessage }]);
		}
	}, [statusMessage]);

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

	const parseCommandWithHandlers = (cmd) =>
		parseCommand(cmd, {
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
			triggerLoad: () => fileInputRef.current?.click(),
			handleRun,
			handleClear,
		});

	const handleSubmit = (e) => {
		e.preventDefault();
		const value = input.trim();
		if (!value) return;

		setTerminalOutput(prev => [...prev, { type: 'input', message: value }]);

		const parsed = parseCommandWithHandlers(value);

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
