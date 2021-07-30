import * as React from 'react';
import { useState } from 'react';
import { If, Else } from '../../src';

const defaultUser = {
    profile: {
        name: 'Tom Smith'
    }
} as const;
type User = typeof defaultUser;

export const ConditionalComponent = () => {
    const [user, setUser] = useState<User | null>(null);

    return (
        <>
            <h1>JSX IF sample</h1>
            <If condition={Boolean(user)}>
                <button onClick={() => setUser(null)}>Logout</button>
                <div>Logged in as {user.profile.name}</div>
            </If>
            <Else>
                <button onClick={() => setUser(defaultUser)}>Login</button>
                <div>Not logged in</div>
            </Else>
        </>
    );  
}
