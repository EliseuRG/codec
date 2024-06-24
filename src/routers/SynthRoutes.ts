import { Router } from 'express';
import { getWave } from '../controllers/SynthController';

const router = Router();

router.get('/wave', getWave);

export default router;
