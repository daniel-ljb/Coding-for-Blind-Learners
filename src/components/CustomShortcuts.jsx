import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useCodeActions } from '../hooks/useCodeActions';

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

function CustomShortcuts() {
    const { code, activeLine, mode, setMode, argumentCallback, setArgumentCallback } = useApp();
    const {
        createLineAfter, createLineBefore,
        moveToNextIndent, moveToPrevIndent,
        moveOutOneLevel, moveInOneLevel,
        jumpToAny, jumpNextMatch, jumpPrevMatch,
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
                if((c && k === 'y') || k === 'arrowup') {
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
                    else if (editMode) moveToPrevIndent();
                    else prevOutput();
                }
                else if(c && k === 'i') {
                    e.preventDefault();
                    if(editMode) moveInOneLevel();
                    else if (editMode) moveToNextIndent();
                    else nextOutput();
                }
                else if(c && k === 'r') {
                    e.preventDefault();
                    if(s && editMode) readActiveLine(); //TODO: Make this verbose
                    else if (editMode) readActiveLine();
                    else repeatOutput();
                }
                else if(c && s && k === 'l') {
                    e.preventDefault();
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
                    saveFile();
                }
                else if(c && k === '/') {
                    e.preventDefault();
                        setArgumentCallback(() => (argument) => {
                        setMode(mode)
                        if(argument == null) return;
                        GetHelp(argument)
                    });
                    setMode('argument'); //TODO: Way to store previous mode
                }
                else if(c && k === 'j') {
                    e.preventDefault();
                    if(s) {
                        jumpPrevMatch();
                    } else {
                        setArgumentCallback(() => (argument) => {
                            setMode(mode)
                            if(argument == null) return;
                            if(argument == '') jumpNextMatch();
                            else jumpToAny(argument);
                        });
                        setMode('argument'); //TODO: Way to store previous mode
                    }
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
                else if(c && k === 'g') {
                    if(editMode) return;
                    e.preventDefault();
                    jumpToErrorLine()
                }
            } //TODO: Stop propagation?
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
