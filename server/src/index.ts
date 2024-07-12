import express, { Express } from "express";
import { createServer } from "node:http";

import dotenv from "dotenv";
import { Logger } from "./library/logging.js";
import { TransportListenInfo } from "mediasoup/node/lib/types.js";
import { handleBinary } from "./utils/startup.js";
import mediasoup from "mediasoup";
import { GrpcServer } from "./grpc/GrpcServer.js";

dotenv.config();
handleBinary();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", async (_, res) => {
  const msWorker = await mediasoup.createWorker();
  const msRouter = await msWorker.createRouter();
  const listenInfo: TransportListenInfo = {
    protocol: "udp",
    ip: "127.0.0.1",
    announcedIp: "127.0.0.1",
  };
  const msWebrtcTransport = await msRouter.createWebRtcTransport({
    listenInfos: [listenInfo],
    enableUdp: true,
    enableTcp: true,
    appData: {
      myAppData: "This is my app data",
    },
  });
  Logger.info("msWebrtcTransport: " + msWebrtcTransport.appData);
  res.status(200);
  res.send();
});

const httpServer = createServer(app);

httpServer.listen(port, () => {
  Logger.info("mediasoup-server running at http://localhost:" + port);
});

const server = new GrpcServer();
server.start();
