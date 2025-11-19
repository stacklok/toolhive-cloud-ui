import { TextDecoder, TextEncoder } from "node:util";

// Polyfill TextEncoder/TextDecoder for jsdom environment
// These are needed for jose encryption/decryption in tests
global.TextEncoder = TextEncoder;
// @ts-expect-error - TextDecoder types are compatible
global.TextDecoder = TextDecoder;
