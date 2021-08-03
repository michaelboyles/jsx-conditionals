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
                        checkForOrphanedElse(node as JsxParent);
                    }
                    if (isIfNode(node)) {
                        return ts.visitEachChild(
                            ctx.factory.createJsxExpression(
                                undefined,
                                ctx.factory.createConditionalExpression(
                                    getConditionExpression(node),
                                    ctx.factory.createToken(ts.SyntaxKind.QuestionToken),
                                    createTrueFalseOperand(ctx, node, getJsxChildren(node)),
                                    ctx.factory.createToken(ts.SyntaxKind.ColonToken),
                                    createWhenFalseExpression(node, ctx, node)
                                )
                            ),
                            visitor, ctx
                        );
                    }
                    if (isElseNode(node)) {
                        // We already processed the <Else> clause so here we can just erase them
                        if (!jsxParents.includes(node.parent.kind)) {
                            throw new Error("<Else> is used a top-level node and has no associated <If> condition");
                        }
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

function checkForOrphanedElse(jsxParent: JsxParent) {
    jsxParent.children.forEach((child, idx) => {
        if (isElseNode(child)) {
            // Found an else, now walk backwards until we find an If
            let currIdx = idx - 1;
            while (currIdx >= 0) {
                const sibling = jsxParent.children[currIdx];
                if (isEmptyTextNode(sibling)) {
                    currIdx--;
                    continue;
                }
                if (isIfNode(sibling)) {
                    return;
                }
            }
            throw new Error("<Else> has no matching <If>. Only whitespace is allowed between them.");
        }
    });
}

function isIfNode(node: ts.Node): node is ts.JsxElement {
    return ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'If';
} 

function isElseNode(node: ts.Node): node is ts.JsxElement {
    return ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'Else';
}

function isEmptyTextNode(node: ts.Node) {
    return ts.isJsxText(node) && node.text.trim().length === 0;
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

function createTrueFalseOperand(ctx: ts.TransformationContext, originalNode: ts.Node, children: ts.JsxChild[]) {
    if (children.length === 1) {
        // This is just an optimisation to prevent creating a JSX fragment if it's not necessary
        const child = children[0];
        if (ts.isJsxText(child)) {
            return ctx.factory.createStringLiteral(child.text);
        }
        else {
            return child;
        }
    }
    else if (children.length >= 2) {
        return ctx.factory.createJsxFragment(
            createJsxOpeningFragment(ctx, originalNode),
            children,
            ctx.factory.createJsxJsxClosingFragment()
        );
    }
    return ctx.factory.createNull();
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
function createWhenFalseExpression(ifJsxElem: ts.JsxElement, ctx: ts.TransformationContext, node: ts.Node): ts.Expression {
    if (jsxParents.includes(ifJsxElem.parent.kind)) {
        const elseChildren = getElseBody(ifJsxElem.parent as JsxParent, ifJsxElem);
        return createTrueFalseOperand(ctx, node, elseChildren);
    }
    return ctx.factory.createNull();
}

function getElseBody(ifParentElem: JsxParent, ifElem: ts.JsxElement) {
    const ifSiblingNodes = getJsxChildren(ifParentElem);
    let siblingIdx = ifSiblingNodes.findIndex(child => child === ifElem);
    if (siblingIdx < 0) {
        throw new Error('Inexplicable error - <If>s parent does not contain it');
    }

    siblingIdx++; // Skip the <If /> itself
    while (siblingIdx < ifSiblingNodes.length) {
        const sibling = ifSiblingNodes[siblingIdx];
        if (isEmptyTextNode(sibling)) {
            siblingIdx++;
        }
        else if (isElseNode(sibling)) {
            return getJsxChildren(sibling);
        }
        else {
            break;
        }
    }
    return [];
}

function tagToStr(parent: JsxParent) {
    return ts.isJsxElement(parent) ? `<${parent.openingElement.tagName} />` : 'fragment';
}
