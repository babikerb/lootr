import { z } from 'zod';

const GAME_TYPES = ['dodge', 'catch', 'balance', 'swipe', 'timing', 'runner'];

export const GameConfigSchema = z.object({
  gameType: z.enum(GAME_TYPES),
  confidence: z.number().min(0).max(1).default(1),
  alternates: z.array(z.object({
    gameType: z.enum(GAME_TYPES),
    confidence: z.number().min(0).max(1),
  })).default([]),
  title: z.string().max(30),
  rules: z.array(z.string()).min(1).max(3),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FF6B35'),
  icon: z.object({
    library: z.enum(['mci', 'fa5', 'ion']),
    name: z.string()
  }),
  parameters: z.object({
    speed: z.number().min(0.1).max(3.0),
    gravity: z.number().min(0.1).max(3.0)
  })
});

// The safe fallback if the LLM fails or times out
export const FALLBACK_CONFIG = {
  gameType: "catch",
  confidence: 1,
  alternates: [],
  title: "Catch It!",
  rules: ["Catch the falling object.", "Don't let it hit the ground."],
  color: "#FF6B35",
  icon: { library: "mci", name: "cube-outline" },
  parameters: { speed: 1.0, gravity: 1.0 }
};