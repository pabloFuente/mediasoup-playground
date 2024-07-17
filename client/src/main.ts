import "./style.css";
import { SocketHandler } from "./socket/socket-handler";
import { Producer } from "mediasoup-client/lib/types";

document.querySelector("#publish-btn")?.addEventListener("click", publish);
document.querySelector("#receive-btn")?.addEventListener("click", subscribe);
document.querySelector("#send-data-btn")?.addEventListener("click", sendData);

const socketHandler = new SocketHandler();
let producerVideo: Producer;
let producerAudio: Producer;

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
  producerVideo = await socketHandler.publishTrack(sendTransport, videoTrack);
  producerAudio = await socketHandler.publishTrack(sendTransport, audioTrack);
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
  const remoteTrackVideo = await socketHandler.subscribeTrack(
    receiveTransport,
    producerVideo.id
  );
  const remoteTrackAudio = await socketHandler.subscribeTrack(
    receiveTransport,
    producerAudio.id
  );
  remoteVideo.srcObject = new MediaStream([remoteTrackVideo, remoteTrackAudio]);
}

async function sendData() {
  if (!socketHandler.socket?.connected) {
    alert("Please publish first");
    return;
  }
  const dataProducer = await socketHandler.produceData();
  dataProducer.send("Hello from data producer!");
}
