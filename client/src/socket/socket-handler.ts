import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "../protocol/events";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import {
  Consumer,
  DtlsParameters,
  Producer,
  Transport,
  TransportOptions,
} from "mediasoup-client/lib/types";
import { Device } from "mediasoup-client";
import {
  ConnectWebrtcTransportRequest,
  ConnectWebrtcTransportResponse,
  ConsumeRequest,
  ConsumeResponse,
  CreateWebrtcTransportRequest,
  CreateWebrtcTransportResponse,
  ProduceRequest,
  ProduceResponse,
  ResumeConsumerRequest,
} from "../protocol/mediasoup_tutorial_pb";

export class SocketHandler {
  socket?: Socket<ServerToClientEvents, ClientToServerEvents>;
  roomName?: string;
  device?: Device;

  sendTransports: Map<string, Transport> = new Map();
  receiveTransports: Map<string, Transport> = new Map();
  producers: Map<string, Producer> = new Map();
  consumers: Map<string, Consumer> = new Map();

  connectSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(url);

      this.socket.on("connect", () => {
        console.log("Connected to the server!");
        const engine = this.socket!.io.engine;
        engine.on("close", (reason) => {
          console.log("The underlying connection is closed: " + reason);
        });
        resolve();
      });
      this.socket.on("connect_error", (error) => {
        if (this.socket!.active) {
          // temporary failure, the socket will automatically try to reconnect
          console.log(
            "Connection error. Temporary failure. The socket will automatically try to reconnect",
            error
          );
        } else {
          // the connection was denied by the server
          // in that case, `socket.connect()` must be manually called in order to reconnect
          console.log("Connection denied by the server", error);
        }
        reject(error);
      });
      this.socket.on("disconnect", () => {
        console.log(this.socket!.connected);
      });
      this.socket.io.on("reconnect_attempt", () => {
        console.log("Reconnecting...");
      });
      this.socket.io.on("reconnect", () => {
        console.log("Reconnected!");
      });
    });
  }

  createWebRtcTransport(
    roomName: string,
    direction: "send" | "recv"
  ): Promise<Transport> {
    return new Promise((resolve, reject) => {
      this.roomName = roomName;
      const request: CreateWebrtcTransportRequest =
        new CreateWebrtcTransportRequest({
          roomName,
        });
      this.socket!.emit(
        "createWebRtcTransport",
        request,
        async (response: CreateWebrtcTransportResponse) => {
          if (response.error) {
            console.error(
              "createWebRtcTransport remote error: ",
              response.error
            );
            reject(response.error);
            return;
          }
          console.log("createWebRtcTransport response: ", response);
          const routerRtpCapabilities: RtpCapabilities = JSON.parse(
            response.routerRtpCapabilities
          );
          const transportOptions: TransportOptions = JSON.parse(
            response.transportOptions
          );
          this.device = await this.createDevice(routerRtpCapabilities);
          if (direction === "send") {
            const sendTransport =
              await this.createSendTransport(transportOptions);
            this.sendTransports.set(sendTransport.id, sendTransport);
            resolve(sendTransport);
          } else {
            const receiveTransport =
              await this.createReceiveTransport(transportOptions);
            this.receiveTransports.set(receiveTransport.id, receiveTransport);
            resolve(receiveTransport);
          }
        }
      );
    });
  }

  publishVideo(
    sendTransport: Transport,
    videoTrack: MediaStreamTrack
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!this.device?.canProduce("video")) {
        reject(new Error("Device cannot produce video"));
        return;
      }
      const producer = await sendTransport.produce({
        track: videoTrack,
        encodings: [
          { maxBitrate: 100000 },
          { maxBitrate: 300000 },
          { maxBitrate: 900000 },
        ],
        codecOptions: {
          videoGoogleStartBitrate: 1000,
        },
      });
      console.log("Producer created with id: ", producer.id);
      this.producers.set(producer.id, producer);
      resolve();
    });
  }

  publishAudio() {}

  subscribeVideo(receiveTransport: Transport): Promise<MediaStreamTrack> {
    return new Promise(async (resolve, reject) => {
      const request: ConsumeRequest = new ConsumeRequest({
        roomName: this.roomName!,
        transportId: receiveTransport.id,
        producerId: this.producers.keys().next().value,
        rtpCapabilities: JSON.stringify(this.device!.rtpCapabilities),
      });
      this.socket!.emit(
        "consume",
        request,
        async (response: ConsumeResponse) => {
          if (response.error) {
            console.error("consume remote error: ", response.error);
            reject(response.error);
            return;
          }
          const consumer: Consumer = await receiveTransport.consume({
            id: response.id,
            producerId: response.producerId,
            kind: response.kind as "audio" | "video",
            rtpParameters: JSON.parse(response.rtpParameters),
          });
          const req: ResumeConsumerRequest = new ResumeConsumerRequest({
            roomName: this.roomName!,
            consumerId: consumer.id,
          });
          this.socket!.emit("resumeConsumer", req);
          resolve(consumer.track);
        }
      );
    });
  }

  private connectWebRtcTransport(
    roomName: string,
    transportId: string,
    dtlsParameters: DtlsParameters,
    callback: Function,
    errback: Function
  ) {
    const request = new ConnectWebrtcTransportRequest({
      roomName,
      transportId,
      dtlsParameters: JSON.stringify(dtlsParameters),
    });
    console.log("connectWebRtcTransport request: ", request);
    this.socket!.emit(
      "connectWebRtcTransport",
      request,
      async (response: ConnectWebrtcTransportResponse) => {
        if (response.error) {
          console.error(
            "connectWebRtcTransport remote error: ",
            response.error
          );
          errback(new Error(response.error.message));
          return;
        }
        console.log("connectWebRtcTransport response: ", response);
        callback();
      }
    );
  }

  private produce(
    roomName: string,
    transportId: string,
    kind: string,
    rtpParameters: any,
    callback: Function,
    errback: Function
  ) {
    const request = new ProduceRequest({
      roomName,
      transportId,
      kind,
      rtpParameters: JSON.stringify(rtpParameters),
    });
    console.log("produce request: ", request);
    this.socket!.emit("produce", request, async (response: ProduceResponse) => {
      if (response.error) {
        console.error("produce remote error: ", response.error);
        errback(new Error(response.error.message));
        return;
      }
      console.log("produce response: ", response);
      callback({ id: response.producerId });
    });
  }

  private async createDevice(
    routerRtpCapabilities: RtpCapabilities
  ): Promise<Device> {
    const device = new Device();
    console.log("Device created");

    // Just for Chrome, Safari or any libwebrtc based browser.
    if (
      this.supportsVideoOrientationHeaderExtension() &&
      !!routerRtpCapabilities.headerExtensions
    ) {
      // Remove the "urn:3gpp:video-orientation" extension so when rotating the
      // device, Chrome will encode rotated video instead of indicating the video
      // orientation in an RTP header extension.
      routerRtpCapabilities.headerExtensions =
        routerRtpCapabilities.headerExtensions.filter(
          (ext) => ext.uri !== "urn:3gpp:video-orientation"
        );
    }

    await device.load({ routerRtpCapabilities });
    console.log("Device loaded");
    return device;
  }

  private async createSendTransport(
    transportOptions: TransportOptions
  ): Promise<Transport> {
    const sendTransport =
      await this.device!.createSendTransport(transportOptions);
    console.log("SendTransport created with id: ", sendTransport.id);
    sendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        console.log("sendTransport 'connect' event");
        this.connectWebRtcTransport(
          this.roomName!,
          sendTransport.id,
          dtlsParameters,
          callback,
          errback
        );
      }
    );
    sendTransport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, callback, errback) => {
        console.log("sendTransport 'produce' event");
        this.produce(
          this.roomName!,
          sendTransport.id,
          kind,
          rtpParameters,
          callback,
          errback
        );
      }
    );
    return sendTransport;
  }

  private async createReceiveTransport(
    transportOptions: TransportOptions
  ): Promise<Transport> {
    const recvTransport =
      await this.device!.createRecvTransport(transportOptions);
    console.log("RecvTransport created with id: ", recvTransport.id);
    recvTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        console.log("recvTransport 'connect' event");
        this.connectWebRtcTransport(
          this.roomName!,
          recvTransport.id,
          dtlsParameters,
          callback,
          errback
        );
      }
    );
    return recvTransport;
  }

  private supportsVideoOrientationHeaderExtension() {
    return true;
  }
}
