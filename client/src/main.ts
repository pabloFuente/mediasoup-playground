import "./style.css";

import {
  Consumer,
  DataConsumer,
  DataProducer,
  Producer,
} from "mediasoup-client/lib/types";

import { SocketHandler } from "./socket/socket-handler";

document.querySelector("#publish-btn")?.addEventListener("click", publish);
document.querySelector("#receive-btn")?.addEventListener("click", subscribe);
document.querySelector("#send-data-btn")?.addEventListener("click", sendData);
document.querySelector("#recv-data-btn")?.addEventListener("click", recvData);
document
  .querySelector("#publisher-stats")
  ?.addEventListener("click", publisherStats);
document
  .querySelector("#subscriber-stats")
  ?.addEventListener("click", subscriberStats);

const socketHandler = new SocketHandler();
let producerVideo: Producer;
let producerAudio: Producer;
let consumerVideo: Consumer;
let consumerAudio: Consumer;
let dataProducer: DataProducer;
let dataConsumer: DataConsumer;

async function publish() {
  const roomName: string = (document.getElementById("room") as HTMLInputElement)
    .value;
  await socketHandler.connectSocket("https://localhost:3000");
  const sendTransport = await socketHandler.createWebRtcTransport(
    roomName,
    "send",
  );
  let mediaStream: MediaStream;
  try {
    const screenshare = (
      document.getElementById("screenshare") as HTMLInputElement
    ).checked;
    if (screenshare) {
      mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
    } else {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    }
  } catch (error) {
    console.error("Error: Unable to access media", error);
    return;
  }
  (document.querySelector("#local-video") as HTMLVideoElement).srcObject =
    mediaStream;

  const videoTrack = mediaStream.getVideoTracks()[0];
  const audioTrack = mediaStream.getAudioTracks()[0];
  const simulcast = (document.getElementById("simulcast") as HTMLInputElement)
    .checked;

  const promises = [];
  if (videoTrack) {
    promises.push(
      socketHandler.publishTrack(sendTransport, videoTrack, simulcast),
    );
  }
  if (audioTrack) {
    promises.push(socketHandler.publishTrack(sendTransport, audioTrack));
  }
  const producers = await Promise.all(promises);
  producerVideo = producers.find((producer) => producer.kind === "video")!;
  producerAudio = producers.find((producer) => producer.kind === "audio")!;
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
    "recv",
  );

  const promises = [];
  if (producerVideo) {
    promises.push(
      socketHandler.subscribeTrack(receiveTransport, producerVideo.id),
    );
  }
  if (producerAudio) {
    promises.push(
      socketHandler.subscribeTrack(receiveTransport, producerAudio.id),
    );
  }

  const consumers = await Promise.all(promises);
  consumerVideo = consumers.find((consumer) => consumer.kind === "video")!;
  consumerAudio = consumers.find((consumer) => consumer.kind === "audio")!;

  const tracks = [];
  if (consumerVideo) {
    tracks.push(consumerVideo.track);
  }
  if (consumerAudio) {
    tracks.push(consumerAudio.track);
  }

  const remoteVideo = document.querySelector(
    "#remote-video",
  ) as HTMLVideoElement;
  remoteVideo.srcObject = new MediaStream(tracks);
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

async function publisherStats() {
  stats(producerVideo);
}

async function subscriberStats() {
  setInterval(() => {
    stats(consumerVideo);
  }, 1000);
}

async function stats(target: Producer | Consumer) {
  if (!socketHandler.socket?.connected) {
    alert("Please publish first");
    return;
  }
  const stats = await target.getStats();
  const videoLayers: any[] = [];
  let codecs = new Map();
  stats?.forEach((report) => {
    if (report.type === "codec") {
      // Store for matching with codecId in 'outbound-rtp' or 'inbound-rtp' reports
      codecs.set(report.id, report);
    }
    if (report.type === "outbound-rtp" || report.type === "inbound-rtp") {
      videoLayers.push({
        codecId: report.codecId,
        scalabilityMode: report.scalabilityMode,
        rid: report.rid,
        active: report.active,
        frameWidth: report.frameWidth,
        frameHeight: report.frameHeight,
        framesPerSecond: report.framesPerSecond,
        bytesReceived: report.bytesReceived,
        bytesSent: report.bytesSent,
      });
    }
  });
  videoLayers.forEach((layer) => {
    if (codecs.has(layer.codecId)) {
      layer.codec = codecs.get(layer.codecId).mimeType;
    }
  });
  console.log(JSON.stringify(videoLayers, null, 2));
}
