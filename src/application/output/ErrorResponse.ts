export class ErrorResponse implements Error {
  name: string;
  message: string;
  statusCode: number;

  constructor(name: string, message: string, statusCode: number) {
    this.name = name;
    this.message = message;
    this.statusCode = statusCode;
  }

  toJSON(): string {
    return JSON.stringify({
      error: {
        name: this.name,
        message: this.message,
      },
    });
  }
}

export const ErrorResponseType = {
  invalidTempArenaInfo: new ErrorResponse(
    "INVALID_TEMP_ARENA_INFO",
    "TempArenaInfo.json is invalid.",
    400
  ),
  notFoundRegion: new ErrorResponse(
    "NOT_FOUND_REGION",
    "reigon is not found in user setting.",
    500
  ),
  notFoundAppid: new ErrorResponse(
    "NOT_FOUND_APPID",
    "appid is not found in user setting.",
    500
  ),
  notFoundInstallPath: new ErrorResponse(
    "NOT_FOUND_INSTALL_PATH",
    "install path is not found in user setting.",
    500
  ),
  invalidConfigureInput: new ErrorResponse(
    "INVALID_CONFIGURE_INPUT",
    "configure input can not convert model.",
    500
  ),
};
