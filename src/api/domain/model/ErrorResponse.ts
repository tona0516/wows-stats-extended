export default class ErrorResponse implements Error {
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
  notFoundTempArenaInfo: new ErrorResponse(
    "NOT_FOUND_TEMP_ARENA_INFO",
    "TempArenaInfo.json is not found.",
    400
  ),
  invalidTempArenaInfo: new ErrorResponse(
    "INVALID_TEMP_ARENA_INFO",
    "TempArenaInfo.json is invalid.",
    400
  ),
};
