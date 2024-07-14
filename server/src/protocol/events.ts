import {
  PrepareSenderRequest,
  PrepareSenderResponse,
  ConnectWebrtcTransportRequest,
  ConnectWebrtcTransportResponse,
} from "./mediasoup_tutorial_pb.js";

export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
}

export interface ClientToServerEvents {
  prepareSender: (
    request: PrepareSenderRequest,
    callback: (response: PrepareSenderResponse) => void
  ) => void;
  connectWebRtcTransport: (
    request: ConnectWebrtcTransportRequest,
    callback: (response: ConnectWebrtcTransportResponse) => void
  ) => void;
  publish: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}
