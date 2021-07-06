import React = require('react');

export interface IProps {
    children: React.ReactNode
}

export const Else = (props: IProps) => {
    console.error(
        "<Else /> is a special component which is expected to be removed by transform at compile-time. If you're"
        + "seeing this message then the transform wasn't successful"
    )
    return <>{props.children}</>;
}
