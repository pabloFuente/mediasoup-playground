import {
  Router,
  RtpCapabilities,
  TransportListenInfo,
  WebRtcTransport,
  Worker,
} from "mediasoup/node/lib/types.js";

export class Room {
  name: string;
  worker: Worker;
  router: Router | undefined;
  webRtcTransport: WebRtcTransport | undefined;

  constructor(name: string, worker: Worker) {
    this.name = name;
    this.worker = worker;
  }

  async initRouter(): Promise<RtpCapabilities> {
    if (!this.router) {
      this.router = await this.worker.createRouter();
    }
    return this.router.rtpCapabilities;
  }

  async initWebRtcTransport(): Promise<any> {
    const listenInfo: TransportListenInfo = {
      protocol: "udp",
      ip: "127.0.0.1",
      announcedIp: "127.0.0.1",
    };
    this.webRtcTransport = await this.router!.createWebRtcTransport({
      listenInfos: [listenInfo],
      enableUdp: true,
      enableTcp: true,
      appData: {
        myAppData: "This is my app data",
      },
    });
    return {
      id: this.webRtcTransport.id,
      iceParameters: this.webRtcTransport.iceParameters,
      iceCandidates: this.webRtcTransport.iceCandidates,
      dtlsParameters: this.webRtcTransport.dtlsParameters,
      sctpParameters: this.webRtcTransport.sctpParameters,
    };
  }
}
