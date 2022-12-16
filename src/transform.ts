import * as ts from 'typescript';

type JsxParent = ts.JsxElement | ts.JsxFragment;
const jsxParents = [ts.SyntaxKind.JsxElement, ts.SyntaxKind.JsxFragment];

export default function(_program: ts.Program, _pluginOptions: object) {
    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            function visitor(node: ts.Node): ts.Node {
                try {
                    if (ts.isImportDeclaration(node)) {
                        const pkg = node.moduleSpecifier as ts.StringLiteral;
                        if (pkg.text === 'jsx-conditionals') return null; // Remove the imports
                    }
                    if (jsxParents.includes(node.kind)) {
                        checkForOrphanedNodes(node as JsxParent);
                    }
                    if (isIfNode(node)) {
                        return ts.visitEachChild(createTernary(ctx, node), visitor, ctx);
                    }
                    if (isElseNode(node) || isElseIfNode(node)) {
                        // Top-level case only
                        if (!jsxParents.includes(node.parent.kind)) {
                            throw new Error(nodeToString(node) + " is used a top-level node and has no associated <If> condition");
                        }
                        // We already processed the <Else> and <ElseIf> clauses so here we can just erase them
                        return null;
                    }
                }
                catch (err) {
                    if (err.message) {
                        err.message = `${err.message}\r\nIn file ${sourceFile.fileName}\r\nAt node ${node.getText()}`;
                    }
                    throw err;
                }
                return ts.visitEachChild(node, visitor, ctx);
            }
            return ts.visitEachChild(sourceFile, visitor, ctx);
        };
    };
}

function createTernary(ctx: ts.TransformationContext, prevBranch: ts.JsxElement) {
    return ctx.factory.createJsxExpression(
        undefined,
        ctx.factory.createConditionalExpression(
            getConditionExpression(prevBranch),
            ctx.factory.createToken(ts.SyntaxKind.QuestionToken),
            createTernaryOperand(ctx, prevBranch, getJsxChildren(prevBranch)),
            ctx.factory.createToken(ts.SyntaxKind.ColonToken),
            createWhenFalseExpression(prevBranch, ctx, prevBranch)
        )
    );
}

function checkForOrphanedNodes(jsxParent: JsxParent) {
    const errMsg = " has no matching <If> or <ElseIf>. Only whitespace is allowed between them.";

    jsxParent.children.forEach((child, idx) => {
        const isElse = isElseNode(child);
        const isElseIf = isElseIfNode(child);
        if (isElse || isElseIf) {
            // Found an Else or ElseIf, now walk backwards until we find an If or ElseIf
            let currIdx = idx - 1;
            while (currIdx >= 0) {
                const sibling = jsxParent.children[currIdx];
                if (isEmptyTextNode(sibling) || isPossibleCommentNode(sibling)) {
                    currIdx--;
                    continue;
                }
                if (isIfNode(sibling) || isElseIfNode(sibling)) {
                    return;
                }
                throw Error(nodeToString(child) + errMsg);
            }
            throw Error(nodeToString(child) + errMsg);
        }
    });
}

function isIfNode(node: ts.Node): node is ts.JsxElement {
    return ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'If';
} 

function isElseIfNode(node: ts.Node): node is ts.JsxElement {
    return ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'ElseIf';
}

function isElseNode(node: ts.Node): node is ts.JsxElement {
    return ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'Else';
}

function isEmptyTextNode(node: ts.Node): boolean {
    return ts.isJsxText(node) && node.text.trim().length === 0;
}

function nodeToString(node: ts.Node): string {
    if (isIfNode(node)) return '<If>';
    if (isElseIfNode(node)) return '<ElseIf>';
    if (isElseNode(node)) return '<Else>';
    throw Error('Unknown node');
}

// Comments aren't included in the AST, but if the node is an empty JSX expression
// then it's fine to assume it's probably a comment.
function isPossibleCommentNode(node: ts.Node): boolean {
    return ts.isJsxExpression(node)
        && node.getChildCount() == 2; // '{' and '}'
}

function getConditionExpression(jsxElem: ts.JsxElement): ts.Expression {
    const attrName = 'condition';
    let conditionAttr: ts.JsxAttribute = null;

    jsxElem.openingElement.attributes.forEachChild(attr => {
        if (ts.isJsxAttribute(attr) && attr.name.getText() === attrName) {
            conditionAttr = attr;
            return;
        }
    });

    if (!conditionAttr) {
        throw new Error(`Missing '${attrName}' property`);
    }

    const initializer = conditionAttr.initializer;
    if (!ts.isJsxExpression(initializer)) {
        throw new Error(`'${attrName}' property should be type JsxExpression, found ${ts.SyntaxKind[initializer.kind]}`);
    }
    return initializer.expression;
}

function createTernaryOperand(ctx: ts.TransformationContext, originalNode: ts.Node, children: ts.JsxChild[]) {
    if (children.length < 1) {
        return ctx.factory.createNull();
    }
    if (children.length === 1) {
        // This is just an optimisation to prevent creating a JSX fragment if it's not necessary
        const child = children[0];
        if (ts.isJsxText(child)) {
            return ctx.factory.createStringLiteral(child.text);
        }
        else if (!ts.isJsxExpression(child)) {
            return child;
        }
    }
    return ctx.factory.createJsxFragment(
        createJsxOpeningFragment(ctx, originalNode),
        children,
        ctx.factory.createJsxJsxClosingFragment()
    );
}

function createJsxOpeningFragment(ctx: ts.TransformationContext, originalNode: ts.Node) {
    const openingFrag = ctx.factory.createJsxOpeningFragment();
    ts.setOriginalNode(openingFrag, originalNode); // https://github.com/microsoft/TypeScript/issues/35686
    return openingFrag;
}

function getJsxChildren(parent: JsxParent) {
    const children = parent.getChildren();
    const expectedNumChildren = 3;
    if (children.length !== expectedNumChildren) {
        throw new Error(`${tagToStr(parent)} has ${children.length} children, expected ${expectedNumChildren}`);
    }

    const syntaxList = children[1];
    if (syntaxList.kind !== ts.SyntaxKind.SyntaxList) {
        throw new Error(`${tagToStr(parent)} to contain SyntaxList, found ${ts.SyntaxKind[syntaxList.kind]}`);
    }

    const expectedTypes = [
        ts.SyntaxKind.JsxText, ts.SyntaxKind.JsxExpression, ts.SyntaxKind.JsxElement,
        ts.SyntaxKind.JsxSelfClosingElement, ts.SyntaxKind.JsxFragment
    ];
    const mismatches = syntaxList.getChildren()
        .filter(child => !expectedTypes.includes(child.kind))
        .map(child => ts.SyntaxKind[child.kind]);

    if (mismatches.length > 0) {
        throw new Error('Unexpected type(s) in syntax list: ' + mismatches.join(', '));
    }

    // Safe cast, we checked it
    return syntaxList.getChildren() as ts.JsxChild[];
}

// Create the expression given after the colon (:) in the conditional expression
function createWhenFalseExpression(prevBranch: ts.JsxElement, ctx: ts.TransformationContext, node: ts.Node): ts.Expression {
    if (jsxParents.includes(prevBranch.parent.kind)) {
        const nextBranch = getNextBranch(prevBranch.parent as JsxParent, prevBranch);
        if (nextBranch) {
            if (isElseIfNode(nextBranch)) {
                return createTernary(ctx, nextBranch);
            }
            else if (isElseNode(nextBranch)) {
                const elseChildren = getJsxChildren(nextBranch)
                return createTernaryOperand(ctx, node, elseChildren);
            }
        }
    }
    return ctx.factory.createNull();
}

function getNextBranch(prevBranch: JsxParent, ifElem: ts.JsxElement) {
    const siblingNodes = getJsxChildren(prevBranch);
    let siblingIdx = siblingNodes.findIndex(child => child === ifElem);
    if (siblingIdx < 0) {
        throw new Error('Inexplicable error - <If>s parent does not contain it');
    }

    siblingIdx++; // Skip the <If /> itself
    while (siblingIdx < siblingNodes.length) {
        const sibling = siblingNodes[siblingIdx];
        if (isEmptyTextNode(sibling) || isPossibleCommentNode(sibling)) {
            siblingIdx++;
        }
        else if (isElseNode(sibling) || isElseIfNode(sibling)) {
            return sibling;
        }
        else {
            break;
        }
    }
    return undefined;
}

function tagToStr(parent: JsxParent) {
    return ts.isJsxElement(parent) ? `<${parent.openingElement.tagName} />` : 'fragment';
}
