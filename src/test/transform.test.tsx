import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { Else, If } from '..';

const NOT_RENDERED = 'THIS TEXT SHOULD NOT BE RENDERED!';

it('Positive if', () => {
    const tree = renderer
        .create(<If condition={true}>Condition is true</If>)
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Positive if inside fragment', () => {
    const tree = renderer
        .create(<><If condition={true}>Condition is true</If></>)
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Positive if inside div', () => {
    const tree = renderer
        .create(<div><If condition={true}>Condition is true</If></div>)
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Positive if with evaluated condition', () => {
    let val = 3;
    const tree = renderer
        .create(<If condition={val === 3}>Condition is true</If>)
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Negative if inside div', () => {
    const tree = renderer
        .create(<div><If condition={false}>{NOT_RENDERED}</If></div>)
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Negative if inside fragment renders nothing', () => {
    const tree = renderer
        .create(<><If condition={false}>{NOT_RENDERED}</If></>)
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Negative if with evaluated condition', () => {
    let val = 1;
    const tree = renderer
        .create(<div><If condition={val >= 10}>{NOT_RENDERED}</If></div>)
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Simple if-else', () => {
    const tree = renderer
        .create(
            <div>
                <If condition={false}>{NOT_RENDERED}</If>
                <Else>Condition is false</Else>
            </div>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Nested if', () => {
    const tree = renderer
        .create(
            <If condition={true}>
                <If condition={true}>Both conditions are true</If>
            </If>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Nested if-else', () => {
    const tree = renderer
        .create(
            <If condition={true}>
                <If condition={false}>{NOT_RENDERED}</If>
                <Else><div>1st condition is true but 2nd condition is false</div></Else>
            </If>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Allow whitespace between if-else', () => {
    const tree = renderer
        .create(
            <>
                <If condition={false}>{NOT_RENDERED}</If>


                <Else>Condition was false</Else>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Else with multiple children', () => {
    const tree = renderer
        .create(
            <>
                <If condition={false}>{NOT_RENDERED}</If>
                <Else>
                    <div>Child 1</div>
                    <div>Child 2</div>
                </Else>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});
