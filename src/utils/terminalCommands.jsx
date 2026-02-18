/**
 * Pure helpers and command parsing for terminal commands.
 * Used by useTerminalCommands hook and by Terminal / OneLineTerminal.
 */

// --- Pure helpers (no React state) ---

export function getIndentLevel(line) {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

export function findNextLineWithIndent(lines, startIdx, targetIndent) {
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const indent = getIndentLevel(line);
    if (indent < targetIndent) break;
    if (indent === targetIndent) return i;
  }
  return -1;
}

export function findPrevLineWithIndent(lines, startIdx, targetIndent) {
  for (let i = startIdx - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line.trim()) continue;
    const indent = getIndentLevel(line);
    if (indent < targetIndent) break;
    if (indent === targetIndent) return i;
  }
  return -1;
}

export function getBlock(lines, startIdx) {
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
}

export function findFunction(lines, funcName) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`def ${funcName}`)) return i;
  }
  return -1;
}

export function findComment(lines, commentName) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('#') && lines[i].includes(commentName)) return i;
  }
  return -1;
}

// --- Command help (pure) ---

export const COMMAND_HELP = {
  'next': 'next / down - Go to next line with same indentation',
  'prev': 'prev / up - Go to previous line with same indentation',
  'leave': 'leave / left - Move up one indentation level',
  'in': 'in / right - Move down one indentation level',
  'new line after': 'new line after / Shift+Down - Create new line after current',
  'new line before': 'new line before / Shift+Up - Create new line before current',
  'jump func': 'jump func "name" - Jump to function with given name',
  'jump com': 'jump com "name" - Jump to comment with given name',
  'read line': 'read line / Ctrl+L - Read current line',
  'read block': 'read block / Ctrl+B - Read current block',
  'read func': 'read func / Ctrl+F - Read current function',
  'load': 'load - Open file picker to load a Python file',
  'save': 'save [filename] / Ctrl+S - Download code as a Python file (default: code.py)',
};

export function getCommandHelp(cmdName) {
  return COMMAND_HELP[cmdName] || 'Command not found';
}

/**
 * Parse a terminal command string and return { type, action? } or { type, text }.
 * @param {string} cmd - Raw command string
 * @param {object} handlers - { moveToNextIndent, moveToPrevIndent, moveOutOneLevel, moveInOneLevel,
 *   createLineAfter, createLineBefore, jumpToFunction, jumpToComment, readLine, readBlock, readFunction,
 *   saveFile, getCommandHelp, triggerLoad, handleRun, handleClear }
 */
export function parseCommand(cmd, handlers) {
  const trimmed = cmd.trim();

  if (trimmed === '?') {
    return {
      type: 'help',
      text: `Available commands:\nnext/down, prev/up, leave/left, in/right\nnew line before, new line after\njump func "name", jump com "name"\nread line, read block, read func\nrun, clear, ? "command"`,
    };
  }

  if (trimmed.startsWith('? ')) {
    const cmdName = trimmed.substring(2).trim();
    return { type: 'help', text: handlers.getCommandHelp(cmdName) };
  }

  if (trimmed === 'next' || trimmed === 'down') {
    return { type: 'action', action: handlers.moveToNextIndent };
  }
  if (trimmed === 'prev' || trimmed === 'up') {
    return { type: 'action', action: handlers.moveToPrevIndent };
  }
  if (trimmed === 'leave' || trimmed === 'left') {
    return { type: 'action', action: handlers.moveOutOneLevel };
  }
  if (trimmed === 'in' || trimmed === 'right') {
    return { type: 'action', action: handlers.moveInOneLevel };
  }

  if (trimmed === 'new line after') {
    return { type: 'action', action: handlers.createLineAfter };
  }
  if (trimmed === 'new line before') {
    return { type: 'action', action: handlers.createLineBefore };
  }

  if (trimmed.startsWith('jump func ')) {
    const funcName = trimmed.substring(9).replace(/"/g, '').trim();
    return { type: 'action', action: () => handlers.jumpToFunction(funcName) };
  }
  if (trimmed.startsWith('jump com ')) {
    const comName = trimmed.substring(9).replace(/"/g, '').trim();
    return { type: 'action', action: () => handlers.jumpToComment(comName) };
  }

  if (trimmed === 'read line') {
    return { type: 'action', action: handlers.readLine };
  }
  if (trimmed === 'read block') {
    return { type: 'action', action: handlers.readBlock };
  }
  if (trimmed === 'read func') {
    return { type: 'action', action: handlers.readFunction };
  }

  if (trimmed === 'run') {
    return { type: 'action', action: handlers.handleRun };
  }
  if (trimmed === 'clear') {
    return { type: 'action', action: handlers.handleClear };
  }
  if (trimmed === 'load') {
    return { type: 'action', action: handlers.triggerLoad };
  }
  if (trimmed === 'save' || trimmed.startsWith('save ')) {
    const filename = trimmed.substring(4).trim() || 'code.py';
    return { type: 'action', action: () => handlers.saveFile(filename) };
  }

  return { type: 'error', text: `Unknown command: ${trimmed}` };
}
