import Express from "express";

export interface ControllerInterface {
  getPath(): string;
  getRouter(): Express.Router;
}
