// Generated GRPC code for FlatBuffers TS *** DO NOT EDIT ***
import * as flatbuffers from 'flatbuffers';
import { PrepareSenderResponse as FBS_ClientToServer_PrepareSenderResponse } from './fbs/client-to-server/prepare-sender-response.js';
import { PrepareSenderRequest as FBS_ClientToServer_PrepareSenderRequest } from './fbs/client-to-server/prepare-sender-request.js';

import * as grpc from '@grpc/grpc-js';

interface IMediasoupTutorialService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  PrepareSender: IMediasoupTutorialService_IPrepareSender;
}
interface IMediasoupTutorialService_IPrepareSender extends grpc.MethodDefinition<FBS_ClientToServer_PrepareSenderRequest, FBS_ClientToServer_PrepareSenderResponse> {
  path: string; // /FBS.Grpc.MediasoupTutorial/PrepareSender
  requestStream: boolean; // false
  responseStream: boolean; // false
  requestSerialize: grpc.serialize<FBS_ClientToServer_PrepareSenderRequest>;
  requestDeserialize: grpc.deserialize<FBS_ClientToServer_PrepareSenderRequest>;
  responseSerialize: grpc.serialize<FBS_ClientToServer_PrepareSenderResponse>;
  responseDeserialize: grpc.deserialize<FBS_ClientToServer_PrepareSenderResponse>;
}


export const MediasoupTutorialService: IMediasoupTutorialService;

export interface IMediasoupTutorialServer extends grpc.UntypedServiceImplementation {
  PrepareSender: grpc.handleUnaryCall<FBS_ClientToServer_PrepareSenderRequest, FBS_ClientToServer_PrepareSenderResponse>;
}

export interface IMediasoupTutorialClient {
  PrepareSender(request: FBS_ClientToServer_PrepareSenderRequest, callback: (error: grpc.ServiceError | null, response: FBS_ClientToServer_PrepareSenderResponse) => void): grpc.ClientUnaryCall;
  PrepareSender(request: FBS_ClientToServer_PrepareSenderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: FBS_ClientToServer_PrepareSenderResponse) => void): grpc.ClientUnaryCall;
  PrepareSender(request: FBS_ClientToServer_PrepareSenderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: FBS_ClientToServer_PrepareSenderResponse) => void): grpc.ClientUnaryCall;
}

export class MediasoupTutorialClient extends grpc.Client implements IMediasoupTutorialClient {
  constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
  public PrepareSender(request: FBS_ClientToServer_PrepareSenderRequest, callback: (error: grpc.ServiceError | null, response: FBS_ClientToServer_PrepareSenderResponse) => void): grpc.ClientUnaryCall;
  public PrepareSender(request: FBS_ClientToServer_PrepareSenderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: FBS_ClientToServer_PrepareSenderResponse) => void): grpc.ClientUnaryCall;
  public PrepareSender(request: FBS_ClientToServer_PrepareSenderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: FBS_ClientToServer_PrepareSenderResponse) => void): grpc.ClientUnaryCall;
}

