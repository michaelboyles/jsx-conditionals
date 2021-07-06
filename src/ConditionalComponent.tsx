import React = require('react');
import { Else } from './Else';
import { If } from './If';

// TS compiler complains if expression is always true or false. This is enough to "fool" it.
var alwaysOne = 1;

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
      <If condition={alwaysOne === 2}>
        Conditional is true
        <ExpensiveComponent someValue={getValue()} />
        <Else>
          Condition is false
        </Else>
        <Else>
          Condition is false (2nd)
        </Else>
      </If>
    </div>
  );  
}
