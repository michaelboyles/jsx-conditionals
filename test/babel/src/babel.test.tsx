import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { If } from '../../../dist';

it('Positive if', () => {
    const tree = renderer
        .create(<><If condition={true}>Condition is true</If></>)
        .toJSON();
    expect(tree).toMatchSnapshot();
});
