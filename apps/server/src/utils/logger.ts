import morgan, { type StreamOptions } from "morgan";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import type Transport from "winston-transport";

const { combine, timestamp, json } = format;

const errorFilter = format((info) => (info.level === "error" ? info : false));
const infoFilter = format((info) => (info.level === "info" ? info : false));
const httpFilter = format((info) => (info.level === "http" ? info : false));

const getInfoLoggerTransport = () =>
	new DailyRotateFile({
		filename: "logs/info-%DATE%.log",
		datePattern: "HH-DD-MM-YYYY",
		zippedArchive: true,
		maxSize: "10m",
		maxFiles: "14d",
		level: "info",
		format: format.combine(infoFilter(), format.timestamp(), json()),
	});

const getErrorLoggerTransport = () =>
	new DailyRotateFile({
		filename: "logs/error-%DATE%.log",
		datePattern: "HH-DD-MM-YYYY",
		zippedArchive: true,
		maxSize: "10m",
		maxFiles: "14d",
		level: "error",
		format: format.combine(errorFilter(), format.timestamp(), json()),
	});

const getHttpLoggerTransport = () =>
	new DailyRotateFile({
		filename: "logs/http-%DATE%.log",
		datePattern: "HH-DD-MM-YYYY",
		zippedArchive: true,
		maxSize: "10m",
		maxFiles: "14d",
		level: "http",
		format: format.combine(httpFilter(), format.timestamp(), json()),
	});

const getInstance = (service = "general-purpose") => {
	const loggerTransports: Transport[] = [
		new transports.Console(),
		getHttpLoggerTransport(),
		getInfoLoggerTransport(),
		getErrorLoggerTransport(),
	];


	const logger = createLogger({
		defaultMeta: { service },
		format: combine(
			timestamp(),
			json(),
			format.printf(
				(info) => `${info.timestamp} ${info.level}: ${info.message}`
			)
		),
		transports: loggerTransports,
	});

	if (env.NODE_ENV !== "production") {
		logger.add(
			new transports.Console({
				format: format.combine(format.colorize(), format.simple()),
			})
		);
	}

	return logger;
};

const getHttpLoggerInstance = () => {
	const logger = getInstance();

	const stream: StreamOptions = {
		write: (message: string) => logger.http(message.trim()),
	};

	const skip = () => env.NODE_ENV !== "development";

	return morgan(
		":remote-addr :method :url :status :res[content-length] - :response-time ms :user-agent",
		{ stream, skip }
	);
};

export const Logger = {
	getInstance,
	getHttpLoggerInstance,
};

export type { Logger as WinstonLogger } from "winston";
export const logger = Logger.getInstance()