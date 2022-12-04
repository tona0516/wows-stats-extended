/* eslint-disable */

import { inject, singleton } from "tsyringe";
import Log4js from "log4js";
import { ILogger } from "../../application/interface/ILogger";

@singleton()
export class Logger implements ILogger {
  logger: Log4js.Logger;

  constructor(@inject("LogLevel") level: string) {
    this.logger = Log4js.getLogger();
    this.logger.level = level;
  }

  debug(message: string, ...args: any[]): void {
    args.push(this.getCallerMethod());
    this.logger.debug(message, args);
  }

  info(message: string, ...args: any[]): void {
    args.push(this.getCallerMethod());
    this.logger.info(message, args);
  }

  warn(message: string, ...args: any[]): void {
    args.push(this.getCallerMethod());
    this.logger.warn(message, args);
  }

  error(message: string, ...args: any[]): void {
    args.push(this.getCallerMethod());
    this.logger.error(message, args);
  }

  fatal(message: string, ...args: any[]): void {
    args.push(this.getCallerMethod());
    this.logger.fatal(message, args);
  }

  private getCallerMethod(): string | undefined {
    const errorStack = new Error().stack;

    if (errorStack == undefined) {
      return undefined;
    }

    const regex = /(?<=\().*?(?=\))/gi;
    const callerMethodNames = errorStack.match(regex);

    if (!callerMethodNames) {
      return undefined;
    }

    if (callerMethodNames.length < 3) {
      return undefined;
    }

    return callerMethodNames[2];
  }
}
