export const getIndentLevel = (line) => {
    const match = line?.match(/^(\s*)/);
    return match ? match[1].length : 0;
};

export const findNextLineWithIndent = (lines, startIdx, targetIndent) => {
    for (let i = startIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        const indent = getIndentLevel(line);
        if (indent < targetIndent) break;
        if (indent === targetIndent) return i;
    }
    return -1;
};

export const findPrevLineWithIndent = (lines, startIdx, targetIndent) => {
    for (let i = startIdx - 1; i >= 0; i--) {
        const line = lines[i];
        const indent = getIndentLevel(line);
        if (indent < targetIndent) break;
        if (indent === targetIndent) return i;
    }
    return -1;
};
