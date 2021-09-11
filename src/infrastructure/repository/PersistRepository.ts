import storage from "node-persist";
import { injectable } from "tsyringe";

@injectable()
export class PersistRepository<T> {
  constructor() {
    void storage.init();
  }

  async set(key: string, value: T): Promise<void> {
    await storage.setItem(key, value);
  }

  async get(key: string): Promise<T | undefined> {
    return (await storage.getItem(key)) as T | undefined;
  }
}
