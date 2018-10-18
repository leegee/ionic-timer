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
  public timers: { [key: string]: Timer[] } = {};

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

  async connect(): Promise<void> {
    console.log('timer-service.connect');
    this.names = await this.storage.keys();
    const promises = [];
    this.names.forEach(async (name) => {
      const promise = this.storage.get(name).then(record => {
        this.timers[name] = record;
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
    if (this.timers[name] && this.timers[name].length > 0
      && this.timers[name][this.timers[name].length - 1].hasOwnProperty('start')
    ) {
      this.stop(name);
    } else {
      this.start(name);
    }
  }

  async start(name: string): Promise<void> {
    console.log('start', name);
    if (!this.timers.hasOwnProperty(name)) {
      throw new Error('No such timer as ' + name);
    }

    this.timers[name].push({
      start: new Date().getTime()
    });
    this.storage.set(name, this.timers[name]);
    this.changeSource.next(this.timers);
  }

  async stop(name: string): Promise<void> {
    console.log('stop', name);
    this.timers[name][
      this.timers[name].length - 1
    ].stop = new Date().getTime();
    this.storage.set(name, this.timers[name]);
    this.changeSource.next(this.timers);
  }

  getAll(): { [key: string]: Array<Timer> } {
    return this.timers;
  }

  async clear(name: string): Promise<void> {
    if (this.timers.hasOwnProperty(name)) {
      this.timers[name] = [];
      this.storage.set(name, null);
      this.changeSource.next(this.timers);
    }
  }

  addNew(name: string, color: string = 'transparent'): void {
    if (this.timers.hasOwnProperty(name)) {
      throw new Error('Timer already exists with name ' + name);
    }
    this.timers[name] = [];
    this.storage.set(name, []);
    this.changeSource.next(this.timers);
  }
}
