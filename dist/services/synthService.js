"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generateWave = (type, frequency, amplitude) => {
    if (!type || isNaN(frequency) || isNaN(amplitude)) {
        throw new Error('Missing or invalid parameters');
    }
    switch (type) {
        case 'sine':
            return { type: 'sine', frequency, amplitude };
        case 'triangle':
            return { type: 'triangle', frequency, amplitude };
        case 'square':
            return { type: 'square', frequency, amplitude };
        default:
            throw new Error('Invalid wave type');
    }
};
exports.default = {
    generateWave,
};
