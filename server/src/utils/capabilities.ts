import * as mediasoup from "mediasoup";
import _ from "lodash";
import {
  RtpCapabilities,
  RtpCodecCapability,
} from "mediasoup/node/lib/types.js";

export function getFilteredMediasoupRtpCapabilities1(): RtpCodecCapability[] {
  return (
    mediasoup
      .getSupportedRtpCapabilities()
      // Remove codecs not that interesting for WebRTC with web browsers.
      // This prevents errors in mediasoup due to not enough available PayloadTypes.
      .codecs!.filter(
        (c: RtpCodecCapability) =>
          !["audio/SILK", "audio/CN", "audio/telephone-event"].includes(
            c.mimeType
          )
      )
      // Prevent errors from accidentally including some codecs with same PT.
      .map((c: RtpCodecCapability) => {
        delete c.preferredPayloadType;
        return c;
      })
      // Add mandatory parameters that mediasoup doesn't include by default.
      .flatMap((c: RtpCodecCapability) => {
        // Notes:
        // * `JSON.parse(JSON.stringify(c))` is to create deep-copies of the object.
        // * `_.defaultsDeep()` recursively assigns default values if missing.
        switch (c.mimeType) {
          case "audio/opus":
            // Based on observed parameters from web browsers.
            if (!("minptime" in (c.parameters ?? {}))) {
              c = _.defaultsDeep(JSON.parse(JSON.stringify(c)), {
                parameters: { minptime: 10 },
              }) as RtpCodecCapability;
            }
            if (!("useinbandfec" in (c.parameters ?? {}))) {
              c = _.defaultsDeep(JSON.parse(JSON.stringify(c)), {
                parameters: { useinbandfec: 1 },
              }) as RtpCodecCapability;
            }
            break;
          case "video/H264":
            if (!("packetization-mode" in (c.parameters ?? {}))) {
              return [
                _.defaultsDeep(JSON.parse(JSON.stringify(c)), {
                  parameters: { "packetization-mode": 0 },
                }),
                _.defaultsDeep(JSON.parse(JSON.stringify(c)), {
                  parameters: { "packetization-mode": 1 },
                }),
              ] as RtpCodecCapability[];
            }
            break;
          case "video/H265":
            if (!("packetization-mode" in (c.parameters ?? {}))) {
              return [
                _.defaultsDeep(JSON.parse(JSON.stringify(c)), {
                  parameters: { "packetization-mode": 0 },
                }),
                _.defaultsDeep(JSON.parse(JSON.stringify(c)), {
                  parameters: { "packetization-mode": 1 },
                }),
              ] as RtpCodecCapability[];
            }
            break;
          case "video/VP9":
            if (!("profile-id" in (c.parameters ?? {}))) {
              return [
                _.defaultsDeep(JSON.parse(JSON.stringify(c)), {
                  parameters: { "profile-id": 0 },
                }),
                _.defaultsDeep(JSON.parse(JSON.stringify(c)), {
                  parameters: { "profile-id": 2 },
                }),
              ] as RtpCodecCapability[];
            }
            break;
        }
        return [c];
      })
    );
}

export function getFilteredMediasoupRtpCapabilities2(): RtpCapabilities {
  const msRawCaps = mediasoup.getSupportedRtpCapabilities();

  const excludeMimeTypes: { [key: string]: boolean } = {
    "audio/CN": true,
    "audio/multiopus": true,
    "audio/SILK": true,
    "audio/telephone-event": true,
  };

  const msCaps: RtpCapabilities = {
    codecs: [],
    headerExtensions: msRawCaps.headerExtensions,
  };

  // Fill `Codecs`.
  for (const msRawCodec of msRawCaps.codecs!) {
    // Skip codecs unused for WebRTC with web browsers.
    // This prevents errors in mediasoup due to not enough available PayloadTypes.
    //
    // Note that WebRTC/SDP specs mandate that custom PayloadTypes must go from 96 to 127,
    // so only a total of 32 different PayloadTypes can be used.
    //
    // TODO: If mediasoup adds more codecs in the future, this maximum could be passed;
    // it might be a good idea to check for the array length and warn if that's the case.
    if (excludeMimeTypes[msRawCodec.mimeType]) {
      continue;
    }

    // Prevent errors from repeated PayloadTypes.
    msRawCodec.preferredPayloadType = undefined;

    // Add mandatory parameters that are missing by default.
    switch (msRawCodec.mimeType) {
      case "audio/opus":
        // Based on observed parameters from web browsers.
        if (msRawCodec.parameters?.minptime === undefined) {
          msRawCodec.parameters = { minptime: 10 };
        }
        if (msRawCodec.parameters?.useinbandfec === undefined) {
          msRawCodec.parameters = { useinbandfec: 1 };
        }
        msCaps.codecs!.push(msRawCodec);
        continue;

      case "video/H264":
        const packetizationModes = [0, 1];
        const profileLevelIds = [
          "42e01f", // "42e0" = Constrained Baseline.
          "42001f", // "4200" = Baseline.
          "4d001f", // "4d00" = Main.
          "64001f", // "6400" = High.
        ];
        for (const packetizationMode of packetizationModes) {
          for (const profileLevelId of profileLevelIds) {
            const newCodec: RtpCodecCapability = { ...msRawCodec };
            newCodec.parameters.packetizationMode = packetizationMode;
            newCodec.parameters.profileLevelId = profileLevelId;
            msCaps.codecs!.push(newCodec);
          }
        }
        continue;

      case "video/H264-SVC":
      case "video/H265":
        const svcPacketizationModes = [0, 1];
        for (const packetizationMode of svcPacketizationModes) {
          const newSvcCodec: RtpCodecCapability = { ...msRawCodec };
          newSvcCodec.parameters.packetizationMode = packetizationMode;
          msCaps.codecs!.push(newSvcCodec);
        }
        continue;

      case "video/VP9":
        const profileIds = [0, 2];
        for (const profileId of profileIds) {
          const newVp9Codec: RtpCodecCapability = { ...msRawCodec };
          if (!newVp9Codec.parameters) {
            newVp9Codec.parameters = {};
          }
          newVp9Codec.parameters.profileId = profileId;
          msCaps.codecs!.push(newVp9Codec);
        }
        continue;

      default:
        msCaps.codecs!.push(msRawCodec);
        continue;
    }
  }

  // Filter `HeaderExtensions`.
  // Remove the `urn:3gpp:video-orientation` extension so when rotating the
  // device, Chrome or Safari will encode already rotated video, instead of
  // simply indicating the video orientation in an RTP header extension.
  // Reason: unsupported by some of our intended consumers (Firefox, FFmpeg).
  msCaps.headerExtensions = msCaps.headerExtensions!.filter((msExt) => {
    return msExt.uri !== "urn:3gpp:video-orientation";
  });

  return msCaps;
}
