import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useCodeActions } from '../hooks/useCodeActions';

function ArgumentTerminal() {
	const [input, setInput] = useState('');
	const { speakLine, mode, argumentCallback, setArgumentCallback } = useApp();
	
	const actions = useCodeActions();

	useEffect(() => {
		if (mode === 'argument' && argumentCallback !== null) {
			document.getElementById('argument-terminal')?.focus();
            setInput('');
		}
	}, [mode, argumentCallback]);

	const handleTerminalInput = (e) => {
		e.preventDefault();
		if(argumentCallback !== null) argumentCallback(input)
        setArgumentCallback(null); //Will also set your mode back
        setInput('');
	};

	return (
		<div className="h-auto w-full flex flex-col bg-black text-green-300 font-mono">
			<form className="px-4 py-2" onSubmit={handleTerminalInput}>
				<div className="flex items-center gap-2 text-sm">
					<span className="text-green-400">$</span>
					<input 
                        autoComplete='off' 
                        id="argument-terminal" 
                        className="w-full bg-transparent outline-none" 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        // onKeyDown={handleKeyDown} 
                    />
				</div>
			</form>
		</div>
	);
}

export default ArgumentTerminal;