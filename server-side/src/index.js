import express from "express";
import dotenv from "dotenv";
dotenv.config({path:'../../../.env'});

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello, Express with ES Modules!");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
