import express from 'express';
const app = express();

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'server is healthy',
    uptime: process.uptime(),
  });
});

export default app;
