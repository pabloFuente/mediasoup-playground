import express, { Express } from "express";
import dotenv from "dotenv";
import { Logger } from "./library/logging.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (_, res) => {
  res.send("Hello World");
});

app.listen(port);

Logger.info("mediasoup-server listening on port " + port);
