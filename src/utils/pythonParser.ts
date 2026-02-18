import { parser } from '@lezer/python';
import type { TreeCursor } from '@lezer/common';

export type Statement =
    | { type: 'SIMPLE'; raw: string; from: number; to: number }
    | {
        type: 'COMPOUND';
        keyword: string;
        arguments: string;
        body: Statement[];
        from: number;
        to: number;
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

const SKIP_NODES = ['newline', 'indent', 'dedent', '(', ')', ':'];

function getCode(code: string, from: number, to: number): string {
    return code.slice(from, to);
}

function getKeyword(cursor: TreeCursor, code: string): string {
    const keywordNode = cursor.node.firstChild;
    if (!keywordNode) return '';
    return getCode(code, keywordNode.from, keywordNode.to);
}

function getHeaderText(
    cursor: TreeCursor,
    bodyNode: ReturnType<TreeCursor['node']['getChild']>,
    keyword: string,
    code: string
): string {
    const endOfHeader = bodyNode ? bodyNode.from : cursor.node.to;
    const headerText = getCode(code, cursor.node.from + keyword.length, endOfHeader).trim();
    return headerText.replace(/:$/, '').trim();
}

function mapNodes(cursor: TreeCursor, code: string): Statement[] {
    const statements: Statement[] = [];

    if (!cursor.firstChild()) return [];

    do {
        const node = cursor.node;
        const type = node.name;

        if (SKIP_NODES.includes(type)) continue;

        if (COMPOUND_STATEMENTS.includes(type)) {
            var p = node.firstChild;
            var currentConstruction : Extract<Statement, {type: 'COMPOUND' }> = {
                type: 'COMPOUND',
                keyword: '',
                arguments: '',
                body: [],
                from: -1,
                to: -1
            }

            while(true) {
                if(currentConstruction.keyword === '') {
                    currentConstruction.keyword = p.name
                    currentConstruction.from = p.from
                }   
                else if(p.name !== "Body")
                    currentConstruction.arguments += getCode(code, p.from, p.to)
                else if(p.name === "Body") {
                    currentConstruction.body = mapNodes(p.cursor(), code)
                    currentConstruction.to = p.to

                    statements.push(currentConstruction)
                    currentConstruction = {
                        type: 'COMPOUND',
                        keyword: '',
                        arguments: '',
                        body: [],
                        from: -1,
                        to: -1
                    } //Start on a new one
                }

                if(p.nextSibling == null) break
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
