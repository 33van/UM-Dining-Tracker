import "dotenv/config";

import cors from "cors";
import express from "express";

import diningRouter from "./routes/dining.js";
import recommendationsRouter from "./routes/recommendations.js";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use(
  "/api/dining",
  diningRouter
);

app.use(
  "/api/recommendations",
  recommendationsRouter
);

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});