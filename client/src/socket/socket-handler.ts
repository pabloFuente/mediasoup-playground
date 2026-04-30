import { create } from "@bufbuild/protobuf";
import { Device } from "mediasoup-client";
import type {
  Consumer,
  ConsumerOptions,
  DataConsumer,
  DataProducer,
  DtlsParameters,
  MediaKind,
  Producer,
  ProducerOptions,
  RtpCapabilities,
  RtpParameters,
  Transport,
  TransportOptions,
} from "mediasoup-client/types";
import { io, Socket } from "socket.io-client";

import { ClientToServerEvents, ServerToClientEvents } from "../protocol/events";
import {
  CloseConsumerRequest,
  CloseConsumerRequestSchema,
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
} from "../protocol/mediasoup_playground_pb";

const debugPrefix = "### [OPENVIDU][mediasoup-playground]";

let peerConnectionSdpDebugInstalled = false;

function debugJson(label: string, value: unknown) {
  console.log(`${debugPrefix} ${label}:\n${JSON.stringify(value, null, 2)}`);
}

function debugSdp(label: string, description?: RTCSessionDescription | null) {
  if (!description?.sdp) {
    console.log(`${debugPrefix} ${label} SDP: <empty>`);
    return;
  }

  console.log(
    `${debugPrefix} ${label} SDP {type: ${description.type}, bytes: ${description.sdp.length}}`,
  );
  console.log(
    `${debugPrefix} ${label} SDP body begin\n${description.sdp}\n${debugPrefix} ${label} SDP body end`,
  );
}

function installPeerConnectionSdpDebugLogging() {
  if (peerConnectionSdpDebugInstalled || !window.RTCPeerConnection) {
    return;
  }

  peerConnectionSdpDebugInstalled = true;

  const peerConnectionPrototype = window.RTCPeerConnection.prototype as any;
  const originalCreateOffer = peerConnectionPrototype.createOffer;
  const originalCreateAnswer = peerConnectionPrototype.createAnswer;
  const originalSetLocalDescription =
    peerConnectionPrototype.setLocalDescription;
  const originalSetRemoteDescription =
    peerConnectionPrototype.setRemoteDescription;

  peerConnectionPrototype.createOffer = async function (...args: any[]) {
    const offer = await originalCreateOffer.apply(this, args);
    debugSdp("RTCPeerConnection.createOffer", offer);
    return offer;
  };

  peerConnectionPrototype.createAnswer = async function (...args: any[]) {
    const answer = await originalCreateAnswer.apply(this, args);
    debugSdp("RTCPeerConnection.createAnswer", answer);
    return answer;
  };

  peerConnectionPrototype.setLocalDescription = async function (
    ...args: any[]
  ) {
    await originalSetLocalDescription.apply(this, args);
    debugSdp("RTCPeerConnection.setLocalDescription", this.localDescription);
  };

  peerConnectionPrototype.setRemoteDescription = async function (
    ...args: any[]
  ) {
    await originalSetRemoteDescription.apply(this, args);
    debugSdp("RTCPeerConnection.setRemoteDescription", this.remoteDescription);
  };
}

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
          installPeerConnectionSdpDebugLogging();
          debugJson("server routerRtpCapabilities", routerRtpCapabilities);
          debugJson("server transportOptions", transportOptions);
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
    simulcast: boolean = false,
    screenshare: boolean = false,
  ): Promise<Producer> {
    return new Promise(async (resolve, reject) => {
      if (!this.device?.canProduce(track.kind as MediaKind)) {
        reject(new Error("Device cannot produce " + track.kind));
        return;
      }
      const producerOptions: ProducerOptions = {
        track,
        // codec: {
        //   kind: "video",
        //   mimeType: "video/VP8",
        //   preferredPayloadType: 96,
        //   clockRate: 90000,
        //   rtcpFeedback: [
        //     {
        //       type: "nack",
        //       parameter: "",
        //     },
        //     {
        //       type: "nack",
        //       parameter: "pli",
        //     },
        //     {
        //       type: "ccm",
        //       parameter: "fir",
        //     },
        //     {
        //       type: "goog-remb",
        //       parameter: "",
        //     },
        //     {
        //       type: "transport-cc",
        //       parameter: "",
        //     },
        //   ],
        // },
      };
      if (simulcast && track.kind === "video") {
        if (screenshare) {
          // Match livekit-playground screen share simulcast layers:
          // ScreenSharePresets.h360fps15, h720fps30, screenShareEncoding(10Mbps)
          // producerOptions.encodings = [
          //   { rid: "r0", scaleResolutionDownBy: 3, maxBitrate: 400_000, maxFramerate: 15, scalabilityMode: "L1T3" },
          //   { rid: "r1", scaleResolutionDownBy: 1.5, maxBitrate: 2_000_000, maxFramerate: 30, scalabilityMode: "L1T3" },
          //   { rid: "r2", scaleResolutionDownBy: 1, maxBitrate: 10_000_000, scalabilityMode: "L1T3" },
          // ];
          producerOptions.encodings = [
            { rid: "r0", scalabilityMode: "L1T3" },
            { rid: "r1", scalabilityMode: "L1T3" },
            { rid: "r2", scalabilityMode: "L1T3" },
          ];
        } else {
          producerOptions.encodings = [
            { rid: "r0", scalabilityMode: "L1T3" },
            { rid: "r1", scalabilityMode: "L1T3" },
            { rid: "r2", scalabilityMode: "L1T3" },
          ];
        }
      }
      debugJson("producer options before produce", producerOptions);
      const producer = await sendTransport.produce(producerOptions);
      console.log("Producer created with id: ", producer.id);
      debugJson(
        "producer RTP parameters after produce",
        producer.rtpParameters,
      );
      this.producers.set(producer.id, producer);
      resolve(producer);
    });
  }

  subscribeTrack(
    receiveTransport: Transport,
    producerId: string,
  ): Promise<Consumer> {
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

          const rtpParameters: RtpParameters = JSON.parse(
            response.rtpParameters,
          );
          const consumerOptions: ConsumerOptions = {
            id: response.id,
            producerId: response.producerId,
            kind: response.kind as "audio" | "video",
            rtpParameters: rtpParameters,
          };

          console.log("consumer options: ", consumerOptions);
          debugJson("consumer options before consume", consumerOptions);

          const consumer: Consumer =
            await receiveTransport.consume(consumerOptions);
          console.log("Consumer created with id: ", consumer.id);
          debugJson(
            "consumer RTP parameters after consume",
            consumer.rtpParameters,
          );
          this.consumers.set(consumer.id, consumer);
          const req: ResumeConsumerRequest = create(
            ResumeConsumerRequestSchema,
            {
              roomName: this.roomName!,
              consumerId: consumer.id,
            },
          );
          this.socket!.emit("resumeConsumer", req);
          resolve(consumer);
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

  closeConsumer(consumerId: string): Promise<void> {
    return new Promise((resolve) => {
      const request: CloseConsumerRequest = create(CloseConsumerRequestSchema, {
        roomName: this.roomName!,
        consumerId,
      });
      this.socket!.emit("closeConsumer", request);
      this.consumers.get(consumerId)!.close();
      this.consumers.delete(consumerId);
      resolve();
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
    debugJson("device RTP capabilities after load", device.rtpCapabilities);
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
          debugJson(
            "sendTransport produce event RTP parameters",
            rtpParameters,
          );
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
