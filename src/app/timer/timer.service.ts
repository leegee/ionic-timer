import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import * as d3Scale from 'd3-scale';
import * as d3Color from 'd3-color';
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
  [key: number /* year */]: {
    [key: number /* month */]: CalendarEmptyMonth
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
  // Mucc good: https://gka.github.io/palettes/#colors=lightyellow,orange,deeppink,darkred|steps=100|bez=1|coL=1
  // tslint:disable-next-line:max-line-length
  static colorScale = ['#ffffe0', '#fffddb', '#fffad7', '#fff7d1', '#fff5cd', '#fff2c8', '#fff0c4', '#ffedbf', '#ffebba', '#ffe9b7', '#ffe5b2', '#ffe3af', '#ffe0ab', '#ffdda7', '#ffdba4', '#ffd9a0', '#ffd69c', '#ffd399', '#ffd196', '#ffcd93', '#ffca90', '#ffc88d', '#ffc58a', '#ffc288', '#ffbf86', '#ffbd83', '#ffb981', '#ffb67f', '#ffb47d', '#ffb17b', '#ffad79', '#ffaa77', '#ffa775', '#ffa474', '#ffa172', '#ff9e70', '#ff9b6f', '#ff986e', '#ff956c', '#fe916b', '#fe8f6a', '#fd8b69', '#fc8868', '#fb8567', '#fa8266', '#f98065', '#f87d64', '#f77a63', '#f67862', '#f57562', '#f37261', '#f37060', '#f16c5f', '#f0695e', '#ee665d', '#ed645c', '#ec615b', '#ea5e5b', '#e85b59', '#e75859', '#e55658', '#e45356', '#e35056', '#e14d54', '#df4a53', '#dd4852', '#db4551', '#d9434f', '#d8404e', '#d53d4d', '#d43b4b', '#d2384a', '#cf3548', '#cd3346', '#cc3045', '#ca2e43', '#c72b42', '#c52940', '#c2263d', '#c0233c', '#be213a', '#bb1e37', '#ba1c35', '#b71933', '#b41731', '#b2152e', '#b0122c', '#ac1029', '#aa0e27', '#a70b24', '#a40921', '#a2071f', '#a0051c', '#9d0419', '#990215', '#970212', '#94010e', '#91000a', '#8e0006', '#8b0000'];

  static cachedForegroundColor: { [key: number]: string } = {};

  static colourRange = {
    min: 'white',
    max: 'steelblue'
  };

  public data: TimerCalendar = {};

  constructor() { }

  static fromTimerPastRecordList(timers: TimerPastRecord[]) {
    const self = new Calendar();
    timers.forEach(timer => {
      const start = new Date(timer.start);
      const year = start.getFullYear();
      const month = start.getMonth();
      self.data[year] = self.data[year] || {};
      self.data[year][month] = self.data[year][month] || Calendar.emptyMonth();
      self.data[year][month][Calendar.zeroIndexedWeekInMonth(start)][start.getDay()].push(timer);
    });

    return self;
  }

  // https://github.com/d3/d3-scale/blob/master/README.md#quantize-scales
  static getColorRange(datasetOrMax: number | number[]) {
    let minTemp = 0;
    let maxTemp: number;
    if (datasetOrMax instanceof Array) {
      minTemp = Math.min(...datasetOrMax);
      maxTemp = Math.max(...datasetOrMax);
    } else {
      maxTemp = datasetOrMax;
    }
    return d3Scale.scaleQuantize()
      .domain([minTemp, maxTemp])
      .range([Calendar.colourRange.min as any, Calendar.colourRange.max]);
  }

  static getForegroundColor(datasetOrMax: number | number[]): string {
    if ((!(datasetOrMax instanceof Array)) &&
      Calendar.cachedForegroundColor.hasOwnProperty(datasetOrMax as number)
    ) {
      return Calendar.cachedForegroundColor[datasetOrMax as number];
    }
    return d3Color.hsl(
      Calendar.getColorRange(datasetOrMax) as any
    ).l > 0.5 ? '#000' : '#fff';
  }

  static zeroIndexedWeekInMonth(date: Date): number {
    return Math.ceil((date.getDate() - date.getDay()) / 7);
  }

  static emptyMonth() {
    return [
      // tslint:disable:max-line-length
      [[] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[]],
      [[] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[]],
      [[] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[]],
      [[] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[]],
      [[] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[]]
      // tslint:enable:max-line-length
    ] as CalendarEmptyMonth;
  }

  getData(): TimerCalendar {
    return this.data;
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
    const calendar = Calendar.fromTimerPastRecordList(records);
    this.calendar.next({ calendar: calendar.getData() });
  }

  async getMonthOfPastRecords(date): Promise<void> {
    const year: number = date.getFullYear();
    const month: number = date.getMonth();
    const records = await this.recordsWithinRange(new Date(year, month), new Date(year, month + 1));
    const calendar = Calendar.fromTimerPastRecordList(records);
    this.calendar.next({ calendar: calendar.getData() });
  }

  async updateMeta(timer: TimerMetaRecord): Promise<void> {
    this.stores.ids2meta.set(timer.id, timer);
  }

  async delete(timer: TimerMetaRecord): Promise<void> {
    this.stores.ids2meta.remove(timer.id);
  }
}
