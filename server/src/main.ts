import express, { Express } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (_, res) => {
  res.send("Hello World");
});

app.listen(port);

console.log("mediasoup-server listening on port", port);
