import React = require('react');
import { Else } from './Else';
import { If } from './If';

// TS compiler complains if expression is always true or false. This is enough to "fool" it.
var one = 1;
var two = 2;

const ExpensiveComponent = (props: {someValue: number}) => {
    return <div>{props.someValue}</div>;
};

const getValue = () => {
    const value = 5 * 5;
    alert('Getter was evaluated, returning ' + value);
    return value;
}

export const ConditionalComponent = () => {
    return (
        <div>
            Unconditional part
            <If condition={two === 1}>
                <ExpensiveComponent someValue={getValue()} />
            </If>
            <Else>
                <If condition={one === 2}>BBB</If>
                <Else>CCC</Else>
            </Else>
        </div>
    );  
}
