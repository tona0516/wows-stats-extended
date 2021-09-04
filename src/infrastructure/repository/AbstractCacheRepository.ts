import storage from "node-persist";

export abstract class AbstractCacheRepository<T> {
  protected abstract prefix: string;

  constructor() {
    void storage.init();
  }

  async get(gameVersion: string): Promise<T | undefined> {
    const cache = (await storage.getItem(`${this.prefix}_${gameVersion}`)) as
      | T
      | undefined;

    return cache;
  }

  async set(data: T, gameVersion: string): Promise<void> {
    await storage.setItem(`${this.prefix}_${gameVersion}`, data);
  }

  async deleteOld(): Promise<void> {
    const keys = (await storage.keys())
      .filter((it) => it.startsWith(this.prefix))
      .sort();
    keys.splice(-1, 1);
    keys.forEach((it) => {
      void (async () => {
        await storage.removeItem(it);
      })();
    });
  }
}
