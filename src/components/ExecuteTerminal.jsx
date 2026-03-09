import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useCodeActions } from '../hooks/useCodeActions';

function ExecuteTerminal() {
	const [input, setInput] = useState('');
	//const { speakLine, mode, argumentCallback, setArgumentCallback,  } = useApp();
	const {
		mode,
		argumentCallback,
		terminalOutput,
		setArgumentCallback,
		setMode,
		previousMode,
	} = useApp();
	
	const actions = useCodeActions();

	useEffect(() => {
		if (mode === 'execute' || mode === 'argument') {
			document.getElementById('terminal-input')?.focus();
            setInput('');
		}
	}, [mode, argumentCallback]);

	const handleSubmit = (e) => {
		e.preventDefault();
		const value = input;
		setInput('');

		if (mode === 'argument') {
			if (argumentCallback) argumentCallback(value);
			setArgumentCallback(null);
			setMode(previousMode ?? 'edit');
			return;
		}

		if (mode === 'execute') {
			actions.giveCodeInput(value);
			return;
		}
	};

	const placeholder =
		mode === 'argument' ? 'Enter argument…' :
		mode === 'execute' ? 'Program input…' :
		'';

	return (
		<div className="h-auto w-full flex flex-col bg-black text-green-300 font-mono">
			<div className="px-4 py-2 text-sm border-b border-gray-800 whitespace-pre-wrap">
				{terminalOutput}
			</div>

			<form className="px-4 py-2" onSubmit={handleSubmit}>
				<div className="flex items-center gap-2 text-sm">
					<span className="text-green-400">$</span>
					<input 
                        autoComplete='off' 
                        id="terminal-input" 
                        className="w-full bg-transparent outline-none" 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
						placeholder={placeholder}
						disabled={!(mode === 'execute' || mode === 'argument')}
                        // onKeyDown={handleKeyDown} 
                    />
				</div>
			</form>
		</div>
	);
}

export default ExecuteTerminal;