import {
  Consumer,
  DataConsumer,
  DataProducer,
  Producer,
  Router,
  RtpCapabilities,
  RtpCodecCapability,
  RtpParameters,
  SctpStreamParameters,
  WebRtcTransport,
  Worker,
} from "mediasoup/node/lib/types.js";
import semver from "semver";

import { CONFIG } from "../config/config.js";
import { Logger } from "../library/logging.js";
import { getFilteredMediasoupRtpCapabilities1 } from "../utils/capabilities.js";

export class Room {
  name: string;
  mediasoupVersion: string;
  worker: Worker;
  router: Router | undefined;
  webRtcTransports: Map<WebRtcTransport["id"], WebRtcTransport> = new Map();
  producers: Map<Producer["id"], Producer> = new Map();
  consumers: Map<Consumer["id"], Consumer> = new Map();

  constructor(name: string, worker: Worker, mediasoupVersion: string) {
    this.name = name;
    this.worker = worker;
    this.mediasoupVersion = mediasoupVersion;
  }

  async initRouter(): Promise<RtpCapabilities> {
    if (!this.router) {
      const codecs: RtpCodecCapability[] =
        getFilteredMediasoupRtpCapabilities1();
      this.router = await this.worker.createRouter({
        mediaCodecs: codecs,
      });
      Logger.info(`Router ${this.router.id} created for room ${this.name}`);
    }
    return this.router.rtpCapabilities;
  }

  async initWebRtcTransport(): Promise<any> {
    const webRtcTransportOptions: any = {
      enableUdp: true,
      enableTcp: true,
      enableSctp: true,
      appData: {
        myAppData: "This is my app data",
      },
    };
    if (semver.gte(this.mediasoupVersion, "3.13.0")) {
      // TransportListenInfo for mediasoup > 3.13.0
      webRtcTransportOptions.listenInfos = [
        {
          protocol: "udp",
          ip: "0.0.0.0",
          announcedAddress: CONFIG.ANNOUNCED_IP,
          portRange: {
            min: Number(CONFIG.RTC_MIN_PORT),
            max: Number(CONFIG.RTC_MAX_PORT),
          },
        },
      ];
    } else {
      // TransportListenIps for mediasoup < 3.13.0
      webRtcTransportOptions.listenIps = [
        {
          ip: "0.0.0.0",
          announcedIp: CONFIG.ANNOUNCED_IP,
        },
      ];
    }
    const webRtcTransport: WebRtcTransport =
      await this.router!.createWebRtcTransport(webRtcTransportOptions);
    Logger.info(
      `WebRtcTransport ${webRtcTransport.id} created for Router ${this.router?.id} of room ${this.name}`,
    );
    this.webRtcTransports.set(webRtcTransport.id, webRtcTransport);
    return {
      id: webRtcTransport.id,
      iceParameters: webRtcTransport.iceParameters,
      iceCandidates: webRtcTransport.iceCandidates,
      dtlsParameters: webRtcTransport.dtlsParameters,
      sctpParameters: webRtcTransport.sctpParameters,
    };
  }

  async initProducer(
    transportId: string,
    kind: "audio" | "video",
    rtpParameters: RtpParameters,
  ): Promise<Producer> {
    const transport = this.webRtcTransports.get(transportId);
    if (!transport) {
      throw new Error(
        "WebRtcTransport " + transportId + "not found for room " + this.name,
      );
    }
    const producer = await transport.produce({
      kind,
      rtpParameters,
    });
    this.producers.set(producer.id, producer);
    return producer;
  }

  async initConsumer(
    transportId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities,
  ): Promise<Consumer> {
    const transport = this.webRtcTransports.get(transportId);
    if (!transport) {
      throw new Error(
        "WebRtcTransport " + transportId + "not found for room " + this.name,
      );
    }
    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true,
    });
    this.consumers.set(consumer.id, consumer);
    return consumer;
  }

  async initDataProducer(
    transportId: string,
    sctpStreamParameters: SctpStreamParameters,
    label: string,
  ): Promise<DataProducer> {
    const transport = this.webRtcTransports.get(transportId);
    if (!transport) {
      throw new Error(
        "WebRtcTransport " + transportId + "not found for room " + this.name,
      );
    }
    const dataProducer = await transport.produceData({
      sctpStreamParameters,
      label,
    });
    return dataProducer;
  }

  async initDataConsumer(
    transportId: string,
    dataProducerId: string,
  ): Promise<DataConsumer> {
    const transport = this.webRtcTransports.get(transportId);
    if (!transport) {
      throw new Error(
        "WebRtcTransport " + transportId + "not found for room " + this.name,
      );
    }
    const dataConsumer = await transport.consumeData({
      dataProducerId,
    });
    return dataConsumer;
  }
}
