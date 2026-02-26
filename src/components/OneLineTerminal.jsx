import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useCodeActions } from '../hooks/useCodeActions';

function OneLineTerminal() {
	const [input, setInput] = useState('');
	const { terminalOutput, setTerminalOutput, mode, outputMode } = useApp();
	
	const actions = useCodeActions();

	const COMMAND_HELP = {
		next: "next (n): Move to next item at current indentation. In output view: next output line.",
		n:    "next (n): Move to next item at current indentation. In output view: next output line.",

		prev: "prev (p): Move to previous item at current indentation. In output view: previous output line.",
		p:    "prev (p): Move to previous item at current indentation. In output view: previous output line.",

		in:   "in (i): Move into the first child block (one indentation deeper).",
		i:    "in (i): Move into the first child block (one indentation deeper).",

		out:  "out (o): Move out one level. In output view: exit output view.",
		o:    "out (o): Move out one level. In output view: exit output view.",

		read: "read (r): Read code. Use: r l (line), r b (block), r f (function). Default: r l.",
		r:    "read (r): Read code. Use: r l (line), r b (block), r f (function). Default: r l.",
		rl:   "r l: Read the active line.",
		rb:   "r b: Read the active block.",
		rf:   "r f: Read the active function.",

		run:  "run: Run the current code. If output exists, enters output view.",
		save: "save (s): Save code to a file. Usage: save filename.py (default: code.py).",
		s:    "save (s): Save code to a file. Usage: save filename.py (default: code.py).",
		load: "load (l): Load code from a local file picker.",
		l:    "load (l): Load code from a local file picker.",

		jump: "jump (j): Search for a word/phrase in the code and jump to the first match. Usage: j <term>, j f <func>, j c <comment>. If there are multiple matches, use jn (next) / jp (previous).",
		j:    "jump (j): Search for a word/phrase in the code and jump to the first match. Usage: j <term>, j f <func>, j c <comment>. If there are multiple matches, use jn (next) / jp (previous).",
		jn:	  "jn: Jump to next match of the last search term.",
		jp:   "jp: Jump to previous match of the last search term",

		exit: "exit: Exit output view (same as out when viewing output).",
		"?":  "?: Show command list. Use ? <command> for details."
	};

	useEffect(() => {
		if (mode === 'terminal') {
			document.getElementById('one-line-terminal-input')?.focus();
		}
	}, [mode]);

    useEffect(() => { actions.initCodeRunner(); }, [actions]);

	const parseCommand = (cmd) => {
		const trimmed = cmd.trim();
		const split = trimmed.split(' ');

		if (trimmed === '?') return { type: 'help', text: 'Commands: n/next, p/prev, i/in, o/out, r/read, run, save, load, j/jump, exit.\nKeyboard shortcuts: Ctrl+Shift+M to toggle mode, Ctrl+Alt+M to announce mode.\nType ? to repeat. Type ? <command> for details (without quotes).' };

		if (split[0] === '?' && split.length > 1) {
			const key = split[1].toLowerCase();
			return {
				type: 'help',
				text: COMMAND_HELP[key] || `No help for "${split[1]}". Type ? to list commands.`
			};
		}

		// Navigation
		if (['next','n'].includes(split[0])) return { type: 'action', action: actions.moveToNextIndent };
		if (['prev','p'].includes(split[0])) return { type: 'action', action: actions.moveToPrevIndent };
		if (['out','o'].includes(split[0])) return { type: 'action', action: actions.moveOutOneLevel };
		if (['in','i'].includes(split[0])) return { type: 'action', action: actions.moveInOneLevel };

		// Line creation
		if (split[0] === "newline" || split[0] === "nl") {
			if (split[1] === "after" || split[1] === "a") return { type: 'action', action: actions.createLineAfter };
			if (split[1] === "before" || split[1] === "b") return { type: 'action', action: actions.createLineBefore };
		}
		
		// Jump
		if (split[0] === 'jf'){
			const target = split.slice(1).join(' ');
			return { type: 'action', action: () => actions.jumpToFunction(target) };
		}
		if (split[0] === 'jc'){
			const target = split.slice(1).join(' ');
			return { type: 'action', action: () => actions.jumpToComment(target) };
		}
		if (split[0] === "jump" || split[0] === "j") {
			if (split.length >= 3) {
				// Look at original text in case they have two spaces in a comment
				const term = trimmed.slice(trimmed.indexOf(" ", trimmed.indexOf(" ") + 1) + 1);
				if (split[1] === "func" || split[1] === "f") return { type: 'action', action: () => actions.jumpToFunction(term) };
				if (split[1] === "com" || split[1] === "c") return { type: 'action', action: () => actions.jumpToComment(term) };
			}
			const term = split.slice(1).join(" ");
			return { type: 'action', action: () => actions.jumpToAny(term) };
		}
		if (split[0] === 'jn') return { type: 'action', action: actions.jumpNextMatch };
		if (split[0] === 'jp') return { type: 'action', action: actions.jumpPrevMatch };

		// Read
		if (split[0] === "read" || split[0] === "r") {
			if (split[1] === "line" || split[1] === "l") return { type: 'action', action: actions.readActiveLine };
			if (split[1] === "block" || split[1] === "b") return { type: 'action', action: actions.readActiveBlock };
			if (split[1] === "func" || split[1] === "f") return { type: 'action', action: actions.readActiveFunction };
			return { type: 'action', action: actions.readActiveLine };
		}
		
		if (trimmed === 'exit') return { type: 'action', action: actions.exitOutputMode };
		if (trimmed === 'run') return { type: 'action', action: actions.runCode };
		if (split[0] === 'load' || split[0] === 'l') return { type: 'action', action: () => {
			if (split[1] && split[1] !== 'local') 
				actions.loadDemo(split[1]);
			else
				actions.loadFile();
		}};
		if (split[0] === 'save' || split[0] === 's') return { type: 'action', action: () => actions.saveFile(split[1] || 'code.py') };

		return { type: 'error', text: `Unknown command: ${trimmed}` };
	};

	const handleTerminalInput = (e) => {
		e.preventDefault();
		const cmd = input;
		setInput('');
		const parsed = parseCommand(cmd);
		if (parsed.type === 'help' || parsed.type === 'error') {
			setTerminalOutput(parsed.text);
			return;
		}
		if (parsed.type === 'action') {
			try { parsed.action(); }
			catch (err) {
				console.error(err);
				setTerminalOutput(`Command failed: ${err?.message ?? 'unknown error'}`);
			}
		}
	};

	const handleKeyDown = (e) => {
		if (mode !== 'terminal') return;
		// Standard navigation
		if (e.key === 'ArrowDown' && !e.altKey && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); actions.moveToNextIndent(); }
		if (e.key === 'ArrowUp' && !e.altKey && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); actions.moveToPrevIndent(); }
		if (e.key === 'ArrowRight' && !e.altKey && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); actions.moveInOneLevel(); }
		if (e.key === 'ArrowLeft' && !e.altKey && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); actions.moveOutOneLevel(); }
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