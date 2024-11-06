// @generated by protoc-gen-es v2.2.2 with parameter "target=ts"
// @generated from file mediasoup_tutorial.proto (package mediasoup, syntax proto3)

import type { Message } from "@bufbuild/protobuf";
import {
  fileDesc,
  messageDesc,
  type GenFile,
  type GenMessage,
} from "@bufbuild/protobuf/codegenv1";

/**
 * Describes the file mediasoup_tutorial.proto.
 */
export const file_mediasoup_tutorial: GenFile =
  /*@__PURE__*/
  fileDesc(
    "ChhtZWRpYXNvdXBfdHV0b3JpYWwucHJvdG8SCW1lZGlhc291cCIxChxDcmVhdGVXZWJydGNUcmFuc3BvcnRSZXF1ZXN0EhEKCXJvb21fbmFtZRgBIAEoCSKLAQodQ3JlYXRlV2VicnRjVHJhbnNwb3J0UmVzcG9uc2USJAoFZXJyb3IYASABKAsyEC5tZWRpYXNvdXAuRXJyb3JIAIgBARIfChdyb3V0ZXJfcnRwX2NhcGFiaWxpdGllcxgCIAEoCRIZChF0cmFuc3BvcnRfb3B0aW9ucxgDIAEoCUIICgZfZXJyb3IiYQodQ29ubmVjdFdlYnJ0Y1RyYW5zcG9ydFJlcXVlc3QSEQoJcm9vbV9uYW1lGAEgASgJEhQKDHRyYW5zcG9ydF9pZBgCIAEoCRIXCg9kdGxzX3BhcmFtZXRlcnMYAyABKAkiUAoeQ29ubmVjdFdlYnJ0Y1RyYW5zcG9ydFJlc3BvbnNlEiQKBWVycm9yGAEgASgLMhAubWVkaWFzb3VwLkVycm9ySACIAQFCCAoGX2Vycm9yIl8KDlByb2R1Y2VSZXF1ZXN0EhEKCXJvb21fbmFtZRgBIAEoCRIUCgx0cmFuc3BvcnRfaWQYAiABKAkSDAoEa2luZBgDIAEoCRIWCg5ydHBfcGFyYW1ldGVycxgEIAEoCSJWCg9Qcm9kdWNlUmVzcG9uc2USJAoFZXJyb3IYASABKAsyEC5tZWRpYXNvdXAuRXJyb3JIAIgBARITCgtwcm9kdWNlcl9pZBgCIAEoCUIICgZfZXJyb3IiaAoOQ29uc3VtZVJlcXVlc3QSEQoJcm9vbV9uYW1lGAEgASgJEhQKDHRyYW5zcG9ydF9pZBgCIAEoCRITCgtwcm9kdWNlcl9pZBgDIAEoCRIYChBydHBfY2FwYWJpbGl0aWVzGAQgASgJIogBCg9Db25zdW1lUmVzcG9uc2USJAoFZXJyb3IYASABKAsyEC5tZWRpYXNvdXAuRXJyb3JIAIgBARIKCgJpZBgCIAEoCRITCgtwcm9kdWNlcl9pZBgDIAEoCRIMCgRraW5kGAQgASgJEhYKDnJ0cF9wYXJhbWV0ZXJzGAUgASgJQggKBl9lcnJvciI/ChVSZXN1bWVDb25zdW1lclJlcXVlc3QSEQoJcm9vbV9uYW1lGAEgASgJEhMKC2NvbnN1bWVyX2lkGAIgASgJImwKElByb2R1Y2VEYXRhUmVxdWVzdBIRCglyb29tX25hbWUYASABKAkSFAoMdHJhbnNwb3J0X2lkGAIgASgJEh4KFnNjdHBfc3RyZWFtX3BhcmFtZXRlcnMYAyABKAkSDQoFbGFiZWwYBCABKAkiXwoTUHJvZHVjZURhdGFSZXNwb25zZRIkCgVlcnJvchgBIAEoCzIQLm1lZGlhc291cC5FcnJvckgAiAEBEhgKEGRhdGFfcHJvZHVjZXJfaWQYAiABKAlCCAoGX2Vycm9yIlcKEkNvbnN1bWVEYXRhUmVxdWVzdBIRCglyb29tX25hbWUYASABKAkSFAoMdHJhbnNwb3J0X2lkGAIgASgJEhgKEGRhdGFfcHJvZHVjZXJfaWQYAyABKAkimQEKE0NvbnN1bWVEYXRhUmVzcG9uc2USJAoFZXJyb3IYASABKAsyEC5tZWRpYXNvdXAuRXJyb3JIAIgBARIYChBkYXRhX2NvbnN1bWVyX2lkGAIgASgJEhgKEGRhdGFfcHJvZHVjZXJfaWQYAyABKAkSHgoWc2N0cF9zdHJlYW1fcGFyYW1ldGVycxgEIAEoCUIICgZfZXJyb3IiVAoFRXJyb3ISDwoHbWVzc2FnZRgBIAEoCRIRCgRjb2RlGAIgASgFSACIAQESEwoGcmVhc29uGAMgASgJSAGIAQFCBwoFX2NvZGVCCQoHX3JlYXNvbmIGcHJvdG8z",
  );

/**
 * @generated from message mediasoup.CreateWebrtcTransportRequest
 */
export type CreateWebrtcTransportRequest =
  Message<"mediasoup.CreateWebrtcTransportRequest"> & {
    /**
     * @generated from field: string room_name = 1;
     */
    roomName: string;
  };

/**
 * Describes the message mediasoup.CreateWebrtcTransportRequest.
 * Use `create(CreateWebrtcTransportRequestSchema)` to create a new message.
 */
export const CreateWebrtcTransportRequestSchema: GenMessage<CreateWebrtcTransportRequest> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 0);

/**
 * @generated from message mediasoup.CreateWebrtcTransportResponse
 */
export type CreateWebrtcTransportResponse =
  Message<"mediasoup.CreateWebrtcTransportResponse"> & {
    /**
     * @generated from field: optional mediasoup.Error error = 1;
     */
    error?: Error;

    /**
     * @generated from field: string router_rtp_capabilities = 2;
     */
    routerRtpCapabilities: string;

    /**
     * @generated from field: string transport_options = 3;
     */
    transportOptions: string;
  };

/**
 * Describes the message mediasoup.CreateWebrtcTransportResponse.
 * Use `create(CreateWebrtcTransportResponseSchema)` to create a new message.
 */
export const CreateWebrtcTransportResponseSchema: GenMessage<CreateWebrtcTransportResponse> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 1);

/**
 * @generated from message mediasoup.ConnectWebrtcTransportRequest
 */
export type ConnectWebrtcTransportRequest =
  Message<"mediasoup.ConnectWebrtcTransportRequest"> & {
    /**
     * @generated from field: string room_name = 1;
     */
    roomName: string;

    /**
     * @generated from field: string transport_id = 2;
     */
    transportId: string;

    /**
     * @generated from field: string dtls_parameters = 3;
     */
    dtlsParameters: string;
  };

/**
 * Describes the message mediasoup.ConnectWebrtcTransportRequest.
 * Use `create(ConnectWebrtcTransportRequestSchema)` to create a new message.
 */
export const ConnectWebrtcTransportRequestSchema: GenMessage<ConnectWebrtcTransportRequest> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 2);

/**
 * @generated from message mediasoup.ConnectWebrtcTransportResponse
 */
export type ConnectWebrtcTransportResponse =
  Message<"mediasoup.ConnectWebrtcTransportResponse"> & {
    /**
     * @generated from field: optional mediasoup.Error error = 1;
     */
    error?: Error;
  };

/**
 * Describes the message mediasoup.ConnectWebrtcTransportResponse.
 * Use `create(ConnectWebrtcTransportResponseSchema)` to create a new message.
 */
export const ConnectWebrtcTransportResponseSchema: GenMessage<ConnectWebrtcTransportResponse> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 3);

/**
 * @generated from message mediasoup.ProduceRequest
 */
export type ProduceRequest = Message<"mediasoup.ProduceRequest"> & {
  /**
   * @generated from field: string room_name = 1;
   */
  roomName: string;

  /**
   * @generated from field: string transport_id = 2;
   */
  transportId: string;

  /**
   * @generated from field: string kind = 3;
   */
  kind: string;

  /**
   * @generated from field: string rtp_parameters = 4;
   */
  rtpParameters: string;
};

/**
 * Describes the message mediasoup.ProduceRequest.
 * Use `create(ProduceRequestSchema)` to create a new message.
 */
export const ProduceRequestSchema: GenMessage<ProduceRequest> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 4);

/**
 * @generated from message mediasoup.ProduceResponse
 */
export type ProduceResponse = Message<"mediasoup.ProduceResponse"> & {
  /**
   * @generated from field: optional mediasoup.Error error = 1;
   */
  error?: Error;

  /**
   * @generated from field: string producer_id = 2;
   */
  producerId: string;
};

/**
 * Describes the message mediasoup.ProduceResponse.
 * Use `create(ProduceResponseSchema)` to create a new message.
 */
export const ProduceResponseSchema: GenMessage<ProduceResponse> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 5);

/**
 * @generated from message mediasoup.ConsumeRequest
 */
export type ConsumeRequest = Message<"mediasoup.ConsumeRequest"> & {
  /**
   * @generated from field: string room_name = 1;
   */
  roomName: string;

  /**
   * @generated from field: string transport_id = 2;
   */
  transportId: string;

  /**
   * @generated from field: string producer_id = 3;
   */
  producerId: string;

  /**
   * @generated from field: string rtp_capabilities = 4;
   */
  rtpCapabilities: string;
};

/**
 * Describes the message mediasoup.ConsumeRequest.
 * Use `create(ConsumeRequestSchema)` to create a new message.
 */
export const ConsumeRequestSchema: GenMessage<ConsumeRequest> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 6);

/**
 * @generated from message mediasoup.ConsumeResponse
 */
export type ConsumeResponse = Message<"mediasoup.ConsumeResponse"> & {
  /**
   * @generated from field: optional mediasoup.Error error = 1;
   */
  error?: Error;

  /**
   * @generated from field: string id = 2;
   */
  id: string;

  /**
   * @generated from field: string producer_id = 3;
   */
  producerId: string;

  /**
   * @generated from field: string kind = 4;
   */
  kind: string;

  /**
   * @generated from field: string rtp_parameters = 5;
   */
  rtpParameters: string;
};

/**
 * Describes the message mediasoup.ConsumeResponse.
 * Use `create(ConsumeResponseSchema)` to create a new message.
 */
export const ConsumeResponseSchema: GenMessage<ConsumeResponse> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 7);

/**
 * @generated from message mediasoup.ResumeConsumerRequest
 */
export type ResumeConsumerRequest =
  Message<"mediasoup.ResumeConsumerRequest"> & {
    /**
     * @generated from field: string room_name = 1;
     */
    roomName: string;

    /**
     * @generated from field: string consumer_id = 2;
     */
    consumerId: string;
  };

/**
 * Describes the message mediasoup.ResumeConsumerRequest.
 * Use `create(ResumeConsumerRequestSchema)` to create a new message.
 */
export const ResumeConsumerRequestSchema: GenMessage<ResumeConsumerRequest> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 8);

/**
 * @generated from message mediasoup.ProduceDataRequest
 */
export type ProduceDataRequest = Message<"mediasoup.ProduceDataRequest"> & {
  /**
   * @generated from field: string room_name = 1;
   */
  roomName: string;

  /**
   * @generated from field: string transport_id = 2;
   */
  transportId: string;

  /**
   * @generated from field: string sctp_stream_parameters = 3;
   */
  sctpStreamParameters: string;

  /**
   * @generated from field: string label = 4;
   */
  label: string;
};

/**
 * Describes the message mediasoup.ProduceDataRequest.
 * Use `create(ProduceDataRequestSchema)` to create a new message.
 */
export const ProduceDataRequestSchema: GenMessage<ProduceDataRequest> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 9);

/**
 * @generated from message mediasoup.ProduceDataResponse
 */
export type ProduceDataResponse = Message<"mediasoup.ProduceDataResponse"> & {
  /**
   * @generated from field: optional mediasoup.Error error = 1;
   */
  error?: Error;

  /**
   * @generated from field: string data_producer_id = 2;
   */
  dataProducerId: string;
};

/**
 * Describes the message mediasoup.ProduceDataResponse.
 * Use `create(ProduceDataResponseSchema)` to create a new message.
 */
export const ProduceDataResponseSchema: GenMessage<ProduceDataResponse> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 10);

/**
 * @generated from message mediasoup.ConsumeDataRequest
 */
export type ConsumeDataRequest = Message<"mediasoup.ConsumeDataRequest"> & {
  /**
   * @generated from field: string room_name = 1;
   */
  roomName: string;

  /**
   * @generated from field: string transport_id = 2;
   */
  transportId: string;

  /**
   * @generated from field: string data_producer_id = 3;
   */
  dataProducerId: string;
};

/**
 * Describes the message mediasoup.ConsumeDataRequest.
 * Use `create(ConsumeDataRequestSchema)` to create a new message.
 */
export const ConsumeDataRequestSchema: GenMessage<ConsumeDataRequest> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 11);

/**
 * @generated from message mediasoup.ConsumeDataResponse
 */
export type ConsumeDataResponse = Message<"mediasoup.ConsumeDataResponse"> & {
  /**
   * @generated from field: optional mediasoup.Error error = 1;
   */
  error?: Error;

  /**
   * @generated from field: string data_consumer_id = 2;
   */
  dataConsumerId: string;

  /**
   * @generated from field: string data_producer_id = 3;
   */
  dataProducerId: string;

  /**
   * @generated from field: string sctp_stream_parameters = 4;
   */
  sctpStreamParameters: string;
};

/**
 * Describes the message mediasoup.ConsumeDataResponse.
 * Use `create(ConsumeDataResponseSchema)` to create a new message.
 */
export const ConsumeDataResponseSchema: GenMessage<ConsumeDataResponse> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 12);

/**
 * @generated from message mediasoup.Error
 */
export type Error = Message<"mediasoup.Error"> & {
  /**
   * @generated from field: string message = 1;
   */
  message: string;

  /**
   * @generated from field: optional int32 code = 2;
   */
  code?: number;

  /**
   * @generated from field: optional string reason = 3;
   */
  reason?: string;
};

/**
 * Describes the message mediasoup.Error.
 * Use `create(ErrorSchema)` to create a new message.
 */
export const ErrorSchema: GenMessage<Error> =
  /*@__PURE__*/
  messageDesc(file_mediasoup_tutorial, 13);
