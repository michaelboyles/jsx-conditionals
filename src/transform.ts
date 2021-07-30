import * as ts from 'typescript';

type JsxParent = ts.JsxElement | ts.JsxFragment;

export default function(_program: ts.Program, _pluginOptions: object) {
    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            function visitor(node: ts.Node): ts.Node {
                try {
                    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
                        const pkg = (node as ts.ImportDeclaration).moduleSpecifier as ts.StringLiteral;
                        if (pkg.text === 'jsx-conditionals') return null; // Remove the imports
                    }
                    if (node.kind === ts.SyntaxKind.JsxElement) {
                        const jsxElem = node as ts.JsxElement;
                        if (jsxElem.openingElement.tagName.getText() === 'If') {
                            return ts.visitEachChild(
                                ctx.factory.createJsxExpression(
                                    undefined,
                                    ctx.factory.createConditionalExpression(
                                        getConditionExpression(jsxElem),
                                        ctx.factory.createToken(ts.SyntaxKind.QuestionToken),
                                        createWhenTrueExpression(ctx, node, jsxElem),
                                        ctx.factory.createToken(ts.SyntaxKind.ColonToken),
                                        createWhenFalseExpression(jsxElem, ctx, node)
                                    )
                                ),
                                visitor, ctx
                            );
                        }
                        else if (jsxElem.openingElement.tagName.getText() === 'Else') {
                            // We already processed the <Else> clause so just remove them from the AST
                            return null;
                        }
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

function getConditionExpression(jsxElem: ts.JsxElement): ts.Expression {
    const attrName = 'condition';
    let conditionAttr: ts.JsxAttribute = null;

    // forEachChild seems necessary, rather than getChildren().find() not sure why...
    jsxElem.openingElement.attributes.forEachChild(attr => {
        if (attr.kind == ts.SyntaxKind.JsxAttribute) {
            const jsxAttr = attr as ts.JsxAttribute;
            if (jsxAttr.name.getText() === attrName) {
                conditionAttr = jsxAttr;
                return;
            }
        }
    });

    if (!conditionAttr) {
        throw new Error(`Missing '${attrName}' property`);
    }

    const initializer = conditionAttr.initializer;
    if (initializer.kind !== ts.SyntaxKind.JsxExpression) {
        throw new Error(`'${attrName}' property should be type JsxExpression, found ${ts.SyntaxKind[initializer.kind]}`);
    }
    return (initializer as ts.JsxExpression).expression;
}

function createWhenTrueExpression(ctx: ts.TransformationContext, originalNode: ts.Node, jsxElem: ts.JsxElement) {
    return ctx.factory.createJsxFragment(
        createJsxOpeningFragment(ctx, originalNode),
        getIfBody(jsxElem),
        ctx.factory.createJsxJsxClosingFragment()
    );
}

function createJsxOpeningFragment(ctx: ts.TransformationContext, originalNode: ts.Node) {
    const openingFrag = ctx.factory.createJsxOpeningFragment();
    ts.setOriginalNode(openingFrag, originalNode); // https://github.com/microsoft/TypeScript/issues/35686
    return openingFrag;
}

function getIfBody(jsxElem: ts.JsxElement) {
    const children = getJsxChildren(jsxElem);

    // Filter out the <Else>s
    return children.filter(child => child.kind !== ts.SyntaxKind.JsxElement
        || (child as ts.JsxElement).openingElement.tagName.getText() !== 'Else'
    );
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

// Create the expression given after the colon (:) in the ternary
function createWhenFalseExpression(ifJsxElem: ts.JsxElement, ctx: ts.TransformationContext, node: ts.Node): ts.Expression {
    if ([ts.SyntaxKind.JsxElement, ts.SyntaxKind.JsxFragment].includes(ifJsxElem.parent.kind)) {
        const elseChildren = getElseBody(ifJsxElem.parent as JsxParent, ifJsxElem);
        // TODO it may be that if there is precisely 1 child, that we can avoid creating the fragment
        if (elseChildren.length > 0) {
            return ctx.factory.createJsxFragment(
                createJsxOpeningFragment(ctx, node),
                elseChildren,
                ctx.factory.createJsxJsxClosingFragment()
            );
        }
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
        const siblingKind = ifSiblingNodes[siblingIdx].kind;
        if (siblingKind === ts.SyntaxKind.JsxText) {
            const siblingText = ifSiblingNodes[siblingIdx] as ts.JsxText;
            if (siblingText.text.trim().length === 0) {
                siblingIdx++;
            }
        }
        else if (siblingKind === ts.SyntaxKind.JsxElement) {
            const siblingJsx = ifSiblingNodes[siblingIdx] as ts.JsxElement;
            if (siblingJsx.openingElement.tagName.getText() === 'Else') {
                return getJsxChildren(siblingJsx);
            }
            break;
        }
        else {
            break;
        }
    }
    return [];
}

function tagToStr(parent: JsxParent) {
    if (parent.kind === ts.SyntaxKind.JsxElement) {
        const jsxElem = parent as ts.JsxElement;
        return `<${jsxElem.openingElement.tagName} />`
    }
    return 'fragment';
}
