// Force test environment before any React/react-dom module loads.
// When NODE_ENV=production is inherited from the shell/CI, react loads its
// production bundle which does not export `act`; @testing-library/react then
// fails with "React.act is not a function" on every render/cleanup.
import { TextEncoder, TextDecoder as NodeTextDecoder } from 'util';
import '@testing-library/jest-dom';

process.env.NODE_ENV = 'test';

global.TextEncoder = TextEncoder;
global.TextDecoder = NodeTextDecoder as typeof TextDecoder; // necessary because there is a mismatch between ts type and node type
