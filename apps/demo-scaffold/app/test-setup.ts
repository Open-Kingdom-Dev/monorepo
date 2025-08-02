import { TextEncoder, TextDecoder as NodeTextDecoder } from 'util';
import '@testing-library/jest-dom';

global.TextEncoder = TextEncoder;
global.TextDecoder = NodeTextDecoder as typeof TextDecoder; // necessary because there is a mismatch between ts type and node type
