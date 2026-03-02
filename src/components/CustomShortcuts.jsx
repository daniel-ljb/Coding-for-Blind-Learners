import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useCodeActions } from '../hooks/useCodeActions';

function CustomShortcuts() {
    const { code, activeLine, mode, setMode, setTerminalOutput } = useApp();
    const {
        createLineAfter, createLineBefore,
        moveToNextIndent, moveToPrevIndent,
        moveOutOneLevel, moveInOneLevel,
        jumpToFunction, jumpToComment, jumpToAny,
        jumpNextMatch, jumpPrevMatch,
        readActiveLine, readActiveBlock, readActiveFunction,
        loadFile, saveFile,
        initCodeRunner, runCode,
        nextOutput, prevOutput,
        enterOutputMode, exitOutputMode,
        loadDemo
    } = useCodeActions();

    useEffect(() => {
        const handleKeyDown = (e) => {
            const k = e.key.toLowerCase()
            const c = e.ctrlKey
            const s = e.shiftKey
            const editMode = mode == 'edit'
            const executeMode = mode == 'execute'
            const argMode = mode == 'argument'

            /*
            EDIT MODE: //Default
                <c-p> Go to previous line with same indent (and read)
                <c-n> Go to next line with same indent (and read)
                <c-o> Go out one indent (and read)
                <c-i> Go in one indent (and read)
                <c-r> Read current line
                <c-R> Read current line verbose (all punctuation)
                <c-l> Load [ARG MODE] |1-9 -> Demos |0 -> Blank file | -> Load from fs
                <c+s> Save to file
                <c+/> Help [ARG MODE] |p -> Help about previous |etc...
                <c+z> Undo
                <c+Z> Redo
                <c+j> Jump [ARG MODE] |x -> Jump to x (and read). Can be any code not just functions or comments.
                <c+J> Repeat previous jump (and read)
                <c+e> Starts execution [EXECUTE MODE]
                <c+m> [EXECUTE MODE]
                Anything else is inputted as text
            
            EXECUTE MODE:
                <c-p> Go to previous line of output (and read)
                <c-n> Go to next line of output (and read)
                <c-o> Go to previous line of output (and read)
                <c-i> Go to next line of output (and read)
                <c-r> Read current line of output
                <c-R> Read current line of output verbose (all punctuation)
                <c+/> Help [ARG MODE] |p -> Help about previous |etc...
                <c+j> Jump [ARG MODE] |x -> Jump to x (and read) in output
                <c+J> Repeat previous jump (and read)
                <c+e> Restarts execution
                <c+m> [EDIT MODE]
                <c+g> If on an error line, jump to that line in the code [EDIT MODE]
                Anything else is treated as runtime program input
            
            ARG MODE: //Not terminal, only used for giving arguments to load, help, jump
                <esc> Cancel command [PREVIOUS MODE]
                <enter> Give argument to command [PREVIOUS MODE]
                Anything else is treated as the argument
            */
            if (c && (editMode || executeMode)) {
                switch (k) {
                    case 'p':
                        e.preventDefault();
                        if(s && editMode) createLineBefore();
                        else moveToNextIndent();
                        break;
                    case 'n':
                        e.preventDefault();
                        if(s && editMode) createLineAfter();
                        else moveToPrevIndent();
                        break;
                    case 'o':
                        e.preventDefault();
                        if(editMode) moveOutOneLevel();
                        else moveToPrevIndent();
                        break;
                    case 'i':
                        e.preventDefault();
                        if(editMode) moveInOneLevel();
                        else moveToNextIndent();
                        break;
                    case 'r':
                        e.preventDefault();
                        if(s) readActiveLine(); //TODO: Make this verbose
                        else readActiveLine();
                        break;
                    case 'l':
                        if(editMode) break;
                        e.preventDefault();
                        setMode('argument'); //TODO: Way to store previous mode
                        const argumentCallback = argument => {
                            RestorePreviousMode();
                            if(argument == null) return;
                            if(argument in ['0','1','2','3','4','5','6','7','8','9']) loadDemo(argument); //Note that 0 is a blank file
                            else loadFile();
                        };
                        break;
                    case 's':
                        if(editMode) break;
                        e.preventDefault();
                        saveFile();
                        break;
                    case '/':
                        e.preventDefault();
                        setMode('argument'); //TODO: Way to store previous mode
                        const argumentCallback = argument => {
                            RestorePreviousMode();
                            if(argument == null) return;
                            GetHelp(argument)
                        };
                        break;
                    case 'j':
                        e.preventDefault();
                        setMode('argument'); //TODO: Way to store previous mode
                        const argumentCallback = argument => {
                            RestorePreviousMode();
                            if(argument == null) return;
                            if(argument == '') jumpNextMatch();
                            else jumpToAny(argument);
                        };
                        break;
                    case 'J':
                        e.preventDefault();
                        jumpPrevMatch(); //Decide on this
                        break;
                    case 'e':
                        e.preventDefault();
                        if(editMode) setMode('execute');
                        runCode();
                        break;
                    case 'm':
                        e.preventDefault();
                        setMode(editMode ? 'execute' : 'edit');
                        break;
                    case 'g':
                        if(editMode) break;
                        e.preventDefault();
                        jumpToErrorLine()
                        break;
                    default:
                        break;
                }
            } //TODO: Stop propagation?
            else if(argMode) {
                if(e.key == 'Escape') { e.preventDefault(); cancelArgMode(); } //Return null
                // else if(e.key == 'Enter') { e.preventDefault(); completeArgMode(); } //Return null
            }
            // else if((editMode || executeMode) && !s && !c) {
            //     if (e.key === 'ArrowDown') { e.preventDefault(); actions.moveToNextIndent(); }
            //     if (e.key === 'ArrowUp') { e.preventDefault(); actions.moveToPrevIndent(); }
            //     if (e.key === 'ArrowRight') { e.preventDefault(); actions.moveInOneLevel(); }
            //     if (e.key === 'ArrowLeft') { e.preventDefault(); actions.moveOutOneLevel(); }
            // }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [code, activeLine, mode, setMode, createLineAfter, createLineBefore, moveToNextIndent, moveToPrevIndent, moveOutOneLevel, moveInOneLevel, readActiveLine, readActiveBlock, readActiveFunction, saveFile]);

    return null;
}

export default CustomShortcuts;
