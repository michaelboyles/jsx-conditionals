import * as ts from 'typescript';

export default function(program: ts.Program, pluginOptions: {}) {
    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            function visitor(node: ts.Node): ts.Node {
                if (node.kind === ts.SyntaxKind.JsxElement) {
                    const jsxElem = node as ts.JsxElement;
                    if (jsxElem.openingElement.tagName.getText() === 'If') {
                        return ctx.factory.createJsxExpression(
                            undefined,
                            ctx.factory.createConditionalExpression(
                                getConditionExpression(jsxElem),
                                ctx.factory.createToken(ts.SyntaxKind.QuestionToken),
                                createWhenTrueExpression(ctx, node, jsxElem),
                                ctx.factory.createToken(ts.SyntaxKind.ColonToken),
                                createWhenFalseExpression(jsxElem, ctx, node)
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

function getJsxChildren(jsxElem: ts.JsxElement) {
    const tagName = jsxElem.openingElement.tagName.getText();

    const children = jsxElem.getChildren();
    const expectedNumChildren = 3;
    if (children.length !== expectedNumChildren) {
        throw new Error(`<${tagName} /> has ${children.length} children, expected ${expectedNumChildren}`);
    }

    const syntaxList = children[1];
    if (syntaxList.kind !== ts.SyntaxKind.SyntaxList) {
        throw new Error(`Expected <${tagName} /> to contain syntax list`);
    }

    const expectedTypes = [
        ts.SyntaxKind.JsxText, ts.SyntaxKind.JsxExpression, ts.SyntaxKind.JsxElement,
        ts.SyntaxKind.JsxSelfClosingElement, ts.SyntaxKind.JsxFragment
    ];
    const mismatches = syntaxList.getChildren()
        .filter(child => !expectedTypes.includes(child.kind))
        .map(child => ts.SyntaxKind[child.kind]);

    if (mismatches.length > 0) {
        throw new Error("Unexpected type(s) in syntax list: " + mismatches.join(', '));
    }

    // Safe cast, we checked it
    return syntaxList.getChildren() as ts.JsxChild[];
}

// Create the expression given after the colon (:) in the ternary
function createWhenFalseExpression(ifJsxElem: ts.JsxElement, ctx: ts.TransformationContext, node: ts.Node): ts.Expression {
    const elseChildren = getElseBody(ifJsxElem);
    // TODO it may be that if there is precisely child, that we can avoid creating the fragment
    if (elseChildren.length > 0) {
        return ctx.factory.createJsxFragment(
            createJsxOpeningFragment(ctx, node),
            elseChildren,
            ctx.factory.createJsxJsxClosingFragment()
        );
    }
    return ctx.factory.createNull();
}

function getElseBody(jsxElem: ts.JsxElement) {
    const ifChildren = getJsxChildren(jsxElem);
    const elseClauses = filterNodes<ts.JsxElement>(ts.SyntaxKind.JsxElement, ifChildren)
        .filter(jsxNode => jsxNode.openingElement.tagName.getText() === 'Else');
    
    if (elseClauses.length > 0) {
        const elseChildren: ts.JsxChild[] = [];
        // In case they have used multiple <Else /> clauses inside one <If />
        elseClauses.forEach(elseClause => 
            getJsxChildren(elseClause).forEach(child => elseChildren.push(child))
        );
        return elseChildren;
    }
    return [];
}

// Get nodes only of a certain type from a list of nodes
function filterNodes<T extends ts.Node>(kind: ts.SyntaxKind, nodes: ts.Node[]) {
    return nodes.filter(node => node.kind === kind) as T[];
}
