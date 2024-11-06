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

const app: Express = express();
const port = process.env.PORT || 3000;

const httpServer = app.listen(port as number, () => {
  Logger.info("mediasoup-server running at http://localhost:" + port);
});

const io = new SocketIO.Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: "*",
  },
});

new SocketController(io);
