import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Subject } from 'rxjs';

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

export interface TimerCalendar {
  [key: number]: { // year
    [key: number]: CalendarEmptyMonth
  };
}

export type CalendarEmptyMonth = [
  // tslint:disable:max-line-length
  // zero-indexed days within zero-indexed weeks
  [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
  [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
  [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
  [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
  [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]]
  // tslint:enable:max-line-length
];

export class Calendar {
  public data: {
    [key: number]: { // year
      [key: number]: CalendarEmptyMonth;
    }
  } = {};

  constructor() { }

  static fromTimerPastRecordList(timers: TimerPastRecord[]) {
    const self = new Calendar();

    timers.forEach(timer => {
      const start = new Date(timer.start);
      self.data[start.getFullYear()] = self.data[start.getFullYear()] || {};
      self.data[start.getFullYear()][start.getMonth()] = self.data[start.getFullYear()][start.getMonth()] || self.emptyMonth();
      self.data[start.getFullYear()][start.getMonth()][Calendar.zeroIndexedWeekInMonth(start)][start.getDay()].push(timer);
    });

    return self;
  }

  static zeroIndexedWeekInMonth(date: Date): number {
    return Math.ceil((date.getDate() - date.getDay()) / 7);
  }

  emptyMonth() {
    return [
      // tslint:disable:max-line-length
      [ [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[] ],
      [ [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[] ],
      [ [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[] ],
      [ [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[] ],
      [ [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[] ]
      // tslint:enable:max-line-length
    ] as CalendarEmptyMonth;
  }
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
    console.log('Enter addNewTimer');
    const id = name + new Date().getTime();
    const record = <TimerMetaRecord>{
      id: id,
      color: color,
      name: name
    };
    await this.stores.ids2meta.set(id, record);
    this.ids2metaCache.push(record);
    this.timersMeta.next(this.ids2metaCache);
    console.log('Leave addNewTimer with %s', id);
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
    await this.stores.ids2meta.forEach(meta => {
      this.ids2metaCache.push(meta);
    });
  }

  async init(): Promise<void> {
    await this._buildIds2metaCache();
    this.timersMeta.next(this.ids2metaCache);
  }

  toggle(id: string): void {
    const idx = this._getMetaCacheIndexById(id);
    if (this.ids2metaCache[idx].start === undefined) {
      this._start(idx);
    } else {
      this._stop(idx);
    }
  }

  _getMetaCacheIndexById(id: string) {
    return this.ids2metaCache.findIndex(timer => {
      return timer.id === id;
    });
  }

  getMeta(id: string): TimerMetaRecord {
    const idx = this._getMetaCacheIndexById(id);
    return this.ids2metaCache[idx];
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

  async recordsWithinRange(from: Date, to: Date): Promise<TimerPastRecord[]> {
    const rv: TimerPastRecord[] = [];
    const fromTimestamp = from.getTime();
    const toTimestamp = to.getTime();
    await this.stores.ids2pastTimers.forEach((record: TimerPastRecord) => {
      if ((record.start >= fromTimestamp && record.start < toTimestamp)
        || (record.stop >= fromTimestamp && record.stop < toTimestamp)
      ) {
        rv.push(record);
      }
    });
    return rv;
  }

  async getDayOfPastRecords(year: number, month: number, day: number): Promise<void> {
    const records: TimerPastRecord[] = await this.recordsWithinRange(
      new Date(year, month, day),
      new Date(year, month, day, 23, 59, 59, 999)
    );
    const calendar = Calendar.fromTimerPastRecordList(records);
    this.calendar.next({ calendar: calendar });
  }

  async getMonthOfPastRecords(date): Promise<void> {
    const year: number = date.getFullYear();
    const month: number = date.getMonth();
    const calendar: TimerCalendar = {
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

    const records = await this.recordsWithinRange(new Date(year, month), new Date(year, month + 1));

    records.forEach(record => {
      const start = new Date(record.start);
      calendar[year][month][this.zeroIndexedWeekInMonth(start)][start.getDay()].push(record);
    });

    this.calendar.next({ calendar: calendar });
  }

  async updateMeta(timer: TimerMetaRecord): Promise<void> {
    this.stores.ids2meta.set(timer.id, timer);
  }

  async delete(timer: TimerMetaRecord): Promise<void> {
    this.stores.ids2meta.remove(timer.id);
  }

  zeroIndexedWeekInMonth(date: Date): number {
    return Math.ceil((date.getDate() - date.getDay()) / 7);
  }
}
