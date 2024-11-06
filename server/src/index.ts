import fs from "fs";
import http from "http";
import https from "https";
import dotenv from "dotenv";
import express, { Express } from "express";
import * as SocketIO from "socket.io";

import { SocketController } from "./controllers/socket-controller.js";
import { Logger } from "./library/logging.js";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./protocol/events.js";
import { handleBinary } from "./utils/startup.js";

dotenv.config();
handleBinary();

const isHttps = process.env.HTTPS === "true";
const port = process.env.PORT || 3000;

const app: Express = express();
let server;
if (isHttps) {
  server = https.createServer(
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
    app,
  );
} else {
  server = http.createServer(app);
}

server.listen(port as number, () => {
  Logger.info(
    `mediasoup-server running at ${isHttps ? "https" : "http"}://localhost:${port}`,
  );
});

const io = new SocketIO.Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "*",
  },
});

new SocketController(io);
