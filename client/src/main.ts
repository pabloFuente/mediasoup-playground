import "./style.css";
import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./protocol/events";
import {
  ConnectWebrtcTransportRequest,
  ConnectWebrtcTransportResponse,
  PrepareSenderRequest,
  PrepareSenderResponse,
} from "./protocol/mediasoup_tutorial_pb";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import { TransportOptions } from "mediasoup-client/lib/types";

document.querySelector("#join-btn")?.addEventListener("click", joinRoom);

let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

function joinRoom() {
  const roomName: string = (document.getElementById("room") as HTMLInputElement)
    .value;

  socket = io("http://localhost:3000");

  socket.on("connect", () => {
    console.log("Connected to the server!");
    const engine = socket.io.engine;
    engine.on("close", (reason) => {
      console.log("The underlying connection is closed: " + reason);
    });
  });
  socket.on("connect_error", (error) => {
    if (socket.active) {
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
  });
  socket.on("disconnect", () => {
    console.log(socket.connected);
  });
  socket.io.on("reconnect_attempt", () => {
    console.log("Reconnecting...");
  });
  socket.io.on("reconnect", () => {
    console.log("Reconnected!");
  });

  const request: PrepareSenderRequest = new PrepareSenderRequest();
  request.roomName = roomName;

  console.log("prepareSender request: ", request);
  socket.emit(
    "prepareSender",
    request,
    async (response: PrepareSenderResponse) => {
      if (response.error) {
        console.error("prepareSender remote error: ", response.error);
        return;
      }
      console.log("prepareSender response: ", response);
      const routerRtpCapabilities: RtpCapabilities = JSON.parse(
        response.routerRtpCapabilities
      );
      const transportOptions: TransportOptions = JSON.parse(
        response.transportOptions
      );
      const device = await createDevice(routerRtpCapabilities);
      const sendTransport = await createSendTransport(device, transportOptions);
    }
  );
}

async function createDevice(
  routerRtpCapabilities: RtpCapabilities
): Promise<Device> {
  const device = new Device();

  // Just for Chrome, Safari or any libwebrtc based browser.
  if (
    supportsVideoOrientationHeaderExtension() &&
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
  return device;
}

async function createSendTransport(
  device: Device,
  transportOptions: TransportOptions
) {
  const sendTransport = await device.createSendTransport(transportOptions);
  sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    const request = new ConnectWebrtcTransportRequest({
      transportId: sendTransport.id,
      dtlsParameters: JSON.stringify(dtlsParameters),
    });
    console.log("connectWebRtcTransport request: ", request);
    socket.emit(
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
  });
  // sendTransport.on(
  //   "produce",
  //   async ({ kind, rtpParameters, appData }, callback, errback) => {}
  // );
}

function supportsVideoOrientationHeaderExtension() {
  return true;
}
