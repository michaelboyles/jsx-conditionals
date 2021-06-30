import React = require('react');
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
        <div>Conditional part</div>
        <ExpensiveComponent someValue={getValue()} />
      </If>
    </div>
  );  
}
