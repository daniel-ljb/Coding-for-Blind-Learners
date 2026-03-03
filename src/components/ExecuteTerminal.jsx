import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useCodeActions } from '../hooks/useCodeActions';

function ExecuteTerminal() {
	const [input, setInput] = useState('');
	const { speakLine, mode, argumentCallback, setArgumentCallback,  } = useApp();
	
	const actions = useCodeActions();

	useEffect(() => {
		if (mode === 'execute') {
			document.getElementById('execute-terminal')?.focus();
            setInput('');
		}
	}, [mode, argumentCallback]);

	const handleTerminalInput = (e) => {
		e.preventDefault();
        actions.giveCodeInput(input)
        setInput('');
	};

	return (
		<div className="h-auto w-full flex flex-col bg-black text-green-300 font-mono">
			<form className="px-4 py-2" onSubmit={handleTerminalInput}>
				<div className="flex items-center gap-2 text-sm">
					<span className="text-green-400">$</span>
					<input 
                        autoComplete='off' 
                        id="execute-terminal" 
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

export default ExecuteTerminal;