import * as SocketIO from "socket.io";
import { Room } from "../models/room.js";
import {
  PrepareSenderRequest,
  PrepareSenderResponse,
} from "../protocol/mediasoup_tutorial_pb.js";
import { RoomService } from "../services/room.service.js";

export class SocketController {
  socketServer: any;
  roomService: RoomService;

  constructor(socketServer: SocketIO.Server) {
    this.socketServer = socketServer;
    this.roomService = new RoomService();
    socketServer.on("connection", (socket) => {
      console.log("A user connected!");

      socket.on("disconnect", () => {
        console.log("A user disconnected!");
      });

      socket.on(
        "prepareSender",
        async (request: PrepareSenderRequest, callback: Function) => {
          console.log("prepareSender: ", request);
          try {
            let room: Room = await this.roomService.getRoom(request.roomName);
            const routerRtpCapabilities = await room.initRouter();
            const transportOptions = await room.initWebRtcTransport();
            const response = new PrepareSenderResponse({
              routerRtpCapabilities: JSON.stringify(routerRtpCapabilities),
              transportOptions: JSON.stringify(transportOptions),
            });
            console.log("prepareSender success: ", response);
            callback(response);
          } catch (err: any) {
            console.error("prepareSender error: ", err);
            const errorResponse = new PrepareSenderResponse({
              error: {
                message: err.message,
              },
            });
            callback(errorResponse);
          }
        }
      );
    });
  }
}
