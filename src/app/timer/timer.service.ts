import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ReplaySubject } from 'rxjs';
import { Logger, LoggingService } from 'ionic-logging-service';
import { Calendar } from '../Calendar';

export interface TimerMetaRecord {
  id: string;
  name: string;
  oppositeId?: string; // TimerMetaRecord.id
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

  private logger: Logger;

  public ids2metaCache: TimerMetaRecord[] = [];

  public timersMeta = new ReplaySubject();
  public timersMeta$ = this.timersMeta.asObservable();

  public calendar = new ReplaySubject();
  public calendar$ = this.calendar.asObservable();

  constructor(
    private platform: Platform,
    loggingService: LoggingService
  ) {
    this.logger = loggingService.getLogger('TimerService');
    this.logger.trace(`timer-service new`);
    this.platform.ready().then(() => {
      this.init();
    });
  }

  async init(): Promise<void> {
    this.logger.entry('init');
    await this._buildIds2metaCache();
    this.timersMeta.next(this.ids2metaCache);
    this.logger.exit('init', this.ids2metaCache);
  }

  /**
   * 
   * @param args {object}
   * @param args.name {string}
   * @param args.oppositeId {string}
   * @param args.color {string}
   * @returns Promise<string> the ID of the created record
   */
  async addNewTimer(args: {
    name: string,
    oppositeId: string,
    color: string
  }): Promise<string> {
    this.logger.entry('addNewTimer', args);
    if (typeof args !== 'object') {
      throw new TypeError('Expected args object but got ' + typeof args);
    }
    if (!args.name) {
      throw new TypeError('No name arg supplied');
    }
    const id = args.name + new Date().getTime();
    this.logger.debug('set id to ', id);
    const record = <TimerMetaRecord>{
      id: id,
      oppositeId: args.oppositeId,
      color: args.color,
      name: args.name
    };

    await this.stores.ids2meta.set(id, record);
    this.ids2metaCache.push(record);

    if (args.oppositeId) {
      this.logger.debug('Has an oppositeId', record.oppositeId);
      await this.updateMeta(args.oppositeId, {
        oppositeId: id
      });
    } else {
      this.timersMeta.next(this.ids2metaCache);
    }

    this.logger.exit('addNewTimer');
    return id;
  }

  /**
   * Update a record in the store using fields supplied in `partialRecord`.
   * @param id {string} `id` of the meta record to update
   * @param partialRecord {object} Field-to-value mapping to update. Other fields are untouched.
   */
  async updateMeta(id: string, partialRecord: {}) {
    this.logger.entry('updateMeta', id, partialRecord);
    const subject = this.ids2metaCache.find(record => record.id === id);
    const newRecord = Object.assign(subject, partialRecord);
    this.logger.debug('created newRecord', newRecord);
    await this.stores.ids2meta.set(subject.id, newRecord);
    this.updateIds2metaCache(newRecord);
    this.timersMeta.next(this.ids2metaCache);
    this.logger.exit('updateMeta');
  }

  /**
   * @param newRecord The record to update, identified by its `id`
   */
  updateIds2metaCache(newRecord: TimerMetaRecord) {
    this.logger.entry('updateIds2metaCache', newRecord);
    this.ids2metaCache = this.ids2metaCache.map(record => {
      this.logger.debug(record.id, 'vs', newRecord.id);
      return record.id === newRecord.id ? newRecord : record;
    });
    this.logger.exit('updateIds2metaCache', this.ids2metaCache);
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

  /**
   * Returns a list of meta records.
   */
  allMeta(): TimerMetaRecord[] {
    return this.ids2metaCache;
  }

  /**
   * Returns a mapping of meta records by `id` to content.
   */
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
      if (this.ids2metaCache[idx].oppositeId) {
        this._stop(
          this._getMetaCacheIndexById(this.ids2metaCache[idx].oppositeId)
        );
      }
    } else {
      this._stop(idx);
      if (this.ids2metaCache[idx].oppositeId) {
        this._start(
          this._getMetaCacheIndexById(this.ids2metaCache[idx].oppositeId)
        );
      }
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
    this.logger.entry('_stop');
    const promises: Promise<void>[] = [];
    const stopTimestamp = new Date().getTime();
    const date = new Date(this.ids2metaCache[idx].start);

    if (this.ids2metaCache[idx].start) {
      do {
        promises.push(
          this.addNewPastRecord(this.ids2metaCache[idx].id, this.ids2metaCache[idx].start, stopTimestamp)
        );
        date.setDate(date.getDate() + 1);
      } while (
        date.getTime() < stopTimestamp
      );
      delete this.ids2metaCache[idx].start;
    }

    this.logger.debug('set meta record:', this.ids2metaCache[idx].id, this.ids2metaCache[idx]);
    promises.push(
      this.stores.ids2meta.set(this.ids2metaCache[idx].id, this.ids2metaCache[idx])
    );

    await Promise.all(promises);
    this.timersMeta.next(this.ids2metaCache);
    this.logger.exit('_stop');
  }

  addNewPastRecord(parentId: string, start: number, stop = new Date().getTime()): Promise<void> {
    this.logger.entry('addNewPastRecord', parentId, start, stop);
    return this.stores.ids2pastTimers.set(start.toString(), <TimerPastRecord>{
      parentId: parentId,
      start: start,
      stop: stop
    });
  }

  async remove(id: string): Promise<void> {
    this.logger.entry('remove ', id);
    const promises: Promise<void>[] = [];
    promises.push(this.stores.ids2meta.remove(id));
    delete this.ids2metaCache[id];
    const done = this.stores.ids2pastTimers.forEach(record => {
      if (record.parentId === id) {
        this.logger.debug('remove parentId in ', record);
        promises.push(
          this.stores.ids2pastTimers.remove(record.start.toString())
        );
      }
    });
    promises.push(done);

    // remove all oppositeIds
    this.ids2metaCache.forEach(record => {
      if (record.oppositeId === id) {
        promises.push( this.updateMeta(record.id, { oppositeId: null }) );
      }
    });

    await Promise.all(promises);
    this.timersMeta.next(this.ids2metaCache);
    this.logger.exit('remove');
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

  async getMonthOfPastRecords(date: Date): Promise<void> {
    const year: number = date.getFullYear();
    const month: number = date.getMonth();
    const records = await this.recordsWithinRange(new Date(year, month), new Date(year, month + 1));
    const calendar: Calendar = Calendar.fromTimerPastRecordList(records);
    this.calendar.next(calendar);
  }

  async resetMetaRecord(timer: TimerMetaRecord): Promise<void> {
    this.logger.entry(`resetMetaRecord`, timer);
    this.stores.ids2meta.set(timer.id, timer);
    if (timer.oppositeId) {
      this.logger.debug('Has an oppositeId', timer.oppositeId);
      await this.updateMeta(timer.oppositeId, {
        oppositeId: timer.id
      });
    }
    await this._buildIds2metaCache();
    this.logger.exit(`resetMetaRecord`);
    this.timersMeta.next(this.ids2metaCache);
  }

  async delete(timer: TimerMetaRecord): Promise<void> {
    this.stores.ids2meta.remove(timer.id);
    await this._buildIds2metaCache();
    this.timersMeta.next(this.ids2metaCache);
  }
}
