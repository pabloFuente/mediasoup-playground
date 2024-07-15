import "./style.css";
import { SocketHandler } from "./socket/socket-handler";

document.querySelector("#publish-btn")?.addEventListener("click", publish);
document.querySelector("#receive-btn")?.addEventListener("click", subscribe);

const socketHandler = new SocketHandler();

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
  });
  (document.querySelector("#local-video") as HTMLVideoElement).srcObject =
    mediaStream;
  const track = mediaStream.getVideoTracks()[0];
  await socketHandler.publishVideo(sendTransport, track);
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
  const remoteTrack = await socketHandler.subscribeVideo(receiveTransport);
  remoteVideo.srcObject = new MediaStream([remoteTrack]);
}
