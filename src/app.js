import express from "express";
import { webhookHandleFN } from "./index.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`Server running on PORT: ${process.env.PORT}`);
});

// app.post("/healthie/webhook", webhookHandleFN);
app.post(
  "/healthie/webhook",
  express.raw({ type: "*/*", limit: "256kb" }),
  webhookHandleFN
);

// endpoints or url fro application can be added here

export { app };
