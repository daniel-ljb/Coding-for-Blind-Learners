import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useCodeActions } from '../hooks/useCodeActions';

const EDIT_COMMAND_HELP = {
    "u": "Previous line with same indent",
    "U": "New line before",
    "d": "Next line with same indent",
    "D": "New line after",
    "o": "Out one indent level",
    "i": "IN one indent level",
    "r": "Read current line",
    "R": "Verbose read current line",
    "l": "Load file. Opens argument mode. Numbers 0 to 10 give demos, everything else opens folder",
    "s": "Save as file",
    "/": "Help. Opens argument mode",
    "j": "Jump. Opens argument mode. Type where you want to jump and press enter. Type nothing to repeat your last jump. Capital J searches in opposite direction.",
    "J": "Repeates search backwards",
    "e": "Executes program and opens edit mode.",
    "m": "Switches between edit and execute mode",
};
const EDIT_COMMANDS = ["u", "shift u", "d", "shift d", "o", "i", "r", "shift r", "l", "s", "slash", "j", "J", "e", "m", ]
const EXECUTE_COMMAND_HELP = {
    "u": "Previous output line",
    "d": "Next output line",
    "o": "Previous output line",
    "i": "Next output line",
    "r": "Read current output line",
    "R": "Verbose read current output line",
    "/": "Help. Opens argument mode",
    "e": "Executes program and stays in edit mode.",
    "m": "Switches between edit and execute mode",
    "g": "Jumps to the line that caused the current error. Opens edit mode.",
};
const EXECUTE_COMMANDS = [ "u", "d", "o", "i", "r", "shift r", "slash", "e", "m", "g"];

function CustomShortcuts() {
    const { code, activeLine, mode, setMode, argumentCallback, setArgumentCallback, speakLine } = useApp();
    const {
        createLineAfter, createLineBefore,
        moveToNextIndent, moveToPrevIndent,
        moveOutOneLevel, moveInOneLevel,
        startSearch, jumpNextMatch, jumpPrevMatch,
        readActiveLine, readActiveBlock, readActiveFunction,
        loadFile, saveFile, runCode,
        nextOutput, prevOutput, repeatOutput,
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
            if (editMode || executeMode) {
                if((c && k === 'u') || k === 'arrowup') {
                    e.preventDefault();
                    if(s && editMode) createLineBefore();
                    else if (editMode) moveToPrevIndent();
                    else prevOutput();
                }
                if((c && k === 'd') || k === 'arrowdown') {
                    e.preventDefault();
                    if(s && editMode) createLineAfter();
                    else if (editMode) moveToNextIndent();
                    else nextOutput();
                }
                else if(c && k === 'o') {
                    e.preventDefault();
                    if(editMode) moveOutOneLevel();
                    else prevOutput();
                }
                else if(c && k === 'i') {
                    e.preventDefault();
                    if(editMode) moveInOneLevel();
                    else nextOutput();
                }
                else if(c && k === 'r') {
                    e.preventDefault();
                    if(s && editMode) readActiveLine(true); //Verbose
                    else if (editMode) readActiveLine(false);
                    else repeatOutput();
                }
                else if(c && k === 'l') {
                    e.preventDefault();
                    if(executeMode) return;
                    speakLine("Enter demo number")
                    setArgumentCallback(() => (argument) => {
                        setMode(mode)
                        if(argument == null) return;
                        if(argument in ['0','1','2','3','4','5','6','7','8','9','10']) loadDemo(argument); //Note that 0 is a blank file
                        else loadFile();
                    });
                    setMode('argument'); //TODO: Way to store previous mode
                }
                else if(c && s && k === 's') {
                    e.preventDefault();
                    if(executeMode) return;
                    saveFile();
                }
                else if(c && k === '?') {
                    e.preventDefault();
                    speakLine("Enter key for help")
                    setArgumentCallback(() => (argument) => {
                        setMode(mode)
                        if (argument == null) return;
                        const help = (editMode ? EDIT_COMMAND_HELP : EXECUTE_COMMAND_HELP)[argument]
                        if (help == null) speakLine("Invalid command.")
                        else speakLine(help);
                    });
                    setMode('argument'); //TODO: Way to store previous mode
                }
                else if(c && k === '/') {
                    e.preventDefault();
                    const avilableCommands = (editMode ? EDIT_COMMANDS : EXECUTE_COMMANDS).join(", control ")
                    speakLine(`Available commands: control ${avilableCommands}`)
                }
                else if(c && k === 'j') {
                    e.preventDefault();
                    if(executeMode) return;

                    speakLine("Enter search term")
                    setArgumentCallback(() => (argument) => {
                        setMode(mode)
                        if(argument == null) return;

                        if(argument !== '') startSearch(argument);
                        if(s) jumpPrevMatch();
                        else jumpNextMatch();
                    });
                    setMode('argument')
                }
                else if(c && k === 'e') {
                    e.preventDefault();
                    if(editMode) setMode('execute');
                    runCode();
                }
                else if(c && k === 'm') {
                    e.preventDefault();
                    setMode(editMode ? 'execute' : 'edit');
                }
                // else if(c && k === 'g') {
                //     e.preventDefault();
                //     if(editMode) return;
                //     jumpToErrorLine()
                // }
            }
            else if(argMode) {
                if(e.key == 'Escape') { e.preventDefault(); argumentCallback(null); } //Return null
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [code, activeLine, mode, setMode, createLineAfter, createLineBefore, moveToNextIndent, moveToPrevIndent, moveOutOneLevel, moveInOneLevel, readActiveLine, readActiveBlock, readActiveFunction, saveFile]);

    return null;
}

export default CustomShortcuts;
