import React = require('react');

export interface IProps {
    condition: boolean;
    children: React.ReactNode
}

export const If = (props: IProps) => {
    if (props.condition) {
        return <>{props.children}</>;
    }
    return null;
}
