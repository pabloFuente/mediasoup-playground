// Generated GRPC code for FlatBuffers TS *** DO NOT EDIT ***
import * as flatbuffers from 'flatbuffers';
import { PrepareSenderResponse as FBS_ClientToServer_PrepareSenderResponse } from './fbs/client-to-server/prepare-sender-response';
import { PrepareSenderRequest as FBS_ClientToServer_PrepareSenderRequest } from './fbs/client-to-server/prepare-sender-request';

import grpc from '@grpc/grpc-js';

function serialize_FBS_ClientToServer_PrepareSenderResponse(buffer_args) {
  if (!(buffer_args instanceof FBS_ClientToServer_PrepareSenderResponse)) {
    throw new Error('Expected argument of type PrepareSenderResponse');
  }
  return Buffer.from(buffer_args.serialize());
}

function deserialize_FBS_ClientToServer_PrepareSenderResponse(buffer) {
  return FBS_ClientToServer_PrepareSenderResponse.getRootAsPrepareSenderResponse(new flatbuffers.ByteBuffer(buffer))
}


function serialize_FBS_ClientToServer_PrepareSenderRequest(buffer_args) {
  if (!(buffer_args instanceof FBS_ClientToServer_PrepareSenderRequest)) {
    throw new Error('Expected argument of type PrepareSenderRequest');
  }
  return Buffer.from(buffer_args.serialize());
}

function deserialize_FBS_ClientToServer_PrepareSenderRequest(buffer) {
  return FBS_ClientToServer_PrepareSenderRequest.getRootAsPrepareSenderRequest(new flatbuffers.ByteBuffer(buffer))
}

export var MediasoupTutorialService = {
  PrepareSender: {
    path: '/FBS.Grpc.MediasoupTutorial/PrepareSender',
    requestStream: false,
    responseStream: false,
    requestType: flatbuffers.ByteBuffer,
    responseType: FBS_ClientToServer_PrepareSenderResponse,
    requestSerialize: serialize_FBS_ClientToServer_PrepareSenderRequest,
    requestDeserialize: deserialize_FBS_ClientToServer_PrepareSenderRequest,
    responseSerialize: serialize_FBS_ClientToServer_PrepareSenderResponse,
    responseDeserialize: deserialize_FBS_ClientToServer_PrepareSenderResponse,
  },
};
export const MediasoupTutorialClient = grpc.makeGenericClientConstructor(MediasoupTutorialService);
