import { Request, Response } from 'express';
import synthService from '../services/SynthService';

type WaveType = 'sine' | 'triangle' | 'square';

const isValidWaveType = (type: string): type is WaveType => {
    return ['sine', 'triangle', 'square'].includes(type);
};

export const getWave = (req: Request, res: Response): void => {
    const { type, frequency, amplitude } = req.query;

    if (typeof type !== 'string' || !isValidWaveType(type) || typeof frequency !== 'string' || typeof amplitude !== 'string') {
        res.status(400).send('Invalid parameters');
        return;
    }

    try {
        const waveData = synthService.generateWave(type, parseFloat(frequency), parseFloat(amplitude));
        res.json(waveData);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).send(error.message);
        } else {
            res.status(400).send('An unexpected error occurred');
        }
    }
};
