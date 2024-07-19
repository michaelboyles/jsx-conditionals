import {
    Expression,
    isImportDeclaration,
    isJsxAttribute,
    isJsxElement,
    isJsxExpression,
    isJsxText,
    JsxAttribute,
    JsxChild,
    JsxElement,
    JsxFragment,
    Node,
    Program,
    setOriginalNode,
    SourceFile,
    StringLiteral,
    SyntaxKind,
    TransformationContext,
    visitEachChild
} from 'typescript';

type JsxParent = JsxElement | JsxFragment;
function isJsxParent(node: Node): node is JsxParent {
    return node.kind === SyntaxKind.JsxElement
        || node.kind === SyntaxKind.JsxFragment
}

export default function(_program: Program, _pluginOptions: object) {
    return (ctx: TransformationContext) => {
        return (sourceFile: SourceFile) => {
            function visitor(node: Node): Node | undefined {
                try {
                    if (isImportDeclaration(node)) {
                        const pkg = node.moduleSpecifier as StringLiteral;
                        if (pkg.text === 'jsx-conditionals') return undefined; // Remove the imports
                    }
                    if (isJsxParent(node)) {
                        checkForOrphanedNodes(node);
                    }
                    if (isIfNode(node)) {
                        return visitEachChild(createTernary(ctx, node), visitor, ctx);
                    }
                    if (isElseNode(node) || isElseIfNode(node)) {
                        // Top-level case only
                        if (!isJsxParent(node.parent)) {
                            throw new Error(nodeToString(node) + " is used a top-level node and has no associated <If> condition");
                        }
                        // We already processed the <Else> and <ElseIf> clauses so here we can just erase them
                        return undefined;
                    }
                }
                catch (err: any) {
                    if (err.message) {
                        err.message = `${err.message}\r\nIn file ${sourceFile.fileName}\r\nAt node ${node.getText()}`;
                    }
                    throw err;
                }
                return visitEachChild(node, visitor, ctx);
            }
            return visitEachChild(sourceFile, visitor, ctx);
        };
    };
}

function createTernary(ctx: TransformationContext, prevBranch: JsxElement) {
    return ctx.factory.createJsxExpression(
        undefined,
        ctx.factory.createConditionalExpression(
            getConditionExpression(ctx, prevBranch),
            ctx.factory.createToken(SyntaxKind.QuestionToken),
            createTernaryOperand(ctx, prevBranch, getJsxChildren(prevBranch)),
            ctx.factory.createToken(SyntaxKind.ColonToken),
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

function isIfNode(node: Node): node is JsxElement {
    return isJsxElement(node) && node.openingElement.tagName.getText() === 'If';
} 

function isElseIfNode(node: Node): node is JsxElement {
    return isJsxElement(node) && node.openingElement.tagName.getText() === 'ElseIf';
}

function isElseNode(node: Node): node is JsxElement {
    return isJsxElement(node) && node.openingElement.tagName.getText() === 'Else';
}

function isEmptyTextNode(node: Node): boolean {
    return isJsxText(node) && node.text.trim().length === 0;
}

function nodeToString(node: Node): string {
    if (isIfNode(node)) return '<If>';
    if (isElseIfNode(node)) return '<ElseIf>';
    if (isElseNode(node)) return '<Else>';
    throw Error('Unknown node');
}

// Comments aren't included in the AST, but if the node is an empty JSX expression
// then it's fine to assume it's probably a comment.
function isPossibleCommentNode(node: Node): boolean {
    return isJsxExpression(node)
        && node.getChildCount() == 2; // '{' and '}'
}

function getConditionExpression(ctx: TransformationContext, jsxElem: JsxElement): Expression {
    const attrName = 'condition';
    let conditionAttr: (JsxAttribute | null) = null;

    jsxElem.openingElement.attributes.forEachChild(attr => {
        if (isJsxAttribute(attr) && attr.name.getText() === attrName) {
            conditionAttr = attr;
            return;
        }
    });

    if (!conditionAttr) {
        throw new Error(`Missing '${attrName}' property`);
    }

    const initializer = (conditionAttr as (JsxAttribute)).initializer;
    if (!initializer) {
        return ctx.factory.createToken(SyntaxKind.TrueKeyword);
    }
    if (isJsxExpression(initializer)) {
        if (!initializer.expression) {
            return ctx.factory.createToken(SyntaxKind.TrueKeyword);
        }
        return initializer.expression;
    }
    return initializer;
}

function createTernaryOperand(ctx: TransformationContext, originalNode: Node, children: JsxChild[]) {
    children = children.filter(child => !isJsxText(child) || !child.containsOnlyTriviaWhiteSpaces);
    if (children.length < 1) {
        return ctx.factory.createNull();
    }
    if (children.length === 1) {
        // This is just an optimisation to prevent creating a JSX fragment if it's not necessary
        const child = children[0];
        if (isJsxText(child)) {
            return ctx.factory.createStringLiteral(child.text); // TODO maybe trim
        }
        else if (!isJsxExpression(child)) {
            return child;
        }
    }
    return ctx.factory.createJsxFragment(
        createJsxOpeningFragment(ctx, originalNode),
        children,
        ctx.factory.createJsxJsxClosingFragment()
    );
}

function createJsxOpeningFragment(ctx: TransformationContext, originalNode: Node) {
    const openingFrag = ctx.factory.createJsxOpeningFragment();
    setOriginalNode(openingFrag, originalNode); // https://github.com/microsoft/TypeScript/issues/35686
    return openingFrag;
}

function getJsxChildren(parent: JsxParent) {
    const children = parent.getChildren();
    const expectedNumChildren = 3;
    if (children.length !== expectedNumChildren) {
        throw new Error(`${tagToStr(parent)} has ${children.length} children, expected ${expectedNumChildren}`);
    }

    const syntaxList = children[1];
    if (syntaxList.kind !== SyntaxKind.SyntaxList) {
        throw new Error(`${tagToStr(parent)} to contain SyntaxList, found ${SyntaxKind[syntaxList.kind]}`);
    }

    const expectedTypes = [
        SyntaxKind.JsxText, SyntaxKind.JsxExpression, SyntaxKind.JsxElement,
        SyntaxKind.JsxSelfClosingElement, SyntaxKind.JsxFragment
    ];
    const mismatches = syntaxList.getChildren()
        .filter(child => !expectedTypes.includes(child.kind))
        .map(child => SyntaxKind[child.kind]);

    if (mismatches.length > 0) {
        throw new Error('Unexpected type(s) in syntax list: ' + mismatches.join(', '));
    }

    // Safe cast, we checked it
    return syntaxList.getChildren() as JsxChild[];
}

// Create the expression given after the colon (:) in the conditional expression
function createWhenFalseExpression(prevBranch: JsxElement, ctx: TransformationContext, node: Node): Expression {
    if (isJsxParent(prevBranch.parent)) {
        const nextBranch = getNextBranch(prevBranch.parent, prevBranch);
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

function getNextBranch(prevBranch: JsxParent, ifElem: JsxElement) {
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
    return isJsxElement(parent) ? `<${parent.openingElement.tagName} />` : 'fragment';
}
