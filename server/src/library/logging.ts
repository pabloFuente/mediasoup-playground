import winston, { format } from "winston";

export const Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        format.align(),
        format.splat(),
        format.errors({ stack: true }),
        format.printf((meta: winston.Logform.TransformableInfo) => {
          const { level, message, timestamp, stack, ...restMeta } = meta;
          const stackMessage = stack ? `\n${stack}` : "";
          const otherMetaMessage =
            Object.keys(restMeta).length > 0
              ? `\n${JSON.stringify(restMeta)}`
              : "";
          return `${timestamp} ${level}: ${message} ${otherMetaMessage}${stackMessage}`;
        }),
      ),
    }),
  ],
});
