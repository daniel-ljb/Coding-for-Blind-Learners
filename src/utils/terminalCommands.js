// Helper: Get indentation level of a line
export const getIndentLevel = (line) => {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
};

// Helper: Find next line with same indentation in same block
export const findNextLineWithIndent = (lines, startIdx, targetIndent) => {
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines
    const indent = getIndentLevel(line);
    if (indent < targetIndent) break; // Left the block
    if (indent === targetIndent) return i;
  }
  return -1;
};

// Helper: Find previous line with same indentation in same block
export const findPrevLineWithIndent = (lines, startIdx, targetIndent) => {
  for (let i = startIdx - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line.trim()) continue;
    const indent = getIndentLevel(line);
    if (indent < targetIndent) break;
    if (indent === targetIndent) return i;
  }
  return -1;
};

// Helper: Get current code block (same indentation level)
export const getBlock = (lines, startIdx) => {
  const targetIndent = getIndentLevel(lines[startIdx]);
  const start = startIdx;
  let end = startIdx;
  
  for (let i = startIdx + 1; i < lines.length; i++) {
    const indent = getIndentLevel(lines[i]);
    if (!lines[i].trim()) continue;
    if (indent < targetIndent) break;
    if (indent === targetIndent) end = i;
  }
  return { start, end };
};

// Helper: Find function by name
export const findFunction = (lines, funcName) => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`def ${funcName}`)) return i;
  }
  return -1;
};

// Helper: Find comment by name
export const findComment = (lines, commentName) => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('#') && lines[i].includes(commentName)) return i;
  }
  return -1;
};