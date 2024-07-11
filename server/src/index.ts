import express, { Express } from "express";
import fs from "fs";
import dotenv from "dotenv";
import { Logger } from "./library/logging.js";
import mediasoup from "mediasoup";
import { TransportListenInfo } from "mediasoup/node/lib/types.js";

import { getRawAsset, isSea } from "node:sea";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

handleBinary();

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

function handleBinary() {
  if (isSea()) {
    let runningBinaryPath = process.execPath.replace(/\/$/, "");
    runningBinaryPath = runningBinaryPath.substring(
      0,
      runningBinaryPath.lastIndexOf("/")
    );
    const msWorkerBinaryPath = runningBinaryPath + "/mediasoup-worker";
    const msworkerEnvVar = process.env["MEDIASOUP_WORKER_BIN"];
    if (fs.existsSync(msWorkerBinaryPath)) {
      Logger.info(
        "mediasoup-worker binary exists at path " + msWorkerBinaryPath
      );
      if (msworkerEnvVar !== msWorkerBinaryPath) {
        Logger.warn(
          `MEDIASOUP_WORKER_BIN env variable does not match the existing binary path (${msworkerEnvVar})`
        );
        Logger.warn(
          `Run: \n\n    export MEDIASOUP_WORKER_BIN=${msWorkerBinaryPath}\n    ${process.argv.slice(1).join(" ")}\n\n`
        );
        process.exit(1);
      }
    } else {
      Logger.warn(
        "mediasoup-worker binary not found at path " + msWorkerBinaryPath
      );
      Logger.info("Unbundling binary");
      const msWorkerBin = getRawAsset("mediasoup-worker") as ArrayBuffer;
      Logger.info(
        `Writing binary to ${msWorkerBinaryPath} (${msWorkerBin.byteLength} bytes)`
      );
      fs.writeFileSync(msWorkerBinaryPath, Buffer.from(msWorkerBin));
      fs.chmodSync(msWorkerBinaryPath, 0o755);
      Logger.warn(
        `mediasoup-worker binary now available. Run: \n\n    export MEDIASOUP_WORKER_BIN=${msWorkerBinaryPath}\n    ${process.argv.slice(1).join(" ")}\n\n`
      );
      process.exit(1);
    }
  }
}
