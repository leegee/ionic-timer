import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  static dbName = 'goddard-timer-db';
  private startTime: Date | undefined;

  constructor(public storage: Storage) { }

  start(): void {
    this.startTime = new Date();
  }

  async stop(): Promise<any> {
    await this.storage.ready();
    const done = this.storage.set(this.startTime.toISOString(), new Date().toISOString());
    this.startTime = undefined;
    return done;
  }

  async list(): Promise<any> {
    await this.storage.ready();
    const keys = await this.storage.keys();
    const times = {};
    keys.forEach(async key => {
      times[key] = await this.storage.get(key);
    })
    return keys;
  }

  async clear(): Promise<any> {
    await this.storage.ready();
    return this.storage.clear();
  }
}
