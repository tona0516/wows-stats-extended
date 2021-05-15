import { inject, injectable } from "tsyringe";
import Log4js from "log4js";
import LoggerInterface from "../../domain/repository/LoggerInterface";

@injectable()
export default class Logger implements LoggerInterface {
  logger: Log4js.Logger;

  constructor(@inject("LogLevel") level: string) {
    this.logger = Log4js.getLogger();
    this.logger.level = level;
  }

  debug(message: any, ...args: any[]) {
    args.push(getCallerMethod());
    this.logger.debug(message, args);
  }

  info(message: any, ...args: any[]) {
    args.push(getCallerMethod());
    this.logger.info(message, args);
  }

  warn(message: any, ...args: any[]) {
    args.push(getCallerMethod());
    this.logger.warn(message, args);
  }

  error(message: any, ...args: any[]) {
    args.push(getCallerMethod());
    this.logger.error(message, args);
  }

  fatal(message: any, ...args: any[]) {
    args.push(getCallerMethod());
    this.logger.fatal(message, args);
  }
}

function getCallerMethod(): string {
  const errorStack = new Error().stack;

  if (errorStack == undefined) {
    return "";
  }

  const regex = /(?<=\().*?(?=\))/gi;
  const callerMethodNames = errorStack.match(regex);

  if (!callerMethodNames) {
    return "";
  }

  if (callerMethodNames.length < 3) {
    return "";
  }

  return callerMethodNames[2];
}
