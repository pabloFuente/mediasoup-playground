import * as SocketIO from "socket.io";
import { Room } from "../models/room.js";
import { Logger } from "../library/logging.js";
import {
  CreateWebrtcTransportRequest,
  CreateWebrtcTransportResponse,
  ConnectWebrtcTransportRequest,
  ProduceRequest,
  ProduceResponse,
  ConnectWebrtcTransportResponse,
  ConsumeRequest,
  ConsumeResponse,
  ResumeConsumerRequest,
} from "../protocol/mediasoup_tutorial_pb.js";
import { RoomService } from "../services/room.service.js";
import { RtpCapabilities } from "mediasoup/node/lib/RtpParameters.js";

export class SocketController {
  socketServer: any;
  roomService: RoomService;

  constructor(socketServer: SocketIO.Server) {
    this.socketServer = socketServer;
    this.roomService = new RoomService();
    socketServer.on("connection", (socket) => {
      Logger.info("A user connected!");

      socket.on("disconnect", () => {
        Logger.info("A user disconnected!");
      });

      socket.on(
        "createWebRtcTransport",
        async (request: CreateWebrtcTransportRequest, callback: Function) => {
          Logger.info("createWebRtcTransport: " + JSON.stringify(request));
          try {
            let room: Room = await this.roomService.getRoom(request.roomName);
            const routerRtpCapabilities = await room.initRouter();
            const transportOptions = await room.initWebRtcTransport();
            const response = new CreateWebrtcTransportResponse({
              routerRtpCapabilities: JSON.stringify(routerRtpCapabilities),
              transportOptions: JSON.stringify(transportOptions),
            });
            Logger.info("createWebRtcTransport success");
            callback(response);
          } catch (err: any) {
            Logger.error("createWebRtcTransport error: ", err);
            const errorResponse = new CreateWebrtcTransportResponse({
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        }
      );

      socket.on(
        "connectWebRtcTransport",
        async (request: ConnectWebrtcTransportRequest, callback: Function) => {
          Logger.info("connectWebRtcTransport: ", request);
          try {
            const room = await this.roomService.getRoom(request.roomName);
            const transport = room.webRtcTransports.get(request.transportId);
            if (!transport) {
              Logger.error(
                "connectWebRtcTransport error: WebRtcTransport not found"
              );
              const errorResponse = new ConnectWebrtcTransportResponse({
                error: {
                  message:
                    "WebRtcTransport " +
                    request.transportId +
                    " not found in room " +
                    request.roomName,
                },
              });
              callback(errorResponse);
            } else {
              await transport.connect({
                dtlsParameters: JSON.parse(request.dtlsParameters),
              });
              Logger.info("connectWebRtcTransport success");
              callback({});
            }
          } catch (err: any) {
            Logger.error("connectWebRtcTransport error: ", err);
            const errorResponse = new ConnectWebrtcTransportResponse({
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        }
      );

      socket.on(
        "produce",
        async (request: ProduceRequest, callback: Function) => {
          Logger.info("produce request");
          try {
            const room = await this.roomService.getRoom(request.roomName);
            const producer = await room.initProducer(
              request.transportId,
              request.kind == "audio" ? "audio" : "video",
              JSON.parse(request.rtpParameters)
            );
            const response: ProduceResponse = new ProduceResponse({
              producerId: producer.id,
            });
            callback(response);
          } catch (err: any) {
            Logger.error("produce error: ", err);
            const errorResponse = new ProduceResponse({
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        }
      );

      socket.on(
        "consume",
        async (request: ConsumeRequest, callback: Function) => {
          Logger.info("consume request");
          try {
            const room = await this.roomService.getRoom(request.roomName);
            const consumerRtpCapabilities: RtpCapabilities = JSON.parse(
              request.rtpCapabilities
            );
            if (
              !room.router?.canConsume({
                producerId: request.producerId,
                rtpCapabilities: consumerRtpCapabilities,
              })
            ) {
              Logger.error("consume error: cannot consume");
              const errorResponse = new ConsumeResponse({
                error: {
                  message: "Cannot consume",
                },
              });
              callback(errorResponse);
              return;
            }
            const consumer = await room.initConsumer(
              request.transportId,
              request.producerId,
              consumerRtpCapabilities
            );
            const response: ConsumeResponse = new ConsumeResponse({
              id: consumer.id,
              producerId: consumer.producerId,
              kind: consumer.kind,
              rtpParameters: JSON.stringify(consumer.rtpParameters),
            });
            callback(response);
          } catch (err: any) {
            Logger.error("produce error: ", err);
            const errorResponse = new ProduceResponse({
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        }
      );

      socket.on("resumeConsumer", async (request: ResumeConsumerRequest) => {
        Logger.info("resumeConsumer request");
        try {
          const room = await this.roomService.getRoom(request.roomName);
          const consumer = room.consumers.get(request.consumerId);
          if (!consumer) {
            Logger.error("resumeConsumer error: Consumer not found");
            return;
          }
          await consumer.resume();
          Logger.info("resumeConsumer success");
        } catch (err: any) {
          Logger.error("resumeConsumer error: ", err);
        }
      });
    });
  }
}
