import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { ConditionalComponent } from './ConditionalComponent';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<ConditionalComponent />);
