import { TestBed, inject } from '@angular/core/testing';

import { TimerService, TimerMetaRecord } from './timer.service';
import { IonicStorageModule } from '@ionic/storage';
import { Platform } from '@ionic/angular';

const loadFixtures = async (service) => {
  await service.deleteAll();
  const totalTimers = 5;
  const totalEntries = 10;
  const ids = [];
  let promises = [];
  for (let id = 0; id < totalTimers; id++) {
    ids.push('test-' + id);
    promises.push(service.addNew(ids[ids.length - 1]));
  }
  await Promise.all(promises);

  promises = [];
  ids.forEach(id => {
    const record = [];
    for (let i = 1; i <= totalEntries; i++) {
      record.push({
        start: new Date().getTime() - (i * 3600),
        stop: new Date().getTime() - (i * 3600) + 120
      });
      promises.push(service.stores.ids2pastTimers.set(record));
    }
  });

  await Promise.all(promises);
};

describe('TimerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicStorageModule.forRoot({
          driverOrder: ['indexeddb']
        }),
      ],
      providers: [
        Platform,
        TimerService
      ]
    });
  });

  it('should be created', inject([TimerService], (service: TimerService) => {
    expect(service).toBeTruthy();
  }));

  it('should init', inject([TimerService], async (service: TimerService) => {
    const p = service.init();
    expect(p instanceof Promise).toBe(true);
    await p;
  }));

  it('should have no records after deleteAll', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    Object.keys(service.stores).forEach(async (storeName) => {
      const len = await service.stores[storeName].length();
      expect(len).toEqual(0);
    });
  }));

  it('should emit a list when db empty', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    service.timersMeta.subscribe((changed: TimerMetaRecord[]) => {
      expect(changed instanceof Array).toBe(true);
      expect(changed.length).toBe(0);
    });
    await service.init();
  }));

  it('should create records with addNew', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    const testName = 'test-name';
    const id = await service.addNew(testName);
    const ids = await service.stores.ids2meta.keys();
    expect(ids.length).toEqual(1);
    expect(ids[0]).toEqual(id);
    const ids2MetaEntry = await service.stores.ids2meta.get(ids[0]);
    expect(ids2MetaEntry).toBeDefined();
    expect(ids2MetaEntry.id).toBe(ids[0]);
    expect(ids2MetaEntry.name).toBe(testName);
  }));

  it('should init with records if they exist', inject([TimerService], async (service: TimerService) => {
    const testName = 'another-test-name';
    let id;
    await service.deleteAll();
    service.timersMeta.subscribe((changed: TimerMetaRecord[]) => {
      expect(changed.length).toBe(1);
      expect(changed[0].id).toBe(id);
    });
    id = await service.addNew(testName);
    await service.init();
  }));

  it('timersIndexById', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    const id0 = await service.addNew('test1');
    const id1 = await service.addNew('test2');
    const id2 = await service.addNew('test3');
    await service._buildIds2metaCache();
    expect(service.getMetaCacheIndexById(id0)).toBe(0);
    expect(service.getMetaCacheIndexById(id1)).toBe(1);
    expect(service.getMetaCacheIndexById(id2)).toBe(2);
  }));

  it('records start time and no past time when not stopped', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    const id = await service.addNew('test');
    expect(service.getMetaCacheIndexById(id)).toBe(0);
    await service._start(0);
    const metaRecord = await service.stores.ids2meta.get(id);
    expect(metaRecord.start).toBeDefined();
    const pastRecord = await service.stores.ids2pastTimers.get(id);
    expect(pastRecord).toBeNull();
  }));

  it('once stopped, records no meta start time, but does have  past times', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    const id = await service.addNew('test');
    expect(service.getMetaCacheIndexById(id)).toBe(0);
    await service._start(0);
    await service._stop(0);
    const metaRecord = await service.stores.ids2meta.get(id);
    expect(metaRecord.hasOwnProperty('start')).toBe(false);
    const pastRecords = await service.stores.ids2pastTimers.get(id);
    expect(pastRecords).not.toBeNull();
    expect(pastRecords instanceof Array).toBe(true);
    const pastRecord = pastRecords[0];
    expect(pastRecord).not.toBeNull();
    expect(pastRecord.start).toBeDefined();
    expect(pastRecord.stop).toBeDefined();
    expect(pastRecord.start).toMatch(/^\d+$/);
    expect(pastRecord.stop).toMatch(/^\d+$/);
    expect(pastRecord.stop - pastRecord.start).toBeGreaterThan(0);
  }));

  it('removes a record', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    const id = await service.addNew('test');
    await service._start(0);
    await service._stop(0);
    await service.remove(id);
    const metaLength = await service.stores.ids2meta.length();
    expect(metaLength).toEqual(0);
    const timersLength = await service.stores.ids2pastTimers.length();
    expect(timersLength).toEqual(0);
  }));

  it('should get a month of data', inject([TimerService], async (service: TimerService) => {
    loadFixtures(service);
    const month = await service.getMonth(new Date().getFullYear(), new Date().getMonth());
    expect(month).toBeTruthy();
  }));
});
