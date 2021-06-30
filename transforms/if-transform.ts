import * as ts from 'typescript';

export default function(program: ts.Program, pluginOptions: {}) {
    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            function visitor(node: ts.Node): ts.Node {
                if (node.kind === ts.SyntaxKind.JsxElement) {
                    const jsxElem = node as ts.JsxElement;
                    if (jsxElem.openingElement.tagName.getText() === 'If') {
                        const conditionExpr: ts.Expression = getConditionExpression(jsxElem);

                        const openingFrag = ctx.factory.createJsxOpeningFragment();
                        ts.setOriginalNode(openingFrag, node); // https://github.com/microsoft/TypeScript/issues/35686

                        return ctx.factory.createJsxExpression(
                            undefined,
                            ctx.factory.createConditionalExpression(
                                conditionExpr,
                                ctx.factory.createToken(ts.SyntaxKind.QuestionToken),
                                ctx.factory.createJsxFragment(
                                    openingFrag,
                                    getIfBody(jsxElem),
                                    ctx.factory.createJsxJsxClosingFragment()
                                ),
                                ctx.factory.createToken(ts.SyntaxKind.ColonToken),
                                ctx.factory.createNull()
                            )
                        );
                    }
                }
                return ts.visitEachChild(node, visitor, ctx);
            }
            return ts.visitEachChild(sourceFile, visitor, ctx);
        };
    };
}

function getConditionExpression(jsxElem: ts.JsxElement): ts.Expression {
    let conditionAttr: ts.JsxAttribute = null;

    // forEachChild seems necessary, rather than getChildren().find() not sure why...
    jsxElem.openingElement.attributes.forEachChild(attr => {
        if (attr.kind == ts.SyntaxKind.JsxAttribute) {
            const jsxAttr = attr as ts.JsxAttribute;
            if (jsxAttr.name.getText() === 'condition') {
                conditionAttr = jsxAttr;
            }
        }
    });

    if (!conditionAttr) {
        throw new Error("<If /> doesn't have condition attr");
    }

    const initializer = conditionAttr.initializer;
    if (initializer.kind === ts.SyntaxKind.StringLiteral) {
        throw new Error('TODO');
    }
    else if (initializer.kind === ts.SyntaxKind.JsxExpression) {
        const initializerExpr = initializer as ts.JsxExpression;
        return initializerExpr.expression;
    }
    else {
        throw new Error('Unexpected value of JSX condition attribute for node ' + jsxElem.getText());
    }
}

function getIfBody(jsxElem: ts.JsxElement) {
    const children = jsxElem.getChildren();
    if (children.length !== 3) {
        throw new Error("<If /> didn't have 3 children");
    }

    const syntaxList = children[1];
    if (syntaxList.kind !== ts.SyntaxKind.SyntaxList) {
        throw new Error("Expected <If /> to contain syntax list");
    }

    const expectedTypes = [
        ts.SyntaxKind.JsxText, ts.SyntaxKind.JsxExpression, ts.SyntaxKind.JsxElement,
        ts.SyntaxKind.JsxSelfClosingElement, ts.SyntaxKind.JsxFragment
    ];
    const firstMismatch = syntaxList.getChildren().find(ch => !expectedTypes.includes(ch.kind));
    if (firstMismatch) {
        throw new Error("Unexpected type in syntax list " + ts.SyntaxKind[firstMismatch.kind]);
    }
    // Safe, we checked it
    return syntaxList.getChildren() as ts.JsxChild[];
}
