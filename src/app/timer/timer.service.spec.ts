import { TestBed, inject } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TimerService, TimerMetaRecord, TimerPastRecord, Calendar, TimerCalendar } from './timer.service';
import { IonicStorageModule } from '@ionic/storage';
import { Platform } from '@ionic/angular';

const totalTimers = 5;
const totalEntries = 10;

const loadFixtures = async (service) => {
  await service.deleteAll();
  const ids = [];
  const promises = [];
  for (let id = 0; id < totalTimers; id++) {
    ids.push('test-' + id);
    promises.push(
      service.addNewTimer(ids[ids.length - 1])
    );
  }

  ids.forEach(id => {
    for (let i = 0; i < totalEntries; i++) {
      const start = new Date(
        new Date().getFullYear(), new Date().getMonth()
      ).getTime();
      promises.push(
        service.addNewPastRecord(
          id, start + (i * 3600) + (new Date().getSeconds() * 60) + new Date().getMilliseconds() + (Math.random() * 10),
          new Date().getTime() + ((i + 1) * 3600)
        )
      );
    }
  });

  await Promise.all(promises);
  return promises.length;
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
    const id = await service.addNewTimer(testName);
    const ids = await service.stores.ids2meta.keys();
    expect(ids.length).toEqual(1);
    expect(ids[0]).toEqual(id);
    const ids2MetaEntry = await service.stores.ids2meta.get(ids[0]);
    expect(ids2MetaEntry).toBeDefined();
    expect(ids2MetaEntry.id).toBe(ids[0]);
    expect(ids2MetaEntry.name).toBe(testName);
  }));

  it('should init with records if they exist', inject([TimerService], async (service: TimerService) => {
    await loadFixtures(service);
    await service.deleteAll();
    const testName = 'another-test-name';
    const id = await service.addNewTimer(testName);
    service.timersMeta.subscribe((changed: TimerMetaRecord[]) => {
      expect(changed.length).toBe(1);
      expect(changed[0].id).toBe(id);
    });
    await service.init();
  }));

  it('timersIndexById', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    const id0 = await service.addNewTimer('test1');
    const id1 = await service.addNewTimer('test2');
    const id2 = await service.addNewTimer('test3');
    await service._buildIds2metaCache();
    expect(service._getMetaCacheIndexById(id0)).toBe(0);
    expect(service._getMetaCacheIndexById(id1)).toBe(1);
    expect(service._getMetaCacheIndexById(id2)).toBe(2);
  }));

  it('removes a record', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    const id = await service.addNewTimer('test');
    await service._start(0);
    await service._stop(0);
    await service.remove(id);
    const metaLength = await service.stores.ids2meta.length();
    expect(metaLength).toEqual(0);
    const timersLength = await service.stores.ids2pastTimers.length();
    expect(timersLength).toEqual(0);
  }));

  it('should get a month of data', inject([TimerService], async (service: TimerService) => {
    await loadFixtures(service);
    const date = new Date();
    let calls = 0;
    service.calendar.subscribe((changed: { calendar: TimerPastRecord[], count: number }) => {
      calls++;
      expect(changed.calendar instanceof Array).toBe(false);
      expect(changed.calendar[date.getFullYear()]).toBeDefined();
      expect(changed.calendar[date.getFullYear()][date.getMonth()]).toBeDefined();
      expect(changed.calendar[date.getFullYear()][date.getMonth()] instanceof Array).toBe(true);
      expect(changed.calendar[date.getFullYear()][date.getMonth()].length).toBe(5); // five weeks
      for (let week = 0; week < 5; week++) {
        expect(changed.calendar[date.getFullYear()][date.getMonth()][week].length).toBe(7); // five weeks
        for (let day = 0; day < 7; day++) {
          expect(changed.calendar[date.getFullYear()][date.getMonth()][week][day] instanceof Array).toBe(true); // days are arrays
        }
      }
      expect(changed.calendar[date.getFullYear()][date.getMonth()][0][1].length).toBe(totalTimers * totalEntries);
    });
    await service.getMonthOfPastRecords(new Date());
  }));

  it('should create a calendar for a month', inject([TimerService], async (service: TimerService) => {
    const date = new Date(2018, 0, 5);
    const fixtureRecords: TimerPastRecord[] = [
      { start: date.getTime() - 3600, stop: date.getTime(), parentId: null },
      { start: date.getTime() - 2600, stop: date.getTime(), parentId: null },
      { start: date.getTime() - 1600, stop: date.getTime(), parentId: null }
    ];
    const cal = Calendar.fromTimerPastRecordList(fixtureRecords);
    expect(cal instanceof Calendar).toBe(true);
    expect(cal.data.hasOwnProperty(2018)).toBe(true);
    expect(cal.data[2018].hasOwnProperty(0)).toBe(true);
    expect(cal.data[2018][0] instanceof Array).toBe(true);
    expect(cal.data[2018][0].length).toBe(5);
    expect(cal.data[2018][0][0] instanceof Array).toBe(true);
    expect(cal.data[2018][0][0].length).toBe(7);
    expect(cal.data[2018][0][0][4] instanceof Array).toBe(true);
    expect(cal.data[2018][0][0][4].length).toBe(3);
  }));
});
