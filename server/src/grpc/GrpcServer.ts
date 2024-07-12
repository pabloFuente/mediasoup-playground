import * as grpc from "@grpc/grpc-js";
import * as MediasoupService from "../fbs/grpc_grpc.js";
import flatbuffers from "flatbuffers";
import { Logger } from "../library/logging.js";
import {
  PrepareSenderRequest,
  PrepareSenderResponse,
} from "../fbs/fbs/client-to-server.js";

export class GrpcServer {
  start() {
    const server = new grpc.Server({
      "grpc.max_receive_message_length": -1,
      "grpc.max_send_message_length": -1,
    });

    server.addService(
      MediasoupService.MediasoupTutorialService,
      new MediasoupTutorialServer(),
    );

    server.bindAsync(
      `0.0.0.0:3001`,
      grpc.ServerCredentials.createInsecure(),
      (err: Error | null, bindPort: number) => {
        if (err) {
          throw err;
        }
        Logger.info(`gRPC server is listening at port ${bindPort}`);
      },
    );
  }
}

class MediasoupTutorialServer
  implements MediasoupService.IMediasoupTutorialServer
{
  [name: string]: grpc.UntypedHandleCall;

  PrepareSender(
    call: grpc.ServerUnaryCall<PrepareSenderRequest, PrepareSenderResponse>,
    callback: grpc.sendUnaryData<PrepareSenderResponse>,
  ): void {
    console.log(`Prepare sender for room ${call.request.roomName()}`);
    const builder = new flatbuffers.Builder();
    const offset = builder.createString(`welcome ${call.request.roomName()}`);
    const root = PrepareSenderResponse.createPrepareSenderResponse(
      builder,
      offset,
    );
    builder.finish(root);
    callback(
      null,
      PrepareSenderResponse.getRootAsPrepareSenderResponse(
        new flatbuffers.ByteBuffer(builder.asUint8Array()),
      ),
    );
  }
}
