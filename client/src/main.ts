import "./style.css";
import { SocketHandler } from "./socket/socket-handler";
import {
  DataConsumer,
  DataProducer,
  Producer,
} from "mediasoup-client/lib/types";

document.querySelector("#publish-btn")?.addEventListener("click", publish);
document.querySelector("#receive-btn")?.addEventListener("click", subscribe);
document.querySelector("#send-data-btn")?.addEventListener("click", sendData);
document.querySelector("#recv-data-btn")?.addEventListener("click", recvData);

const socketHandler = new SocketHandler();
let producerVideo: Producer;
let producerAudio: Producer;
let dataProducer: DataProducer;
let dataConsumer: DataConsumer;

async function publish() {
  const roomName: string = (document.getElementById("room") as HTMLInputElement)
    .value;
  await socketHandler.connectSocket("http://localhost:3000");
  const sendTransport = await socketHandler.createWebRtcTransport(
    roomName,
    "send"
  );
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  (document.querySelector("#local-video") as HTMLVideoElement).srcObject =
    mediaStream;
  const videoTrack = mediaStream.getVideoTracks()[0];
  const audioTrack = mediaStream.getAudioTracks()[0];
  [producerVideo, producerAudio] = await Promise.all([
    socketHandler.publishTrack(sendTransport, videoTrack),
    socketHandler.publishTrack(sendTransport, audioTrack),
  ]);
}

async function subscribe() {
  if (!socketHandler.socket?.connected) {
    alert("Please publish first");
    return;
  }
  const roomName: string = (document.getElementById("room") as HTMLInputElement)
    .value;
  const receiveTransport = await socketHandler.createWebRtcTransport(
    roomName,
    "recv"
  );
  const remoteVideo = document.querySelector(
    "#remote-video"
  ) as HTMLVideoElement;
  const [remoteTrackVideo, remoteTrackAudio] = await Promise.all([
    socketHandler.subscribeTrack(receiveTransport, producerVideo.id),
    socketHandler.subscribeTrack(receiveTransport, producerAudio.id),
  ]);
  remoteVideo.srcObject = new MediaStream([remoteTrackVideo, remoteTrackAudio]);
}

async function sendData() {
  if (!socketHandler.socket?.connected) {
    alert("Please publish first");
    return;
  }
  dataProducer = await socketHandler.produceData();
}

async function recvData() {
  if (!socketHandler.socket?.connected) {
    alert("Please publish first");
    return;
  }
  dataConsumer = await socketHandler.consumeData();
  dataConsumer.on("message", (data: String | Blob | ArrayBuffer) => {
    alert("Received message:" + data);
  });
  dataProducer.send("Hello from data producer!");
}
