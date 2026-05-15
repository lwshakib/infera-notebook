import * as env from '@/lib/env';
import { GoogleGenAI } from '@google/genai';

export const GOOGLE_API_KEY = env.GOOGLE_API_KEY || '';
export const DEEPGRAM_API_KEY = env.DEEPGRAM_API_KEY || '';

export const aiConfig = {
  apiKey: GOOGLE_API_KEY,
  deepgramKey: DEEPGRAM_API_KEY,
};

export const googleConfig = {
  apiKey: GOOGLE_API_KEY,
};
