// src/buffer-polyfill.js
import { Buffer } from "buffer";

// Add Buffer to the global window object
window.Buffer = Buffer;
