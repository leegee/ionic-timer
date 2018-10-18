import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Subject } from 'rxjs';

export interface Timer {
  start: number;
  stop?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  static dbName = 'emit-draddog.db';
  private names: string[];
  public timerNames2starts: { [key: string]: number } = {};

  private changeSource = new Subject();
  public changeAnnounced$ = this.changeSource.asObservable();

  constructor(
    public storage: Storage,
    private platform: Platform
  ) {
    console.log(`timer-service new`);
    this.platform.ready().then(() => {
      this.connect();
    });
  }

  async connect(): Promise<void> {
    console.log('timer-service.connect');
    this.names = await this.storage.keys();
    const promises = [];
    this.names.forEach(async (name) => {
      const promise = this.storage.get(name).then(record => {
        if (record.length === 0 || record[record.length - 1].hasOwnProperty('stop')) {
          this.timerNames2starts[name] = undefined;
        } else {
          this.timerNames2starts[name] = record[record.length - 1].start;
        }
      });
      promises.push(promise);
    });

    await Promise.all(promises);
    this.changeSource.next(this.timerNames2starts);
  }

  async deleteAll(): Promise<void> {
    await this.storage.clear();
    this.changeSource.next(this.timerNames2starts);
  }

  toggle(name: string): void {
    console.log('toggle', name);
    if (this.timerNames2starts[name] === undefined) {
      this.start(name);
    } else {
      this.stop(name);
    }
  }

  async start(name: string): Promise<void> {
    console.log('start', name);
    if (!this.timerNames2starts.hasOwnProperty(name)) {
      throw new Error('No such timer as ' + name);
    }

    this.timerNames2starts[name] = new Date().getTime();
    const record = await this.storage.get(name);
    record.push({ start: this.timerNames2starts[name] });
    this.storage.set(name, record);
    this.changeSource.next(this.timerNames2starts);
  }

  async stop(name: string): Promise<void> {
    console.log('stop', name);
    const record = await this.storage.get(name);
    record[record.length - 1].stop = new Date().getTime();
    this.storage.set(name, record);
    this.timerNames2starts[name] = undefined;
    this.changeSource.next(this.timerNames2starts);
  }

  async getAll(): Promise<{ [key: string]: Array<Timer> }> {
    const rv = {};
    await this.storage.forEach((val, key) => {
      rv[key] = val;
    });
    return rv;
  }

  async clear(name: string): Promise<void> {
    if (this.timerNames2starts.hasOwnProperty(name)) {
      delete this.timerNames2starts[name];
      this.storage.set(name, null);
      this.changeSource.next(this.timerNames2starts);
    }
  }

  addNew(name: string, color: string = 'transparent'): void {
    if (this.timerNames2starts.hasOwnProperty(name)) {
      throw new Error('Timer already exists with name ' + name);
    }
    this.timerNames2starts[name] = undefined;
    this.storage.set(name, []);
    this.changeSource.next(this.timerNames2starts);
  }
}
