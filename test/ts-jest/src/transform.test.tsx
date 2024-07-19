import * as React from 'react';
import { render } from "@testing-library/react";
import { If, Else, ElseIf } from '../../../dist';

const NOT_RENDERED = 'THIS TEXT SHOULD NOT BE RENDERED!';

it('Positive if', () => {
    const { container } = render(<If condition={true}>Condition is true</If>)
    expect(container).toMatchSnapshot();
});

it('Truthy if', () => {
    const { container } = render(<If condition={1}>Condition is true</If>)
    expect(container).toMatchSnapshot();
});

it('Positive if inside fragment', () => {
    const { container } = render(<><If condition={true}>Condition is true</If></>)
    expect(container).toMatchSnapshot();
});

it('Positive if inside div', () => {
    const { container } = render(<div><If condition={true}>Condition is true</If></div>)
    expect(container).toMatchSnapshot();
});

it('Positive if with evaluated condition', () => {
    let val = 3;
    const { container } = render(<If condition={val === 3}>Condition is true</If>)
    expect(container).toMatchSnapshot();
});

it('Negative if inside div', () => {
    const { container } = render(<div><If condition={false}>{NOT_RENDERED}</If></div>)
    expect(container).toMatchSnapshot();
});

it('Falsy if', () => {
    const { container } = render(<If condition={0}>{NOT_RENDERED}</If>)
    expect(container).toMatchSnapshot();
});

it('Negative if inside fragment renders nothing', () => {
    const { container } = render(<><If condition={false}>{NOT_RENDERED}</If></>)
    expect(container).toMatchSnapshot();
});

it('Negative if with evaluated condition', () => {
    let val = 1;
    const { container } = render(<div><If condition={val >= 10}>{NOT_RENDERED}</If></div>)
    expect(container).toMatchSnapshot();
});

it('Simple if-else', () => {
    const { container } = render(
        <div>
            <If condition={false}>{NOT_RENDERED}</If>
            <Else>Condition is false</Else>
        </div>
    )
    expect(container).toMatchSnapshot();
});

it('Nested if', () => {
    const { container } = render(
        <If condition={true}>
            <If condition={true}>Both conditions are true</If>
        </If>
    )
    expect(container).toMatchSnapshot();
});

it('Nested if-else', () => {
    const { container } = render(
        <If condition={true}>
            <If condition={false}>{NOT_RENDERED}</If>
            <Else><div>1st condition is true but 2nd condition is false</div></Else>
        </If>
    )
    expect(container).toMatchSnapshot();
});

it('Allow whitespace between if-else', () => {
    const { container } = render(
        <>
            <If condition={false}>{NOT_RENDERED}</If>


            <Else>Condition was false</Else>
        </>
    )
    expect(container).toMatchSnapshot();
});

it('Else with multiple children', () => {
    const { container } = render(
        <>
            <If condition={false}>{NOT_RENDERED}</If>
            <Else>
                <div>Child 1</div>
                <div>Child 2</div>
            </Else>
        </>
    )
    expect(container).toMatchSnapshot();
});

it('Else preceded by a comment', () => {
    const { container } = render(
        <>
            <If condition={false}>{NOT_RENDERED}</If>
            { /* This comment explains the purpose of the else */ }
            <Else>
                <div>Child 1</div>
                <div>Child 2</div>
            </Else>
        </>
    )
    expect(container).toMatchSnapshot();
});

it('ElseIf where only If passes', () => {
    const { container } = render(
        <>
            <If condition={true}>
                <div>Child 1</div>
            </If>
            <ElseIf condition={false}>{NOT_RENDERED}</ElseIf>
            <Else>{NOT_RENDERED}</Else>
        </>
    )
    expect(container).toMatchSnapshot();
});

it('ElseIf where only ElseIf passes', () => {
    const { container } = render(
        <>
            <If condition={false}>{NOT_RENDERED}</If>
            <ElseIf condition={true}>
                <div>Child 1</div>
                <div>Child 2</div>
            </ElseIf>
            <Else>{NOT_RENDERED}</Else>
        </>
    )
    expect(container).toMatchSnapshot();
});

it('Else where Else is used', () => {
    const { container } = render(
        <>
            <If condition={false}>{NOT_RENDERED}</If>
            <ElseIf condition={false}>{NOT_RENDERED}</ElseIf>
            <Else>
                <div>Child 1</div>
                <div>Child 2</div>
            </Else>
        </>
    )
    expect(container).toMatchSnapshot();
});

it('Multiple ElseIfs', () => {
    const { container } = render(
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
    expect(container).toMatchSnapshot();
});

it('If and ElseIf both pass', () => {
    const { container } = render(
        <>
            <If condition={true}>
                <div>Child 1</div>
            </If>
            <ElseIf condition={true}>{NOT_RENDERED}</ElseIf>
        </>
    )
    expect(container).toMatchSnapshot();
});

it('Consecutive Ifs', () => {
    const { container } = render(
        <>
            <If condition={true}>
                <div>Child 1</div>
            </If>
            <If condition={true}>
                <div>Child 2</div>
            </If>
        </>
    )
    expect(container).toMatchSnapshot();
});

it('Consecutive Ifs with Elses', () => {
    const { container } = render(
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
    expect(container).toMatchSnapshot();
});

it('If with empty JSX expression', () => {
    const { container } = render(
        // @ts-ignore
        <If condition={false}>{}</If>
    );
    expect(container).toMatchSnapshot();
});

it('Else with empty JSX expression', () => {
    const { container } = render(
        <>
            <If condition={false}>{ NOT_RENDERED }</If>
            {/* @ts-ignore */}
            <Else>{}</Else>
        </>
    )
    expect(container).toMatchSnapshot();
});

// It's dumb and I see no reason to do it, but it is a valid truthy value
it('If with string literal condition', () => {
    const { container } = render(<If condition="true">Condition is true</If>)
    expect(container).toMatchSnapshot();
});