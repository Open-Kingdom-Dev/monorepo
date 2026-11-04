import { TextEncoder, TextDecoder as NodeTextDecoder } from 'util';

// jsdom specs here load Express (via the twins); its content-disposition >=1.1 needs TextDecoder at import time, which jsdom lacks.
global.TextEncoder = TextEncoder;
global.TextDecoder = NodeTextDecoder as typeof TextDecoder;
