/**
 * This little service keeps an object in memory
 * synced with indexdb.
 */
import { Injectable, OnInit, Output } from '@angular/core';
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
export class TimerService implements OnInit {
  static dbName = 'emit-draddog.db';
  private names: string[];
  public connected = false;
  public timers: { [key: string]: Timer|undefined } = {};

  private changeSource = new Subject();
  public changeAnnounced$ = this.changeSource.asObservable();

  constructor(
    public storage: Storage,
    private platform: Platform
  ) {
    console.log(`timer-service new`);
  }

  ngOnInit() {
    console.log('timer-service.ngOnit');
    this.platform.ready().then(() => {
      this.connect();
    });
  }

  tailOf(record): Timer | undefined {
    return record.length > 0 ? record[record.length - 1] : undefined;
  }

  async connect(): Promise<void> {
    console.log('timer-service.connect');
    this.names = await this.storage.keys();
    const promises = [];
    this.names.forEach(async (name) => {
      const promise = this.storage.get(name).then(record => {
        this.timers[name] = this.tailOf(record);
      });
      promises.push(promise);
    });

    await Promise.all(promises);
    this.connected = true;
  }

  async deleteAll(): Promise<void> {
    await this.storage.clear();
    this.changeSource.next(this.timers);
  }

  toggle(name: string): void {
    console.log('toggle', name);
    if (this.timers[name] === undefined) {
      this.start(name);
    } else {
      this.stop(name);
    }
  }

  async start(name: string): Promise<void> {
    console.log('start', name);
    if (!this.timers.hasOwnProperty(name)) {
      throw new Error('No such timer as ' + name);
    }

    this.timers[name] = {
      start: new Date().getTime()
    };
    const record = await this.storage.get(name);
    record.push(this.timers[name]);
    this.storage.set(name, record);
    this.changeSource.next(this.timers);
  }

  async stop(name: string): Promise<void> {
    console.log('stop', name);
    const record = await this.storage.get(name);
    record[record.length - 1].stop = new Date().getTime();
    this.storage.set(name, record);
    this.timers[name] = undefined;
    this.changeSource.next(this.timers);
  }

  // getAll(): { [key: string]: Array<Timer> } {
  //   return this.timers;
  // }

  async clear(name: string): Promise<void> {
    if (this.timers.hasOwnProperty(name)) {
      delete  this.timers[name];
      this.storage.set(name, null);
      this.changeSource.next(this.timers);
    }
  }

  addNew(name: string, color: string = 'transparent'): void {
    if (this.timers.hasOwnProperty(name)) {
      throw new Error('Timer already exists with name ' + name);
    }
    this.timers[name] = undefined;
    this.storage.set(name, []);
    this.changeSource.next(this.timers);
  }
}
