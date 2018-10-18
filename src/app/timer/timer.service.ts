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
  static dbName = 'goddard-time.db';
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

  latestTimer(name: string): Object {
    return this.timers[name][
      this.timers[name].length - 1
    ];
  }

  toggle(name: string): void {
    console.log('toggle', name);
    const latestTimer = this.latestTimer(name);
    console.log('latestTimer ', latestTimer);
    if (latestTimer.hasOwnProperty('stop')) {
      this.stop(name);
    } else {
      this.start(name);
    }
  }

  async start(name: string): Promise<void> {
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
