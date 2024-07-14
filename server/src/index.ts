import express, { Express } from "express";

import dotenv from "dotenv";
import { Logger } from "./library/logging.js";
//import { TransportListenInfo } from "mediasoup/node/lib/types.js";
import { handleBinary } from "./utils/startup.js";
// import mediasoup from "mediasoup";

import * as SocketIO from "socket.io";

import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./protocol/events.js";
import { SocketController } from "./controllers/socket-controller.js";

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
