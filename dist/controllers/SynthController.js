"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWave = void 0;
const SynthService_1 = __importDefault(require("../services/SynthService"));
const isValidWaveType = (type) => {
    return ['sine', 'triangle', 'square'].includes(type);
};
const getWave = (req, res) => {
    const { type, frequency, amplitude } = req.query;
    if (typeof type !== 'string' || !isValidWaveType(type) || typeof frequency !== 'string' || typeof amplitude !== 'string') {
        res.status(400).send('Invalid parameters');
        return;
    }
    try {
        const waveData = SynthService_1.default.generateWave(type, parseFloat(frequency), parseFloat(amplitude));
        res.json(waveData);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).send(error.message);
        }
        else {
            res.status(400).send('An unexpected error occurred');
        }
    }
};
exports.getWave = getWave;
