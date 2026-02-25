import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useCodeActions } from '../hooks/useCodeActions';

function OneLineTerminal() {
	const [input, setInput] = useState('');
	const { terminalOutput, setTerminalOutput, mode } = useApp();
	
	const actions = useCodeActions();

	useEffect(() => {
		if (mode === 'terminal') {
			document.getElementById('one-line-terminal-input')?.focus();
		}
	}, [mode]);

    useEffect(() => { actions.initCodeRunner(); }, [actions]);

	const parseCommand = (cmd) => {
		const trimmed = cmd.trim();
		const split = trimmed.split(' ');

		if (trimmed === '?') return { type: 'help', text: 'Commands: next, prev, in, out, read, run, on, op, save, load' };

		// Output History Navigation
		if (trimmed === 'on') return { type: 'action', action: actions.nextOutput };
		if (trimmed === 'op') return { type: 'action', action: actions.prevOutput };

		// Navigation
		if (['next','n','down','d'].includes(split[0])) return { type: 'action', action: actions.moveToNextIndent };
		if (['prev','p','up','u'].includes(split[0])) return { type: 'action', action: actions.moveToPrevIndent };
		if (['leave','l','left','out','o'].includes(split[0])) return { type: 'action', action: actions.moveOutOneLevel };
		if (['in','i','right','r'].includes(split[0])) return { type: 'action', action: actions.moveInOneLevel };

		// Line creation
		if (split[0] === "newline" || split[0] === "nl") {
			if (split[1] === "after" || split[1] === "a") return { type: 'action', action: actions.createLineAfter };
			if (split[1] === "before" || split[1] === "b") return { type: 'action', action: actions.createLineBefore };
		}
		
		// Jump
		if (split[0] === "jump" || split[0] === "j") {
			const target = split.slice(2).join(" ");
			if (split[1] === "func" || split[1] === "f") return { type: 'action', action: () => actions.jumpToFunction(target) };
			if (split[1] === "com" || split[1] === "c") return { type: 'action', action: () => actions.jumpToComment(target) };
			return { type: 'action', action: () => actions.jumpToAny(split.slice(1).join(" ")) };
		}

		// Read
		if (split[0] === "read" || split[0] === "r") {
			if (split[1] === "line" || split[1] === "l") return { type: 'action', action: actions.readActiveLine };
			if (split[1] === "block" || split[1] === "b") return { type: 'action', action: actions.readActiveBlock };
			if (split[1] === "func" || split[1] === "f") return { type: 'action', action: actions.readActiveFunction };
			return { type: 'action', action: actions.readActiveLine };
		}

		if (trimmed === 'run') return { type: 'action', action: actions.runCode };
		if (trimmed === 'load' || trimmed === 'l') return { type: 'action', action: actions.loadFile };
		if (split[0] === 'save' || split[0] === 's') return { type: 'action', action: () => actions.saveFile(split[1] || 'code.py') };

		return { type: 'error', text: `Unknown command: ${trimmed}` };
	};

	const handleTerminalInput = (e) => {
		e.preventDefault();
		const parsed = parseCommand(input);
		if (parsed.type === 'help' || parsed.type === 'error') setTerminalOutput(parsed.text);
		else if (parsed.type === 'action') parsed.action();
		setInput('');
	};

	const handleKeyDown = (e) => {
		if (mode !== 'terminal') return;
		// Standard navigation
		if (e.key === 'ArrowDown' && !e.altKey) { e.preventDefault(); actions.moveToNextIndent(); }
		if (e.key === 'ArrowUp' && !e.altKey) { e.preventDefault(); actions.moveToPrevIndent(); }
		// Output navigation
		if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); actions.nextOutput(); }
		if (e.key === 'ArrowUp' && e.altKey) { e.preventDefault(); actions.prevOutput(); }
	};

	return (
		<div className="h-auto w-full flex flex-col bg-black text-green-300 font-mono">
			<div className="px-4 py-2 text-sm border-b border-gray-800 whitespace-pre-wrap">{terminalOutput}</div>
			<form className="px-4 py-2" onSubmit={handleTerminalInput}>
				<div className="flex items-center gap-2 text-sm">
					<span className="text-green-400">$</span>
					<input 
                        autoComplete='off' 
                        id="one-line-terminal-input" 
                        className="w-full bg-transparent outline-none" 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                    />
				</div>
			</form>
		</div>
	);
}

export default OneLineTerminal;