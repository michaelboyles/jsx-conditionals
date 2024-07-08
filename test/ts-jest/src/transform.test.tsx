import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { Else, ElseIf, If } from '../../../src';

const NOT_RENDERED = 'THIS TEXT SHOULD NOT BE RENDERED!';

it('Positive if', () => {
    const tree = renderer
        .create(<If condition={true}>Condition is true</If>)
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Truthy if', () => {
    const tree = renderer
        .create(<If condition={1}>Condition is true</If>)
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

it('Falsy if', () => {
    const tree = renderer
        .create(<If condition={0}>{NOT_RENDERED}</If>)
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

it('Else preceded by a comment', () => {
    const tree = renderer
        .create(
            <>
                <If condition={false}>{NOT_RENDERED}</If>
                { /* This comment explains the purpose of the else */ }
                <Else>
                    <div>Child 1</div>
                    <div>Child 2</div>
                </Else>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('ElseIf where only If passes', () => {
    const tree = renderer
        .create(
            <>
                <If condition={true}>
                    <div>Child 1</div>
                </If>
                <ElseIf condition={false}>{NOT_RENDERED}</ElseIf>
                <Else>{NOT_RENDERED}</Else>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('ElseIf where only ElseIf passes', () => {
    const tree = renderer
        .create(
            <>
                <If condition={false}>{NOT_RENDERED}</If>
                <ElseIf condition={true}>
                    <div>Child 1</div>
                    <div>Child 2</div>
                </ElseIf>
                <Else>{NOT_RENDERED}</Else>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Else where Else is used', () => {
    const tree = renderer
        .create(
            <>
                <If condition={false}>{NOT_RENDERED}</If>
                <ElseIf condition={false}>{NOT_RENDERED}</ElseIf>
                <Else>
                    <div>Child 1</div>
                    <div>Child 2</div>
                </Else>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Multiple ElseIfs', () => {
    const tree = renderer
        .create(
            <>
                <If condition={false}>{NOT_RENDERED}</If>
                <ElseIf condition={false}>{NOT_RENDERED}</ElseIf>
                <ElseIf condition={false}>{NOT_RENDERED}</ElseIf>
                <ElseIf condition={false}>{NOT_RENDERED}</ElseIf>
                <ElseIf condition={true}>
                    <div>Child 1</div>
                </ElseIf>
                <Else>{NOT_RENDERED} </Else>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('If and ElseIf both pass', () => {
    const tree = renderer
        .create(
            <>
                <If condition={true}>
                    <div>Child 1</div>
                </If>
                <ElseIf condition={true}>{NOT_RENDERED}</ElseIf>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Consecutive Ifs', () => {
    const tree = renderer
        .create(
            <>
                <If condition={true}>
                    <div>Child 1</div>
                </If>
                <If condition={true}>
                    <div>Child 2</div>
                </If>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Consecutive Ifs with Elses', () => {
    const tree = renderer
        .create(
            <>
                <If condition={false}>{NOT_RENDERED}</If>
                <Else>
                    <div>Child 1</div>
                </Else>
                <If condition={false}>{NOT_RENDERED}</If>
                <Else>
                    <div>Child 2</div>
                </Else>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('If with empty JSX expression', () => {
    const tree = renderer
        .create(<If condition={false}>{}</If>)
        .toJSON();
    expect(tree).toMatchSnapshot();
});

it('Else with empty JSX expression', () => {
    const tree = renderer
        .create(
            <>
                <If condition={false}>{}</If>
                <Else>{}</Else>
            </>
        )
        .toJSON();
    expect(tree).toMatchSnapshot();
});
