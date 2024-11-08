import fs from "fs";
import mediasoup from "mediasoup";
import { getRawAsset, isSea } from "node:sea";

import { Logger } from "../library/logging.js";

export function handleBinary() {
  if (isSea()) {
    const msWorkerBinaryPath =
      getRunningBinaryPath() + "/mediasoup-worker-" + mediasoup.version;
    if (fs.existsSync(msWorkerBinaryPath)) {
      Logger.info(
        "mediasoup-worker binary exists at path " + msWorkerBinaryPath,
      );
    } else {
      Logger.warn(
        "mediasoup-worker binary not found at path " + msWorkerBinaryPath,
      );
      unbundleBinary(msWorkerBinaryPath);
    }
    const msworkerEnvVar = process.env["MEDIASOUP_WORKER_BIN"];
    if (msworkerEnvVar !== msWorkerBinaryPath) {
      Logger.warn(
        `MEDIASOUP_WORKER_BIN env variable is declared but is different to expected ${msWorkerBinaryPath}`,
      );
      Logger.warn(`(current value of MEDIASOUP_WORKER_BIN: ${msworkerEnvVar})`);
      Logger.warn(
        `Run: \n\n    export MEDIASOUP_WORKER_BIN=${msWorkerBinaryPath}\n    ${process.argv.slice(1).join(" ")}\n\n`,
      );
      process.exit(1);
    }
  }
}

function unbundleBinary(binarypath: string) {
  Logger.info("Unbundling binary from raw assets");
  const msWorkerBin = getRawAsset("mediasoup-worker") as ArrayBuffer;
  Logger.info(
    `Writing binary to ${binarypath} (${msWorkerBin.byteLength} bytes)`,
  );
  fs.writeFileSync(binarypath, Buffer.from(msWorkerBin));
  fs.chmodSync(binarypath, 0o755);
  Logger.info(`Binary now available at ${binarypath}`);
}

function getRunningBinaryPath() {
  let runningBinaryPath = process.execPath.replace(/\/$/, "");
  runningBinaryPath = runningBinaryPath.substring(
    0,
    runningBinaryPath.lastIndexOf("/"),
  );
  return runningBinaryPath;
}
