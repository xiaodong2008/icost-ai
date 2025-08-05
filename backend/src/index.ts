import express, { Express } from "express";

import cors from "cors";
import path from "path";
import { processImage } from "./endpoints/processImage";

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.post("/processImage", processImage);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 7524;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

export default app;

