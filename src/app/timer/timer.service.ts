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

export interface Timer {
  start: number;
  stop?: number;
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

  public timersMeta$ = new Subject();
  public timersChanged$ = this.timersMeta$.asObservable();

  public calendarChangeSource = new Subject();
  public calendarChanged$ = this.calendarChangeSource.asObservable();

  public monthChangeSource = new Subject();
  public monthChanged$ = this.monthChangeSource.asObservable();

  constructor(
    private platform: Platform
  ) {
    console.log(`timer-service new`);
    this.platform.ready().then(() => {
      this.init();
    });
  }

  async addNew(name: string, color: string = 'transparent'): Promise<string> {
    console.log('Enter addNew');
    const id = name + new Date().getTime();
    const record = <TimerMetaRecord>{
      id: id,
      color: color,
      name: name
    };
    await this.stores.ids2meta.set(id, record);
    await this.stores.ids2pastTimers.set(id, []);
    this.ids2metaCache.push(record);
    this.timersMeta$.next(this.ids2metaCache);
    console.log('Leave addNew with id from new record', id, record);
    return id;
  }

  async deleteAll(): Promise<void> {
    const promises: Promise<any>[] = [];
    Object.keys(this.stores).forEach(store => {
      promises.push(this.stores[store].clear());
    });
    await Promise.all(promises);
    this.timersMeta$.next(this.ids2metaCache);
  }

  async _buildIds2metaCache() {
    this.ids2metaCache = [];
    await this.stores.ids2meta.forEach(meta => {
      this.ids2metaCache.push(meta);
    });
  }

  async init(): Promise<void> {
    await this._buildIds2metaCache();
    this.timersMeta$.next(this.ids2metaCache);
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
      console.log('CHECK ', id, timer.id, timer);
      return timer.id === id;
    });
    console.log('found id at index ', idx);
    return idx;
  }

  async _start(idx: number): Promise<void> {
    this.ids2metaCache[idx].start = new Date().getTime();
    console.log('Start ', idx, this.ids2metaCache[idx].id);
    await this.stores.ids2meta.set(this.ids2metaCache[idx].id, this.ids2metaCache[idx]);
    this.timersMeta$.next(this.ids2metaCache);
  }

  async _stop(idx: number): Promise<void> {
    console.log('Stop ', idx, this.ids2metaCache[idx].id);
    let pastRecord = await this.stores.ids2pastTimers.get(this.ids2metaCache[idx].id);
    pastRecord = pastRecord || [];
    pastRecord.push(<Timer>{
      start: this.ids2metaCache[idx].start,
      stop: new Date().getTime()
    });
    await this.stores.ids2pastTimers.set(this.ids2metaCache[idx].id, pastRecord);
    delete this.ids2metaCache[idx].start;
    await this.stores.ids2meta.set(this.ids2metaCache[idx].id, this.ids2metaCache[idx]),
      this.timersMeta$.next(this.ids2metaCache);
  }

  // async getAll(): Promise<{ [key: string]: Array<Timer> }> {
  //   const rv = {};
  //   await this.storage.forEach((val, key) => {
  //     rv[key] = val;
  //   });
  //   return rv;
  // }

  // async clear(name: string): Promise<void> {
  //   if (this.timerNames2starts.hasOwnProperty(name)) {
  //     delete this.timerNames2starts[name];
  //     this.storage.set(name, null);
  //     this.timersChangeSource.next(this.timerNames2starts);
  //   }
  // }

  // async updateCalendar() {
  //   const rv = {};
  //   const names2startStopArray = await this.getAll();
  //   Object.keys(names2startStopArray).forEach(name => {
  //     names2startStopArray[name].forEach(i => {
  //       const o = {
  //         start: new Date(i.start),
  //         stop: new Date(i.stop)
  //       };
  //       rv[o.start.getFullYear()] = rv[o.start.getFullYear()] || {};
  //       rv[o.start.getFullYear()][o.start.getMonth()] = rv[o.start.getFullYear()][o.start.getMonth()] || {};
  //       rv[o.start.getFullYear()][o.start.getMonth()][o.start.getDate()] =
  //         rv[o.start.getFullYear()][o.start.getMonth()][o.start.getDate()] || []; // {};
  //       // rv[o.start.getFullYear()][o.start.getMonth()][o.start.getDate()][o.start.getHours()] =
  //       //   rv[o.start.getFullYear()][o.start.getMonth()][o.start.getHours()] || [];

  //       rv[o.start.getFullYear()]
  //       [o.start.getMonth()]
  //       [o.start.getDate()]
  //         // [o.start.getHours()]
  //         .push({
  //           duration: i.stop - i.start,
  //           name: name,
  //           startTime: o.start.getHours(),
  //           stopDateTime: o.stop,
  //           dow: o.start.getDay()
  //         });
  //     });
  //   });

  //   this.calendarChangeSource.next(rv);
  // }

  // // Refactor db to index by date!
  // async updateMonth(startDate?: Date) {
  //   if (startDate === undefined) {
  //     startDate = new Date();
  //   }

  //   const rv = {};
  //   const startYear = startDate.getFullYear();
  //   const startMonth = startDate.getMonth();

  //   const names2startStopArray = await this.getAll();
  // }
}
