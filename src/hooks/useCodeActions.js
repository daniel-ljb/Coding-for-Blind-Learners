import { useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { demoLibrary } from '../utils/demoLibrary';

// --- Original Helpers ---
const getIndentLevel = (line) => {
    const match = line?.match(/^(\s*)/);
    return match ? match[1].length : 0;
};

const findNextLineWithIndent = (lines, startIdx, targetIndent) => {
    for (let i = startIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const indent = getIndentLevel(line);
        if (indent < targetIndent) break;
        if (indent === targetIndent) return i;
    }
    return -1;
};

const findPrevLineWithIndent = (lines, startIdx, targetIndent) => {
    for (let i = startIdx - 1; i >= 0; i--) {
        const line = lines[i];
        if (!line.trim()) continue;
        const indent = getIndentLevel(line);
        if (indent < targetIndent) break;
        if (indent === targetIndent) return i;
    }
    return -1;
};

export function useCodeActions() {
    const {
        code, setCode, activeLine, handleActiveLineChange, speakLine,
        outputHistory, setOutputHistory, outputIndex, setOutputIndex,
        codeRunnerRef
    } = useApp();

    const searchRef = useRef({ mode: 'any', term: '', matches: [], idx: -1 });

    // --- restored read functions ---
    const readActiveLine = useCallback(() => {
        const lines = code.split('\n');
        speakLine(lines[activeLine]);
    }, [code, speakLine]);

    const updateAndSpeakOutputLine = useCallback((index) => {
        const safeIdx = Math.max(0, Math.min(index, outputHistory.length - 1));
        setOutputIndex(safeIdx)
        speakLine(outputHistory[safeIdx])
    }, [speakLine, outputHistory, setOutputIndex])

    const repeatOutput = useCallback(() => {
        if (outputHistory.length === 0) {
            speakLine("No output");
            return;
        }
        updateAndSpeakOutputLine(outputIndex);
    }, [outputIndex, updateAndSpeakOutputLine, outputHistory]);

    const nextOutput = useCallback(() => {
        if (outputHistory.length === 0) {
            speakLine("No output");
            return;
        }
        const nextIdx = outputIndex < 0 ? 0 : outputIndex + 1;
        updateAndSpeakOutputLine(nextIdx);
    }, [outputIndex, updateAndSpeakOutputLine, outputHistory]);

    const prevOutput = useCallback(() => {
        if (outputHistory.length === 0) {
            speakLine("No output");
            return;
        }
        const prevIdx = outputIndex <= 0 ? 0 : outputIndex - 1;
        updateAndSpeakOutputLine(prevIdx);
    }, [outputIndex, outputHistory, updateAndSpeakOutputLine, speakLine, setOutputIndex]);

    // --- restored navigation functions ---
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
            if (lines[i].trim() && getIndentLevel(lines[i]) < currentIndent) {
                handleActiveLineChange(i); return;
            }
        }
        speakLine('Already at root level');
    }, [code, activeLine, handleActiveLineChange, speakLine]);

    const moveInOneLevel = useCallback(() => {
        const lines = code.split('\n');
        const currentIndent = getIndentLevel(lines[activeLine]);
        for (let i = activeLine + 1; i < lines.length; i++) {
            if (lines[i].trim() && getIndentLevel(lines[i]) > currentIndent) {
                handleActiveLineChange(i); return;
            }
            if (lines[i].trim() && getIndentLevel(lines[i]) < currentIndent) break;
        }
        speakLine('No child level found');
    }, [code, activeLine, handleActiveLineChange, speakLine]);

    const startSearch = useCallback((mode, matches) => {
        if (!matches || matches.length === 0) {
            searchRef.current = { mode, matches: [], idx: -1 };
            speakLine(`No matches for "${t}".`);
            return;
        }
        searchRef.current = { mode, matches, idx: 0 };

        const lineIdx = matches[0];
        handleActiveLineChange(lineIdx);
    }, [handleActiveLineChange, code, speakLine]);

    // --- restored jump functions ---
    const jumpToAny = useCallback((term) => {
        const t = (term || '').trim();
        const lines = code.split('\n');
        const matches = [];
        for (let i = 0; i < lines.length; i++) {
            let j = (i + activeLine + 1) % lines.length
            if (t && lines[j].includes(t)) matches.push(j);
        }
        startSearch('any', matches);
    }, [code, startSearch]);

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

    // --- restored code editing ---
    const createLineAfter = useCallback(() => {
        const lines = code.split('\n');
        const indent = getIndentLevel(lines[activeLine] || '');
        lines.splice(activeLine + 1, 0, ' '.repeat(indent));
        setCode(lines.join('\n'));
        handleActiveLineChange(activeLine + 1);
    }, [code, activeLine, setCode, handleActiveLineChange, speakLine]);

    const createLineBefore = useCallback(() => {
        const lines = code.split('\n');
        const indent = getIndentLevel(lines[activeLine] || '');
        lines.splice(activeLine, 0, ' '.repeat(indent));
        setCode(lines.join('\n'));
    }, [code, activeLine, setCode, speakLine]);

    // --- restored File I/O ---
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

    // --- restored Execution ---
    const initCodeRunner = useCallback(() => {
        if (codeRunnerRef.current) return;
        const worker = new Worker(new URL('../codeExecution/python.worker.ts', import.meta.url));
        worker.onmessage = (e) => {
            const { type, data, result, error } = e.data;

            if (type === 'output') {
                setOutputHistory(prev => {
                    const next = [...prev, data];
                    return next;
                });
            }
            else if (type === 'inputRequest') {
                setOutputHistory(prev => {
                    const next = [...prev, `input required ${data}`];
                    //TODO: play sfx
                    return next;
                });
            }
            else if (type === 'terminated') {
                setOutputHistory(prev => {
                    const next = [...prev, 'Terminated'];
                    //TODO: play sfx
                    return next;
                });
            }
            else if (type === 'error') {
                speakLine(`Error: ${error}`);
            }
        };
        codeRunnerRef.current = worker
    }, [speakLine, setOutputHistory]);

    const runCode = useCallback(() => {
        setOutputHistory([]); setOutputIndex(-1);
        speakLine("Running...");
        initCodeRunner();
        codeRunnerRef.current?.postMessage({ type: 'run', data: code });
    }, [initCodeRunner, code, setOutputHistory, speakLine, setOutputIndex]);

    const giveCodeInput = useCallback((input) => {
        codeRunnerRef.current?.postMessage({ type: 'input', data: input });
    }, [initCodeRunner, code, setOutputHistory, speakLine, setOutputIndex]);

    // missing originals

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
        jumpNextMatch, jumpPrevMatch,
        jumpToAny,
        readActiveLine,
        loadFile, saveFile,
        initCodeRunner, runCode, giveCodeInput,
        nextOutput, prevOutput, repeatOutput,
        loadDemo
    };
}