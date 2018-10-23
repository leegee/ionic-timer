import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Subject } from 'rxjs';

export interface TimerCalendar {
  [key: number]: { // year
    [key: number]: [ // zero-indexed months
      // zero-indexed days within zero-indexed weeks
      [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
      [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
      [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
      [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
      [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]]
    ]
  };
}

export interface TimerMetaRecord {
  id: string;
  name: string;
  color?: string;
  start?: number; // Date.getTime()
}

export interface TimerPastRecord {
  start: number; // Date().getTime()
  stop: number; // Date().getTime()
  parentId: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  static dbName = 'emit-draddog.db';
  public stores: { [key: string]: Storage } = {
    ids2pastTimers: new Storage({
      name: TimerService.dbName + '-ids2timers',
      storeName: 'ids2timers',
      driverOrder: ['indexeddb']
    }),
    ids2meta: new Storage({
      name: TimerService.dbName + '-ids2meta',
      storeName: 'ids2meta',
      driverOrder: ['indexeddb']
    })
  };

  public ids2metaCache: TimerMetaRecord[] = [];

  public timersMeta = new Subject();
  public timersMeta$ = this.timersMeta.asObservable();

  public calendar = new Subject();
  public calendar$ = this.calendar.asObservable();

  constructor(
    private platform: Platform
  ) {
    console.log(`timer-service new`);
    this.platform.ready().then(() => {
      this.init();
    });
  }

  async addNewTimer(name: string, color: string = 'transparent'): Promise<string> {
    const id = name + new Date().getTime();
    const record = <TimerMetaRecord>{
      id: id,
      color: color,
      name: name
    };
    await this.stores.ids2meta.set(id, record);
    this.ids2metaCache.push(record);
    this.timersMeta.next(this.ids2metaCache);
    return id;
  }

  async deleteAll(): Promise<void> {
    const promises: Promise<any>[] = [];
    Object.keys(this.stores).forEach(store => {
      promises.push(this.stores[store].clear());
    });
    await Promise.all(promises);
    this.ids2metaCache = [];
    this.timersMeta.next(this.ids2metaCache);
  }

  async _buildIds2metaCache() {
    this.ids2metaCache = [];
    console.log('loading... ');
    await this.stores.ids2meta.forEach(meta => {
      this.ids2metaCache.push(meta);
    });
  }

  async init(): Promise<void> {
    await this._buildIds2metaCache();
    this.timersMeta.next(this.ids2metaCache);
  }

  toggle(id: string): void {
    console.log('toggle', id);
    const idx = this.getMetaCacheIndexById(id);
    console.log('idx', idx, this.ids2metaCache[idx]);
    if (this.ids2metaCache[idx].start === undefined) {
      this._start(idx);
    } else {
      this._stop(idx);
    }
  }

  getMetaCacheIndexById(id) {
    const idx = this.ids2metaCache.findIndex(timer => {
      return timer.id === id;
    });
    return idx;
  }

  async _start(idx: number): Promise<void> {
    this.ids2metaCache[idx].start = new Date().getTime();
    console.log('Start ', idx, this.ids2metaCache[idx].id);
    await this.stores.ids2meta.set(this.ids2metaCache[idx].id, this.ids2metaCache[idx]);
    this.timersMeta.next(this.ids2metaCache);
  }

  async _stop(idx: number): Promise<void> {
    console.log('Stop ', idx, this.ids2metaCache[idx].id);
    await this.addNewPastRecord(this.ids2metaCache[idx].id, this.ids2metaCache[idx].start);
    delete this.ids2metaCache[idx].start;
    await this.stores.ids2meta.set(this.ids2metaCache[idx].id, this.ids2metaCache[idx]),
      this.timersMeta.next(this.ids2metaCache);
  }

  addNewPastRecord(parentId: string, start: number, stop = new Date().getTime()): Promise<void> {
    return this.stores.ids2pastTimers.set(start.toString(), <TimerPastRecord>{
      parentId: parentId,
      start: start,
      stop: stop
    });
  }

  async remove(id: string): Promise<void> {
    console.log('remove ', id);
    const promises: Promise<void>[] = [];
    promises.push(this.stores.ids2meta.remove(id));
    delete this.ids2metaCache[id];
    const done = this.stores.ids2pastTimers.forEach(record => {
      if (record.parentId === id) {
        console.log('remove ', record);
        promises.push(
          this.stores.ids2pastTimers.remove(record.start.toString())
        );
      }
    });
    promises.push(done);
    await Promise.all(promises);
    this.timersMeta.next(this.ids2metaCache);
  }

  // @param year The actual `fullYear` (ie 2018)
  // @param month Zero-based index of the month for `new Date`, January = 0
  getMonthOfPastRecords(year: number, month: number) {
    const rv: TimerCalendar = {
      [year]: {
        [month]: [
          [[], [], [], [], [], [], []],
          [[], [], [], [], [], [], []],
          [[], [], [], [], [], [], []],
          [[], [], [], [], [], [], []],
          [[], [], [], [], [], [], []]
        ]
      }
    };
    const targetMonth = new Date(year, month).getTime();
    const nextMonth = new Date(year, month + 1).getTime();
    const totalRecords = 0;

    this.stores.ids2pastTimers.forEach((record) => {
      if ((record.start >= targetMonth && record.start < nextMonth)
        || (record.stop >= targetMonth && record.stop < nextMonth)
      ) {
        const start = new Date(record.start);
        rv[year][month][this.zeroIndexedWeekInMonth(start)][start.getDay()].push(record);
        console.log('calendar - add');
      }
    }).then(() => {
      console.log('calendar.next');
      this.calendar.next({ calendar: rv, count: totalRecords });
    });
  }

  zeroIndexedWeekInMonth(date: Date): number {
    return Math.ceil((date.getDate() - date.getDay()) / 7);
  }
}
