import os from "os";
import mediasoup from "mediasoup";
import { Worker } from "mediasoup/node/lib/types.js";
import { Logger } from "../library/logging.js";

export class MsWorkerService {
  MAX_WORKERS = os.cpus().length;
  workers: Worker[];

  constructor() {
    this.workers = new Array<Worker>();
  }

  async getNewWorkerOrLessLoaded() {
    if (this.workers.length < this.MAX_WORKERS) {
      const newWorker = await mediasoup.createWorker();
      Logger.info("Worker created");
      this.workers.push(newWorker);
      return newWorker;
    }
    return this.getLessLoadedWorker();
  }

  async getLessLoadedWorker() {
    const cpuPromises = this.workers.map(async (worker) => {
      let usage = await worker.getResourceUsage();
      return usage.ru_stime + usage.ru_utime;
    });
    const cpus = await Promise.all(cpuPromises);
    const min = Math.min(...cpus);
    const index = cpus.indexOf(min);
    return this.workers[index];
  }
}
