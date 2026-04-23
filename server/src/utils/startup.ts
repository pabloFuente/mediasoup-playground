import fs from "fs";
import { networkInterfaces } from "os";
import mediasoup from "mediasoup";
import { getRawAsset, isSea } from "node:sea";

import { CONFIG } from "../config/config.js";
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

export async function validateAnnouncedIp(): Promise<void> {
  const announcedIp = CONFIG.ANNOUNCED_IP;

  if (announcedIp === "127.0.0.1") {
    Logger.warn(
      "MEDIASOUP_ANNOUNCED_IP=127.0.0.1 — only same-machine clients can connect",
    );
    return;
  }

  const localIps = new Set<string>();
  const ifaces = networkInterfaces();
  for (const addrs of Object.values(ifaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4") {
        localIps.add(addr.address);
      }
    }
  }

  if (localIps.has(announcedIp)) {
    Logger.info(
      `MEDIASOUP_ANNOUNCED_IP=${announcedIp} matches a local interface — OK for LAN clients`,
    );
    return;
  }

  const localList = [...localIps].filter((ip) => ip !== "127.0.0.1").join(", ");

  // RFC 1918 / RFC 6598 private ranges
  const isPrivate =
    /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(
      announcedIp,
    );

  if (isPrivate) {
    Logger.error(
      `MEDIASOUP_ANNOUNCED_IP=${announcedIp} is a private IP that does not match any local interface. ` +
        `Clients will fail to connect via ICE! ` +
        `Local interfaces: ${localList}`,
    );
    process.exit(1);
  }

  Logger.info(
    `MEDIASOUP_ANNOUNCED_IP=${announcedIp} is a public IP (not on any local interface) — verifying against actual public IP...`,
  );

  const publicIp = await detectPublicIp();
  if (!publicIp) {
    Logger.warn(
      `Could not detect public IP to verify MEDIASOUP_ANNOUNCED_IP=${announcedIp}. Proceeding anyway`,
    );
  } else if (publicIp === announcedIp) {
    Logger.info(
      `MEDIASOUP_ANNOUNCED_IP=${announcedIp} matches detected public IP — OK for internet clients`,
    );
  } else {
    Logger.error(
      `MEDIASOUP_ANNOUNCED_IP=${announcedIp} does not match detected public IP (${publicIp}). ` +
        `Clients will fail to connect via ICE!`,
    );
    process.exit(1);
  }
}

async function detectPublicIp(): Promise<string | null> {
  const services = [
    "https://api4.ipify.org",
    "https://ipv4.icanhazip.com",
    "https://ipv4.ifconfig.me/ip",
  ];
  for (const url of services) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const ip = (await res.text()).trim();
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
          return ip;
        }
      }
    } catch {
      // try next service
    }
  }
  return null;
}
