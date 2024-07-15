import {
  ConnectWebrtcTransportRequest,
  ConnectWebrtcTransportResponse,
  ConsumeRequest,
  ConsumeResponse,
  CreateWebrtcTransportRequest,
  CreateWebrtcTransportResponse,
  ProduceRequest,
  ProduceResponse,
} from "./mediasoup_tutorial_pb.js";

export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
}

export interface ClientToServerEvents {
  createWebRtcTransport: (
    request: CreateWebrtcTransportRequest,
    callback: (response: CreateWebrtcTransportResponse) => void
  ) => void;
  connectWebRtcTransport: (
    request: ConnectWebrtcTransportRequest,
    callback: (response: ConnectWebrtcTransportResponse) => void
  ) => void;
  produce: (
    request: ProduceRequest,
    callback: (response: ProduceResponse) => void
  ) => void;
  consume: (
    request: ConsumeRequest,
    callback: (response: ConsumeResponse) => void
  ) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}
