import * as grpc from "@grpc/grpc-js";
import * as flatbuffers from "flatbuffers";

import "./style.css";

import { MediasoupTutorialClient } from "./fbs/grpc_grpc";
import { PrepareSenderRequest } from "./fbs/fbs/client-to-server";

function joinRoom() {
  const roomName: string = (document.getElementById("room") as HTMLInputElement)
    .value;

  const client = new MediasoupTutorialClient(
    "localhost:3001",
    grpc.credentials.createInsecure()
  );

  const builder = new flatbuffers.Builder();
  const request = PrepareSenderRequest.createPrepareSenderRequest(
    builder,
    builder.createString(roomName)
  );
  builder.finish(request);
  const bytes = builder.asUint8Array();
  const buf = new flatbuffers.ByteBuffer(bytes);
  const prepareSenderRequest =
    PrepareSenderRequest.getRootAsPrepareSenderRequest(buf);

  client.PrepareSender(prepareSenderRequest, (error, response) => {
    if (error) {
      console.error(error);
    } else {
      console.log(response.sdp());
    }
  });
}

document.querySelector("#join-btn")?.addEventListener("click", joinRoom);
