import express, { Express } from "express";
import dotenv from "dotenv";
import { Logger } from "./library/logging.js";
import mediasoup from "mediasoup";
import { TransportListenInfo } from "mediasoup/node/lib/types.js";
import { handleBinary } from "./utils/startup.js";

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

app.listen(port);

Logger.info("mediasoup-server listening on port " + port);
