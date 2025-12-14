import express, { Request, Response } from 'express';
import { readRisks, readSignals, readCandleData, readSymbolList } from '../controllers/Script';

const router = express.Router();

// GET /risks/:source
router.get('/risks/:source', async (req: Request, res: Response) => {
  try {
    const data = await readRisks(req.params.source);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /signals
router.get('/signals', async (_req: Request, res: Response) => {
  try {
    const data = await readSignals(); // uses default signal source internally
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /candle_data/:source
router.get('/candle_data/:source', async (req: Request, res: Response) => {
  try {
    const data = await readCandleData(req.params.source);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /symbol_list
router.get('/symbol_list', async (_req: Request, res: Response) => {
  try {
    const data = await readSymbolList();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
