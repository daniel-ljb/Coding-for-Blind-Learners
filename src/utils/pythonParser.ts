import { parser } from '@lezer/python';
import type { TreeCursor } from '@lezer/common';

export type Statement =
    | { type: 'SIMPLE'; raw: string; from: number; to: number; line: number }
    | {
        type: 'COMPOUND';
        keyword: string;
        arguments: string;
        body: Statement[];
        from: number;
        to: number;
        line: number;
    }
    | {
        type: 'COMMENT'; raw: string; from: number; to: number; line: number
    };

const COMPOUND_STATEMENTS = [
    'FunctionDefinition',
    'IfStatement',
    'ForStatement',
    'WhileStatement',
    'ClassDefinition',
    'WithStatement',
    'TryStatement',
];

const COMMENT_TYPE = "Comment";

const SKIP_NODES = ['newline', 'indent', 'dedent', '(', ')', ':'];

function getCode(code: string, from: number, to: number): string {
    return code.slice(from, to);
}

function getLine(code: string, pos: number): number {
    return code.slice(0, pos).split('\n').length;
}

function mapNodes(cursor: TreeCursor, code: string): Statement[] {
    const statements: Statement[] = [];

    if (!cursor.firstChild()) return [];

    do {
        const node = cursor.node;
        const type = node.name;

        console.log("Node:", type, "From:", node.from, "To:", node.to, "Text:", getCode(code, node.from, node.to));
        console.log(node);
        if (SKIP_NODES.includes(type)) continue;

        if (type === COMMENT_TYPE) {
            const raw = getCode(code, node.from, node.to).trim();
            if (raw) {
                statements.push({
                    type: 'COMMENT',
                    raw,
                    from: node.from,
                    to: node.to,
                    line: getLine(code, node.from)
                });
            }
        } else if (COMPOUND_STATEMENTS.includes(type)) {
            var p = node.firstChild;
            var currentConstruction: Extract<Statement, { type: 'COMPOUND' }> = {
                type: 'COMPOUND',
                keyword: '',
                arguments: '',
                body: [],
                from: -1,
                to: -1,
                line: -1
            }

            while (p != null) {
                if (currentConstruction.keyword === '') {
                    currentConstruction.keyword = p.name
                    currentConstruction.from = p.from
                    currentConstruction.line = getLine(code, p.from)
                }
                else if (p.name !== "Body")
                    currentConstruction.arguments += getCode(code, p.from, p.to) + " "
                else if (p.name === "Body") {
                    currentConstruction.body = mapNodes(p.cursor(), code)
                    currentConstruction.to = p.to

                    currentConstruction.arguments = currentConstruction.arguments.slice(0, -1) //Remove the final space
                    statements.push(currentConstruction)
                    currentConstruction = {
                        type: 'COMPOUND',
                        keyword: '',
                        arguments: '',
                        body: [],
                        from: -1,
                        to: -1,
                        line: getLine(code, node.from)
                    } //Start on a new one
                }

                p = p.nextSibling
            }
        } else {
            const raw = getCode(code, node.from, node.to).trim();
            if (raw) {
                statements.push({
                    type: 'SIMPLE',
                    raw,
                    from: node.from,
                    to: node.to,
                    line: getLine(code, node.from)
                });
            }
        }
    } while (cursor.nextSibling());

    return statements;
}

export function createTree(code: string): Statement[] {
    const tree = parser.parse(code);
    const output = mapNodes(tree.cursor(), code);
    console.log(code)
    console.log(output)
    return output
}
