import { types, PluginObj, NodePath } from '@babel/core';
import { JSXElement, Node, JSXFragment, Expression } from '@babel/types';

type JSXParent = JSXElement | JSXFragment;
function isJsxParent(node: Node): node is JSXParent {
    return node.type === 'JSXElement' || node.type === 'JSXFragment';
}
function isJsxElementPath(path: NodePath): path is NodePath<JSXElement> {
    return path.node.type === 'JSXElement';
}

type Bable = {
    types: typeof types
}

export default function({ types: t }: Bable): PluginObj {
    function createTernary(path: NodePath<JSXElement>) {
        return t.conditionalExpression(
            getConditionExpression(path.node),
            createTernaryOperand(path.node.children),
            createWhenFalseExpression(path)
        )
    }

    function checkForOrphanedNodes(path: NodePath<JSXParent>) {
        const errMsg = " has no matching <If> or <ElseIf>. Only whitespace is allowed between them.";

        if (!isJsxParent(path.parent) && (isElseNode(path.node) || isElseIfNode(path.node))) {
            // This is a top-level Else or ElseIf
            throw new Error(nodeToString(path.node) + errMsg);
        }

        const children = path.node.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (isElseNode(child) || isElseIfNode(child)) {
                let j = i - 1;
                for (; j >= 0; j--) {
                    const preceding = children[j];
                    if (isIfNode(preceding) || isElseIfNode(preceding)) {
                        break; // Found it
                    }
                    else if (isEmptyTextNode(preceding) || isPossibleCommentNode(preceding)) {
                        continue; // Ignorable, keep looking
                    }
                    throw new Error(nodeToString(child) + errMsg);
                }
                if (j < 0) {
                    throw new Error(nodeToString(child) + errMsg);
                }
            }
        }
    }

    function isIfNode(elem: Node): boolean {
        if (elem.type !== 'JSXElement') return false;
        const name = elem.openingElement.name;
        return name.type === 'JSXIdentifier' && name.name === 'If';
    }

    function isElseIfNode(node: Node): boolean {
        if (node.type !== 'JSXElement') return false;
        const name = node.openingElement.name;
        return name.type === 'JSXIdentifier' && name.name === 'ElseIf';
    }

    function isElseNode(node: Node): boolean{
        if (node.type !== 'JSXElement') return false;
        const name = node.openingElement.name;
        return name.type === 'JSXIdentifier' && name.name === 'Else';
    }

    function isEmptyTextNode(elem: Node): boolean {
        return elem.type === 'JSXText' && elem.value.trim().length === 0;
    }

    function nodeToString(elem: Node): string {
        if (isIfNode(elem)) return '<If>';
        if (isElseIfNode(elem)) return '<ElseIf>';
        if (isElseNode(elem)) return '<Else>';
        throw Error('Unknown node');
    }

    function isPossibleCommentNode(elem: Node): boolean {
        return elem.type === 'JSXExpressionContainer' && elem.expression.type === 'JSXEmptyExpression';
    }

    function getConditionExpression(node: JSXElement): Expression {
        const attrName = 'condition';

        const conditionAttr = node.openingElement.attributes.find(attr =>
            attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier' && attr.name.name === attrName
        )
        if (!conditionAttr) throw new Error(`Missing '${attrName}' property`);
        if (conditionAttr.type !== 'JSXAttribute') throw new Error("Impossible");

        if (conditionAttr.value.type !== 'JSXExpressionContainer') {
            // TODO I think this (incorrectly?) throws if you do things like condition="hello" or condition=<Foo />. But
            throw new Error(`'${attrName}' property should be type JSXExpressionContainer, found ${conditionAttr.value.type}`);
        }
        if (conditionAttr.value.expression.type === 'JSXEmptyExpression') {
            return t.booleanLiteral(true); // Not sure about it
        }
        return conditionAttr.value.expression;
    }

    function createTernaryOperand(children: JSXElement['children']): Expression {
        children = children.filter(child => !isEmptyTextNode(child));
        if (children.length < 1) {
            return t.nullLiteral();
        }
        if (children.length === 1) {
            const child = children[0];
            if (child.type === 'JSXText') {
                return t.stringLiteral(child.value); // TODO maybe trim
            }
            else if (child.type === 'JSXFragment' || child.type === 'JSXElement') {
                return child;
            }
        }
        return t.jsxFragment(
            t.jsxOpeningFragment(),
            t.jsxClosingFragment(),
            children
        );
    }

    function createWhenFalseExpression(path: NodePath<JSXElement>): Expression {
        const nextBranch = getNextBranch(path);
        if (nextBranch) {
            if (isElseIfNode(nextBranch.node)) {
                return createTernary(nextBranch);
            }
            else if (isElseNode(nextBranch.node)) {
                return createTernaryOperand(nextBranch.node.children);
            }
        }
        return t.nullLiteral();
    }

    function getNextBranch(ifPath: NodePath<JSXElement>): NodePath<JSXElement> | undefined {
        const siblings = ifPath.getAllNextSiblings().filter(sib => isJsxElementPath(sib));
        for (let sibling of siblings) {
            if (isEmptyTextNode(sibling.node) || isPossibleCommentNode(sibling.node)) {
                continue;
            }
            if (isElseNode(sibling.node) || isElseIfNode(sibling.node)) {
                return sibling;
            }
            else {
                break;
            }
        }
        return undefined;
    }

    return {
        visitor: {
            ImportDeclaration(path) {
                if (path.node.source.value === 'jsx-conditionals') {
                    path.remove(); // Remove the imports
                }
            },
            JSXElement(path) {
                checkForOrphanedNodes(path);
                if (isIfNode(path.node)) {
                    const ternary = createTernary(path);
                    if (isJsxParent(path.parent)) {
                        path.replaceWith(t.jsxExpressionContainer(ternary));
                    }
                    else {
                        path.replaceWith(ternary);
                    }
                }
                else if (isElseNode(path.node) || isElseIfNode(path.node)) {
                    // We already processed the <Else> and <ElseIf> clauses so here we can just erase them
                    path.remove();
                }
            },
            JSXFragment(path) {
                checkForOrphanedNodes(path)
            }
        }
    };
}

