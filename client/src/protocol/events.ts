import {
  ConnectWebrtcTransportRequest,
  ConnectWebrtcTransportResponse,
  ConsumeDataRequest,
  ConsumeDataResponse,
  ConsumeRequest,
  ConsumeResponse,
  CreateWebrtcTransportRequest,
  CreateWebrtcTransportResponse,
  ProduceDataRequest,
  ProduceDataResponse,
  ProduceRequest,
  ProduceResponse,
  ResumeConsumerRequest,
} from "./mediasoup_tutorial_pb.js";

export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
}

export interface ClientToServerEvents {
  createWebRtcTransport: (
    request: CreateWebrtcTransportRequest,
    callback: (response: CreateWebrtcTransportResponse) => void,
  ) => void;
  connectWebRtcTransport: (
    request: ConnectWebrtcTransportRequest,
    callback: (response: ConnectWebrtcTransportResponse) => void,
  ) => void;
  produce: (
    request: ProduceRequest,
    callback: (response: ProduceResponse) => void,
  ) => void;
  consume: (
    request: ConsumeRequest,
    callback: (response: ConsumeResponse) => void,
  ) => void;
  resumeConsumer: (request: ResumeConsumerRequest) => void;
  produceData: (
    request: ProduceDataRequest,
    callback: (response: ProduceDataResponse) => void,
  ) => void;
  consumeData: (
    request: ConsumeDataRequest,
    callback: (response: ConsumeDataResponse) => void,
  ) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}
