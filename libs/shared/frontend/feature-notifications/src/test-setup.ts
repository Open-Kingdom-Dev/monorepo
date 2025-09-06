import { TextEncoder, TextDecoder as NodeTextDecoder } from 'util';
import '@testing-library/jest-dom';

global.TextEncoder = TextEncoder;
global.TextDecoder = NodeTextDecoder as typeof TextDecoder;
