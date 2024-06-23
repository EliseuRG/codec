type WaveType = 'sine' | 'triangle' | 'square';

const generateWave = (type: WaveType, frequency: number, amplitude: number): { type: WaveType, frequency: number, amplitude: number } => {
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

export default {
    generateWave,
};
