import React = require('react');

export interface IProps {
    condition: boolean;
    children: React.ReactNode
}

export const If = (props: IProps) => {
    console.error(
        "<If /> is a special component which is expected to be removed by transform at compile-time. If you're"
        + "seeing this message then the transform wasn't successful"
    );
    if (props.condition) {
        return <>{props.children}</>;
    }
    return null;
}
