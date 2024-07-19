import { ReactNode } from 'react';

const warning = " is a special component which is expected to be removed by transform at compile-time. If you're"
     + " seeing this message then the transform wasn't successful";

export interface IfProps {
    condition: any
    children: ReactNode
}

export const If = (props: IfProps) => {
    console.error('<If />' + warning);
    if (props.condition) {
        return <>{props.children}</>;
    }
    return null;
}

export const ElseIf = (props: IfProps) => {
    console.error('<ElseIf />' + warning);
    if (props.condition) {
        return <>{props.children}</>;
    }
    return null;
}

export interface ElseProps {
    children: ReactNode
}

export const Else = (props: ElseProps) => {
    console.error('<Else />' + warning); 
    return <>{props.children}</>;
}
