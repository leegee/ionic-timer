import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ReplaySubject } from 'rxjs';
import { Calendar } from '../Calendar';

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

  public timersMeta = new ReplaySubject();
  public timersMeta$ = this.timersMeta.asObservable();

  public calendar = new ReplaySubject();
  public calendar$ = this.calendar.asObservable();

  constructor(
    private platform: Platform
  ) {
    console.log(`timer-service new`);
    this.platform.ready().then(() => {
      this.init();
    });
  }

  async init(): Promise<void> {
    console.log(`timer-service init`);
    await this._buildIds2metaCache();
    console.log('timer-service init has ', this.ids2metaCache);
    this.timersMeta.next(this.ids2metaCache);
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

  id2name(id: string): string {
    const record = this.ids2metaCache.find(r => {
      return r.id === id;
    });
    return record ? record.name : null;
  }

  allMetaById(): { [key: string]: TimerMetaRecord } {
    return this.ids2metaCache.reduce((map, i) => {
      map[i.id] = i;
      return map;
    }, {});
  }

  async _buildIds2metaCache() {
    this.ids2metaCache = [];
    await this.stores.ids2meta.forEach(meta => {
      this.ids2metaCache.push(meta);
    });
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
    await this.stores.ids2meta.set(this.ids2metaCache[idx].id, this.ids2metaCache[idx]);
    this.timersMeta.next(this.ids2metaCache);
  }

  async _stop(idx: number): Promise<void> {
    const promises: Promise<void>[] = [];
    const stopTimestamp = new Date().getTime();
    const date = new Date(this.ids2metaCache[idx].start);

    do {
      promises.push(
        this.addNewPastRecord(this.ids2metaCache[idx].id, this.ids2metaCache[idx].start, stopTimestamp)
      );
      date.setDate(date.getDate() + 1);
    } while (
      date.getTime() < stopTimestamp
    );

    delete this.ids2metaCache[idx].start;
    promises.push(
      this.stores.ids2meta.set(this.ids2metaCache[idx].id, this.ids2metaCache[idx])
    );

    await Promise.all(promises);
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
    const calendar: Calendar = Calendar.fromTimerPastRecordList(records);
    this.calendar.next(calendar);
  }

  async getMonthOfPastRecords(date): Promise<void> {
    const year: number = date.getFullYear();
    const month: number = date.getMonth();
    const records = await this.recordsWithinRange(new Date(year, month), new Date(year, month + 1));
    const calendar: Calendar = Calendar.fromTimerPastRecordList(records);
    this.calendar.next(calendar);
  }

  async updateMeta(timer: TimerMetaRecord): Promise<void> {
    this.stores.ids2meta.set(timer.id, timer);
    this.timersMeta.next(this.ids2metaCache);
  }

  async delete(timer: TimerMetaRecord): Promise<void> {
    this.stores.ids2meta.remove(timer.id);
    this.timersMeta.next(this.ids2metaCache);
  }
}
