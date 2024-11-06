import dotenv from "dotenv";

dotenv.config();

const IS_HTTPS = process.env.HTTPS === "true";
const PORT = process.env.PORT || 3000;
const RTC_MIN_PORT = process.env.MEDIASOUP_RTC_MIN_PORT || 40000;
const RTC_MAX_PORT = process.env.MEDIASOUP_RTC_MAX_PORT || 65535;
const ANNOUNCED_IP = process.env.MEDIASOUP_ANNOUNCED_IP || "127.0.0.1";

export const CONFIG = {
  IS_HTTPS,
  PORT,
  RTC_MIN_PORT,
  RTC_MAX_PORT,
  ANNOUNCED_IP,
};
