import express from 'express';

const router = express.Router();

// POST /api/v1/feedback/submit
router.post('/submit', (req, res) => {
  res.status(200).json({ message: "Feedback submitted successfully" });
});

export default router;