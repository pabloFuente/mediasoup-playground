import fs from "fs";
import http from "http";
import https from "https";
import express, { Express } from "express";
import * as SocketIO from "socket.io";

import { CONFIG } from "./config/config.js";
import { SocketController } from "./controllers/socket-controller.js";
import { Logger } from "./library/logging.js";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./protocol/events.js";
import { handleBinary } from "./utils/startup.js";

handleBinary();

const app: Express = express();
let server;
if (CONFIG.IS_HTTPS) {
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

server.listen(CONFIG.PORT as number, () => {
  Logger.info(
    `mediasoup-server running at ${CONFIG.IS_HTTPS ? "https" : "http"}://${CONFIG.ANNOUNCED_IP}:${CONFIG.PORT}`,
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
