import * as React from 'react';

export interface IfProps {
    condition: boolean;
    children: React.ReactNode
}

export const If = (props: IfProps) => {
    console.error(
        "<If /> is a special component which is expected to be removed by transform at compile-time. If you're"
        + "seeing this message then the transform wasn't successful"
    );
    if (props.condition) {
        return <>{props.children}</>;
    }
    return null;
}

export interface ElseProps {
    children: React.ReactNode
}

export const Else = (props: ElseProps) => {
    console.error(
        "<Else /> is a special component which is expected to be removed by transform at compile-time. If you're"
        + "seeing this message then the transform wasn't successful"
    )
    return <>{props.children}</>;
}
