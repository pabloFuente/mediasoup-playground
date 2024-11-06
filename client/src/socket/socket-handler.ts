import { create } from "@bufbuild/protobuf";
import { Device } from "mediasoup-client";
import { MediaKind, RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import {
  Consumer,
  DataConsumer,
  DataProducer,
  DtlsParameters,
  Producer,
  Transport,
  TransportOptions,
} from "mediasoup-client/lib/types";
import { io, Socket } from "socket.io-client";

import { ClientToServerEvents, ServerToClientEvents } from "../protocol/events";
import {
  ConnectWebrtcTransportRequestSchema,
  ConnectWebrtcTransportResponse,
  ConsumeDataRequestSchema,
  ConsumeDataResponse,
  ConsumeRequest,
  ConsumeRequestSchema,
  ConsumeResponse,
  CreateWebrtcTransportRequest,
  CreateWebrtcTransportRequestSchema,
  CreateWebrtcTransportResponse,
  ProduceDataRequest,
  ProduceDataRequestSchema,
  ProduceDataResponse,
  ProduceRequestSchema,
  ProduceResponse,
  ResumeConsumerRequest,
  ResumeConsumerRequestSchema,
} from "../protocol/mediasoup_tutorial_pb";

export class SocketHandler {
  socket?: Socket<ServerToClientEvents, ClientToServerEvents>;
  roomName?: string;
  device?: Device;

  sendTransport?: Transport;
  receiveTransport?: Transport;
  producers: Map<string, Producer> = new Map();
  consumers: Map<string, Consumer> = new Map();
  dataProducer?: DataProducer;
  dataConsumer?: DataConsumer;

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
            error,
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
    direction: "send" | "recv",
  ): Promise<Transport> {
    return new Promise((resolve, reject) => {
      this.roomName = roomName;
      const request: CreateWebrtcTransportRequest = create(
        CreateWebrtcTransportRequestSchema,
        {
          roomName,
        },
      );
      this.socket!.emit(
        "createWebRtcTransport",
        request,
        async (response: CreateWebrtcTransportResponse) => {
          if (response.error) {
            console.error(
              "createWebRtcTransport remote error: ",
              response.error,
            );
            reject(response.error);
            return;
          }
          console.log("createWebRtcTransport response: ", response);
          const routerRtpCapabilities: RtpCapabilities = JSON.parse(
            response.routerRtpCapabilities,
          );
          const transportOptions: TransportOptions = JSON.parse(
            response.transportOptions,
          );
          this.device = await this.createDevice(routerRtpCapabilities);
          if (direction === "send") {
            const sendTransport =
              await this.createSendTransport(transportOptions);
            this.sendTransport = sendTransport;
            resolve(sendTransport);
          } else {
            const receiveTransport =
              await this.createReceiveTransport(transportOptions);
            this.receiveTransport = receiveTransport;
            resolve(receiveTransport);
          }
        },
      );
    });
  }

  publishTrack(
    sendTransport: Transport,
    track: MediaStreamTrack,
  ): Promise<Producer> {
    return new Promise(async (resolve, reject) => {
      if (!this.device?.canProduce(track.kind as MediaKind)) {
        reject(new Error("Device cannot produce " + track.kind));
        return;
      }
      const producer = await sendTransport.produce({
        track: track,
      });
      console.log("Producer created with id: ", producer.id);
      this.producers.set(producer.id, producer);
      resolve(producer);
    });
  }

  subscribeTrack(
    receiveTransport: Transport,
    producerId: string,
  ): Promise<MediaStreamTrack> {
    return new Promise(async (resolve, reject) => {
      const request: ConsumeRequest = create(ConsumeRequestSchema, {
        roomName: this.roomName!,
        transportId: receiveTransport.id,
        producerId,
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
          console.log("Consumer created with id: ", consumer.id);
          this.consumers.set(consumer.id, consumer);
          const req: ResumeConsumerRequest = create(
            ResumeConsumerRequestSchema,
            {
              roomName: this.roomName!,
              consumerId: consumer.id,
            },
          );
          this.socket!.emit("resumeConsumer", req);
          resolve(consumer.track);
        },
      );
    });
  }

  produceData(): Promise<DataProducer> {
    return new Promise(async (resolve, reject) => {
      try {
        const dataProducer = await this.sendTransport!.produceData({
          ordered: true,
          label: "produceDataChannel",
        });
        console.log("DataProducer created with id: ", dataProducer.id);
        this.dataProducer = dataProducer;
        resolve(dataProducer);
      } catch (error: any) {
        reject(error);
      }
    });
  }

  consumeData(): Promise<DataConsumer> {
    return new Promise(async (resolve, reject) => {
      try {
        const request = create(ConsumeDataRequestSchema, {
          roomName: this.roomName!,
          transportId: this.receiveTransport!.id,
          dataProducerId: this.dataProducer!.id,
        });
        console.log("consumeData request: ", request);
        this.socket!.emit(
          "consumeData",
          request,
          async (response: ConsumeDataResponse) => {
            try {
              console.log("consumeData response: ", response);
              const dataConsumer = await this.receiveTransport!.consumeData({
                id: response.dataProducerId,
                dataProducerId: response.dataProducerId,
                sctpStreamParameters: JSON.parse(response.sctpStreamParameters),
              });
              console.log("DataConsumer created with id: ", dataConsumer.id);
              resolve(dataConsumer);
            } catch (error: any) {
              reject(error);
            }
          },
        );
      } catch (error: any) {
        reject(error);
      }
    });
  }

  private connectWebRtcTransport(
    roomName: string,
    transportId: string,
    dtlsParameters: DtlsParameters,
    callback: Function,
    errback: Function,
  ) {
    try {
      const request = create(ConnectWebrtcTransportRequestSchema, {
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
              response.error,
            );
            errback(new Error(response.error.message));
            return;
          }
          console.log("connectWebRtcTransport response: ", response);
          callback();
        },
      );
    } catch (error: any) {
      console.error("connectWebRtcTransport error: ", error);
      errback(new Error(error.message));
    }
  }

  private async createDevice(
    routerRtpCapabilities: RtpCapabilities,
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
          (ext) => ext.uri !== "urn:3gpp:video-orientation",
        );
    }

    await device.load({ routerRtpCapabilities });
    console.log("Device loaded");
    return device;
  }

  private async createSendTransport(
    transportOptions: TransportOptions,
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
          errback,
        );
      },
    );
    sendTransport.on(
      "produce",
      async ({ kind, rtpParameters }, callback, errback) => {
        try {
          console.log("sendTransport 'produce' event");
          const request = create(ProduceRequestSchema, {
            roomName: this.roomName!,
            transportId: sendTransport.id,
            kind,
            rtpParameters: JSON.stringify(rtpParameters),
          });
          console.log("produce request: ", request);
          this.socket!.emit(
            "produce",
            request,
            async (response: ProduceResponse) => {
              if (response.error) {
                console.error("produce remote error: ", response.error);
                errback(new Error(response.error.message));
                return;
              }
              console.log("produce response: ", response);
              callback({ id: response.producerId });
            },
          );
        } catch (error: any) {
          console.error("sendTransport 'produce' event error: ", error);
          errback(new Error(error.message));
        }
      },
    );
    sendTransport.on(
      "producedata",
      async ({ sctpStreamParameters, label }, callback, errback) => {
        try {
          console.log("sendTransport 'producedata' event");
          const request: ProduceDataRequest = create(ProduceDataRequestSchema, {
            roomName: this.roomName!,
            transportId: sendTransport.id,
            sctpStreamParameters: JSON.stringify(sctpStreamParameters),
            label,
          });
          console.log("produceData request: ", request);
          this.socket!.emit(
            "produceData",
            request,
            async (response: ProduceDataResponse) => {
              if (response.error) {
                console.error("produce data remote error: ", response.error);
                errback(new Error(response.error.message));
                return;
              }
              console.log("produce data response: ", response);
              callback({ id: response.dataProducerId });
            },
          );
        } catch (error: any) {
          console.error("sendTransport 'producedata' event error: ", error);
          errback(new Error(error.message));
        }
      },
    );
    return sendTransport;
  }

  private async createReceiveTransport(
    transportOptions: TransportOptions,
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
          errback,
        );
      },
    );
    return recvTransport;
  }

  private supportsVideoOrientationHeaderExtension() {
    return true;
  }
}
