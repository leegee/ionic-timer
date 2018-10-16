import { Injectable, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { createEmptyStateSnapshot } from '@angular/router/src/router_state';

class Timer {
  name: string;
  start: number;
  stop: number;

  constructor(name: string) {
    this.name = name;
    this.start = new Date().getTime();
  }

  stopNow() {
    this.stop = new Date().getTime();
  }
}

@Injectable({
  providedIn: 'root'
})
export class TimerService implements OnInit {
  static dbName = 'goddard-time.db';
  private names: string[];
  public timers: { [key: string]: Timer[] } = {};
  // timers$: Observable<Timer[]>;

  constructor(
    public storage: Storage,
    private platform: Platform
  ) {
  }

  async ngOnInit() {
    await this.platform.ready();
    await this.connect();
  }

  async connect(): Promise<void> {
    this.names = await this.storage.keys();
    const promises = [];
    this.names.forEach(async (name) => {
      const promise = this.storage.get(name).then(record => {
        this.timers[name] = record;
      });
      promises.push(promise);
    });

    await Promise.all(promises);
  }

  async start(name: string): Promise<void> {
    if (!this.timers.hasOwnProperty(name)) {
      throw new Error('No such timer as ' + name);
    }
    this.timers[name].push(new Timer(name));
  }

  async stop(name: string): Promise<void> {
    this.timers[name][
      this.timers[name].length - 1
    ].stopNow();
  }

  async list(): Promise<{ [key: string]: Array<Timer> }> {
    return this.timers;
  }

  async clear(name: string): Promise<void> {
    if (this.timers.hasOwnProperty(name)) {
      this.timers[name] = [];
      this.storage.set(name, null);
    }
  }

  addNew(name: string, color: string = 'transparent'): void {
    if (this.timers.hasOwnProperty(name)) {
      throw new Error('Timer already exists with name ' + name);
    }
    this.timers[name] = [];
    this.storage.set(name, []);
  }
}
