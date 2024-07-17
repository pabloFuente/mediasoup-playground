import {
  Consumer,
  DataProducer,
  Producer,
  Router,
  RtpCapabilities,
  RtpCodecCapability,
  RtpParameters,
  SctpStreamParameters,
  TransportListenInfo,
  WebRtcTransport,
  Worker,
} from "mediasoup/node/lib/types.js";
import { Logger } from "../library/logging.js";
import { getFilteredMediasoupRtpCapabilities1 } from "../utils/capabilities.js";

export class Room {
  name: string;
  worker: Worker;
  router: Router | undefined;
  webRtcTransports: Map<WebRtcTransport["id"], WebRtcTransport> = new Map();
  producers: Map<Producer["id"], Producer> = new Map();
  consumers: Map<Consumer["id"], Consumer> = new Map();

  constructor(name: string, worker: Worker) {
    this.name = name;
    this.worker = worker;
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
    const listenInfo: TransportListenInfo = {
      protocol: "udp",
      ip: "127.0.0.1",
      announcedIp: "127.0.0.1",
    };
    const webRtcTransport: WebRtcTransport =
      await this.router!.createWebRtcTransport({
        listenInfos: [listenInfo],
        enableUdp: true,
        enableTcp: true,
        enableSctp: true,
        appData: {
          myAppData: "This is my app data",
        },
      });
    Logger.info(
      `WebRtcTransport ${webRtcTransport.id} created for Router ${this.router?.id} of room ${this.name}`
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
    rtpParameters: RtpParameters
  ): Promise<Producer> {
    const transport = this.webRtcTransports.get(transportId);
    if (!transport) {
      throw new Error(
        "WebRtcTransport " + transportId + "not found for room " + this.name
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
    rtpCapabilities: RtpCapabilities
  ): Promise<Consumer> {
    const transport = this.webRtcTransports.get(transportId);
    if (!transport) {
      throw new Error(
        "WebRtcTransport " + transportId + "not found for room " + this.name
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
    label: string
  ): Promise<DataProducer> {
    const transport = this.webRtcTransports.get(transportId);
    if (!transport) {
      throw new Error(
        "WebRtcTransport " + transportId + "not found for room " + this.name
      );
    }
    const dataProducer = await transport.produceData({
      sctpStreamParameters,
      label,
    });
    return dataProducer;
  }
}
