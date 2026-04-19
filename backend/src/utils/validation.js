import { z } from 'zod';

// Define the exact shape you expect back from the LLM
export const GameConfigSchema = z.object({
  gameType: z.enum(['dodge', 'catch', 'balance', 'swipe', 'timing', 'runner']),
  title: z.string().max(30),
  parameters: z.object({
    speed: z.number().min(0.1).max(3.0),
    gravity: z.number().min(0.1).max(3.0)
  })
});

// The safe fallback if the LLM fails or times out
export const FALLBACK_CONFIG = {
  gameType: "catch",
  title: "Catch It!",
  parameters: { speed: 1.0, gravity: 1.0 }
};