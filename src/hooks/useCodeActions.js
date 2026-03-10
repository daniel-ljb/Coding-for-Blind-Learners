import { useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { demoLibrary } from '../utils/demoLibrary';
import { BLOCK_RULES } from '../utils/blocks';
import { getIndentLevel, findNextLineWithIndent, findPrevLineWithIndent } from '../utils/codeUtils';

export function useCodeActions() {
    const {
        code, setCode, activeLine, handleActiveLineChange, speakLine, showAndSpeak, setMode,
        outputHistory, setOutputHistory, outputIndex, setOutputIndex,
        codeRunnerRef, playSoundEffect
    } = useApp();

    const searchRef = useRef({ mode: 'any', term: '', matches: [], idx: -1 });
    const outputSearchRef = useRef({ term: '', matches: [], idx: -1 });
    const runErroredRef = useRef(false);

    const readActiveLine = useCallback((verbose=false) => {
        const lines = code.split('\n');
        speakLine(lines[activeLine], verbose);
    }, [code, speakLine]);

    const updateAndSpeakOutputLine = useCallback((index) => {
        const safeIdx = Math.max(0, Math.min(index, outputHistory.length - 1));
        setOutputIndex(safeIdx)
        showAndSpeak(outputHistory[safeIdx])
    }, [showAndSpeak, outputHistory, setOutputIndex])

    const repeatOutput = useCallback(() => {
        if (outputHistory.length === 0) {
            showAndSpeak("No output");
            return;
        }
        updateAndSpeakOutputLine(outputIndex);
    }, [outputIndex, updateAndSpeakOutputLine, outputHistory]);

    const nextOutput = useCallback(() => {
        if (outputHistory.length === 0) {
            showAndSpeak("No output");
            return;
        }
        const nextIdx = outputIndex < 0 ? 0 : outputIndex + 1;
        updateAndSpeakOutputLine(nextIdx);
    }, [outputIndex, updateAndSpeakOutputLine, outputHistory]);

    const prevOutput = useCallback(() => {
        if (outputHistory.length === 0) {
            showAndSpeak("No output");
            return;
        }
        const prevIdx = outputIndex <= 0 ? 0 : outputIndex - 1;
        updateAndSpeakOutputLine(prevIdx);
    }, [outputIndex, outputHistory, updateAndSpeakOutputLine, showAndSpeak, setOutputIndex]);

    const moveToNextIndent = useCallback(() => {
        const lines = code.split('\n');
        const indent = getIndentLevel(lines[activeLine]);
        const nextIdx = findNextLineWithIndent(lines, activeLine, indent);
        if (nextIdx !== -1) handleActiveLineChange(nextIdx);
        else speakLine('No next line with same indentation');
    }, [nextOutput, code, activeLine, handleActiveLineChange, speakLine]);

    const moveToPrevIndent = useCallback(() => {
        const lines = code.split('\n');
        const indent = getIndentLevel(lines[activeLine]);
        const prevIdx = findPrevLineWithIndent(lines, activeLine, indent);
        if (prevIdx !== -1) handleActiveLineChange(prevIdx);
        else speakLine('No previous line with same indentation');
    }, [prevOutput, code, activeLine, handleActiveLineChange, speakLine]);

    const moveOutOneLevel = useCallback(() => {
        const lines = code.split('\n');
        const currentIndent = getIndentLevel(lines[activeLine]);
        for (let i = activeLine - 1; i >= 0; i--) {
            if (getIndentLevel(lines[i]) < currentIndent) {
                handleActiveLineChange(i); return;
            }
        }
        speakLine('Already at root level');
    }, [code, activeLine, handleActiveLineChange, speakLine]);

    const moveInOneLevel = useCallback(() => {
        const lines = code.split('\n');
        const currentIndent = getIndentLevel(lines[activeLine]);
        for (let i = activeLine + 1; i < lines.length; i++) {
            if (getIndentLevel(lines[i]) > currentIndent) {
                handleActiveLineChange(i); return;
            }
            if (getIndentLevel(lines[i]) < currentIndent) break;
        }
        speakLine('No child level found');
    }, [code, activeLine, handleActiveLineChange, speakLine]);

    const startSearch = useCallback((mode, matches) => {
        if (!matches || matches.length === 0) {
            searchRef.current = { mode, matches: [], idx: -1 };
            speakLine(`No matches.`);
            return;
        }
        searchRef.current = { mode, matches, idx: 0 };

        const lineIdx = matches[0];
        handleActiveLineChange(lineIdx);
    }, [handleActiveLineChange, code, speakLine]);

    const jumpToAny = useCallback((term) => {
        const t = (term || '').trim();
        const lines = code.split('\n');
        const matches = [];
        for (let i = 0; i < lines.length; i++) {
            let j = (i + activeLine + 1) % lines.length
            if (t && lines[j].includes(t)) matches.push(j);
        }
        searchRef.current = { mode: 'any', matches, idx: 0 };
    }, [code]);

    const gotoMatch = useCallback((newIdx) => {
        const { matches, term } = searchRef.current;
        if (!matches || matches.length === 0) {
            speakLine('No active search');
            return;
        }
        const safeIdx = ((newIdx % matches.length) + matches.length) % matches.length; // wrap
        searchRef.current.idx = safeIdx;

        const lineIdx = matches[safeIdx];
        handleActiveLineChange(lineIdx);
    }, [handleActiveLineChange, code, speakLine]);

    const jumpNextMatch = useCallback(() => {
        gotoMatch(searchRef.current.idx + 1);
    }, [gotoMatch]);

    const jumpPrevMatch = useCallback(() => {
        gotoMatch(searchRef.current.idx - 1);
    }, [gotoMatch]);

    const gotoOutputMatch = useCallback((newIdx) => {
        const { matches } = outputSearchRef.current;
        if (!matches || matches.length === 0) {
            showAndSpeak('No active output search');
            return;
        }

        const safeIdx = ((newIdx % matches.length) + matches.length) % matches.length;
        outputSearchRef.current.idx = safeIdx;
        const outIdx = matches[safeIdx];
        updateAndSpeakOutputLine(outIdx);
    }, [updateAndSpeakOutputLine, showAndSpeak]);

    const jumpToOutput = useCallback((term) => {
        const t = (term || '').trim();

        if (outputHistory.length === 0) { showAndSpeak('No output'); return; }

        if (!t) return gotoOutputMatch(outputSearchRef.current.idx + 1);
        
        const matches = [];
        const start = outputIndex < 0 ? 0 : outputIndex;

        for (let i = 0; i < outputHistory.length; i++) {
            const j = (start + 1 + i) % outputHistory.length;
            if ((outputHistory[j] || '').includes(t)) matches.push(j);
        }

        if (matches.length === 0) {
            outputSearchRef.current = { term: t, matches: [], idx: -1 };
            showAndSpeak(`No output matches for "${t}".`);
            return;
        }

        outputSearchRef.current = { term: t, matches, idx: 0 };
        updateAndSpeakOutputLine(matches[0]);
    }, [outputHistory, outputIndex, updateAndSpeakOutputLine, gotoOutputMatch, showAndSpeak]);

    const jumpNextOutputMatch = useCallback(() => {
        return gotoOutputMatch(outputSearchRef.current.idx + 1);
    }, [gotoOutputMatch]);

    const jumpPrevOutputMatch = useCallback(() => {
        return gotoOutputMatch(outputSearchRef.current.idx - 1);
    }, [gotoOutputMatch]);

    const jumpToErrorLine = useCallback(() => {
        if (outputHistory.length === 0 || outputIndex < 0) {
            showAndSpeak('No error line detected');
            return;
        }

        // Error lines are of form (lineNum) (code[lineNum])
        const currentLine = outputHistory[outputIndex] || '';
        const match = currentLine.match(/(\d+) (.*)/i);
        if (!match) {
            showAndSpeak('No error line detected');
            return;
        }

        const lineNum = parseInt(match[1], 10);
        const codeLines = code.split('\n');
        if (Number.isNaN(lineNum) || lineNum < 1 ||lineNum > codeLines.length || match[2].trim() !== codeLines[lineNum - 1].trim()) {
            showAndSpeak('No error line detected');
            return;
        }

        setMode('edit');
        handleActiveLineChange(lineNum - 1);
    }, [outputHistory, outputIndex, handleActiveLineChange, setMode, showAndSpeak]);

    const createLineAfter = useCallback(() => {
        const lines = code.split('\n');
        let indent = getIndentLevel(lines[activeLine] || '');
        console.log(lines[activeLine]);
        if(lines[activeLine].trim().split(' ')[0] in BLOCK_RULES) {
            console.log('Current line is a block header, increasing indent for new line: ', indent);
            indent += 4;
        }
        lines.splice(activeLine + 1, 0, ' '.repeat(indent));
        setCode(lines.join('\n'));
        handleActiveLineChange(activeLine + 1);
    }, [code, activeLine, setCode, handleActiveLineChange, speakLine]);

    const createLineBefore = useCallback(() => {
        const lines = code.split('\n');
        const indent = getIndentLevel(lines[activeLine] || '');
        lines.splice(activeLine, 0, ' '.repeat(indent));
        setCode(lines.join('\n'));
        handleActiveLineChange(activeLine);
    }, [code, activeLine, setCode, speakLine]);

    const saveFile = useCallback((filename = 'code.py') => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = filename;
        link.click(); URL.revokeObjectURL(url);
        speakLine(`Saved ${filename}`);
    }, [code, speakLine]);

    const loadFile = useCallback(async () => {
        try {
            const [handle] = await window.showOpenFilePicker();
            const file = await handle.getFile();
            const content = await file.text();
            setCode(content); handleActiveLineChange(0);
            speakLine(`Loaded ${file.name}`);
        } catch (e) { if (e.name !== 'AbortError') speakLine("Load failed"); }
    }, [setCode, handleActiveLineChange, speakLine]);

    const initCodeRunner = useCallback(() => {
        if (codeRunnerRef.current) return;
        const worker = new Worker(new URL('../codeExecution/python.worker.ts', import.meta.url));
        worker.onmessage = (e) => {
            const { type, data, result, error } = e.data;

            const likelyError = (line) =>
                typeof line === 'string' && (
                    line.includes('Traceback') ||
                    line.includes('SyntaxError') ||
                    line.includes('IndentationError') ||
                    line.includes('NameError') ||
                    line.includes('TypeError') ||
                    line.includes('ValueError') ||
                    line.includes('ZeroDivisionError') ||
                    line.includes('AttributeError') ||
                    line.includes('KeyError') ||
                    line.includes('IndexError') ||
                    line.includes('Exception') ||
                    line.includes('Error') ||
                    line.includes('ImportError')
                )

            if (type === 'output') {
                playSoundEffect("confirm3");
                if (likelyError(data)) runErroredRef.current = true;
                setOutputHistory(prev => {
                    const next = [...prev, data];
                    setOutputIndex(next.length - 1);
                    return next;
                });
                showAndSpeak(data);
            }
            else if (type === 'inputRequest') {
                playSoundEffect("confirm3");
                const msg = `Input required: ${data}`;
                setOutputHistory(prev => {
                    const next = [...prev, msg];
                    //TODO: play sfx
                    setOutputIndex(next.length - 1);
                    return next;
                });
                showAndSpeak(msg);
            }
            
            else if (type === 'error') {
                runErroredRef.current = true;
                const msg = `Error: ${error}`;
                setOutputHistory(prev => {
                    const next = [...prev, msg];
                    setOutputIndex(next.length - 1);
                    return next;
                });
                showAndSpeak(msg);
            }
            else if (type === 'terminated') {
                setOutputHistory(prev => {
                    const next = [...prev, 'Terminated'];
                    //TODO: play sfx
                    setOutputIndex(next.length - 1);
                    if(!runErroredRef.current){
                        if (prev.length === 0) {
                            showAndSpeak('Execution terminated');
                        } else {
                            speakLine('Execution terminated');
                        }
                    }
                    return next;
                });
            }
        };
        codeRunnerRef.current = worker
    }, [speakLine, showAndSpeak, setOutputIndex, setOutputHistory, playSoundEffect]);

    const runCode = useCallback(() => {
        runErroredRef.current = false;
        setOutputHistory([]); setOutputIndex(-1);
        showAndSpeak("Running...");
        initCodeRunner();
        console.log("RUN CODE STRING:\n", code);
        codeRunnerRef.current?.postMessage({ type: 'run', data: code });
    }, [initCodeRunner, code, setOutputHistory, showAndSpeak, setOutputIndex]);

    const giveCodeInput = useCallback((input) => {
        codeRunnerRef.current?.postMessage({ type: 'input', data: input });
    }, [initCodeRunner, code, setOutputHistory, showAndSpeak, setOutputIndex]);

    const loadDemo = useCallback((id) => {
        if(!id in demoLibrary) {
            speakLine('Demo not found')
            return
        }
        const content = demoLibrary[id];
        setCode(content);
        handleActiveLineChange(0);
        speakLine(`Loaded Demo ${id}`);
    }, [setCode, handleActiveLineChange, speakLine]);

    return {
        createLineAfter, createLineBefore,
        moveToNextIndent, moveToPrevIndent,
        moveOutOneLevel, moveInOneLevel,
        jumpNextMatch, jumpPrevMatch, startSearch,
        jumpNextOutputMatch, jumpPrevOutputMatch, jumpToOutput,
        jumpToErrorLine,
        readActiveLine,
        loadFile, saveFile,
        initCodeRunner, runCode, giveCodeInput,
        nextOutput, prevOutput, repeatOutput,
        loadDemo
    };
}