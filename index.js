import cors from 'cors';
import express from 'express';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Server Root Route
app.get('/', (req, res) => {
  res.send('<h1>Hello World </h1>');
});

// Routes
app.use('/api/v1', userRoutes);

async function run() {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

run().catch(console.dir);
