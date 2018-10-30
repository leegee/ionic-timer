import { expect } from 'chai';

import { TestBed, inject } from '@angular/core/testing';
import { TimerService, TimerMetaRecord, TimerPastRecord } from './timer.service';
import { Calendar } from '../Calendar';
import { IonicStorageModule } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { Colors } from '../Colors';

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
    expect(service).to.be.instanceOf(Object);
  }));

  it('should init', inject([TimerService], async (service: TimerService) => {
    const p = service.init();
    expect(p).to.be.an.instanceof(Promise);
    await p;
  }));

  it('should have no records after deleteAll', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    Object.keys(service.stores).forEach(async (storeName) => {
      const len = await service.stores[storeName].length();
      expect(len).to.equal(0);
    });
  }));

  it('should emit a list when db empty', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    service.timersMeta.subscribe((changed: TimerMetaRecord[]) => {
      expect(changed instanceof Array).to.equal(true);
      expect(changed.length).to.equal(0);
    });
    await service.init();
  }));

  it('should create records with addNew', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    const testName = 'test-name';
    const id = await service.addNewTimer({
      name: testName,
      oppositeId: null,
      color: null
    });
    const ids = await service.stores.ids2meta.keys();
    expect(ids.length).to.equal(1);
    expect(ids[0]).to.equal(id);
    const ids2MetaEntry = await service.stores.ids2meta.get(ids[0]);
    expect(ids2MetaEntry).to.be.an.instanceof(Object);
    expect(ids2MetaEntry.id).to.equal(ids[0]);
    expect(ids2MetaEntry.name).to.equal(testName);
  }));

  it('should init with records if they exist', inject([TimerService], async (service: TimerService) => {
    await loadFixtures(service);
    await service.deleteAll();
    const testName = 'another-test-name';
    const id = await service.addNewTimer({
      name: testName,
      oppositeId: null,
      color: null
    });
    service.timersMeta.subscribe((changed: TimerMetaRecord[]) => {
      expect(changed.length).to.equal(1);
      expect(changed[0].id).to.equal(id);
    });
    await service.init();
  }));

  it('timersIndexById', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    const id0 = await service.addNewTimer({
      name: 'test1',
      oppositeId: null,
      color: null
    });
    const id1 = await service.addNewTimer({
      name: 'test2',
      oppositeId: null,
      color: null
    });
    const id2 = await service.addNewTimer({
      name: 'test3',
      oppositeId: null,
      color: null
    });
    await service._buildIds2metaCache();
    expect(service._getMetaCacheIndexById(id0)).to.equal(0);
    expect(service._getMetaCacheIndexById(id1)).to.equal(1);
    expect(service._getMetaCacheIndexById(id2)).to.equal(2);
  }));

  it('removes a record', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    const id = await service.addNewTimer({
      name: 'test',
      oppositeId: null,
      color: null
    });
    await service._start(0);
    await service._stop(0);
    await service.remove(id);
    const metaLength = await service.stores.ids2meta.length();
    expect(metaLength).to.equal(0);
    const timersLength = await service.stores.ids2pastTimers.length();
    expect(timersLength).to.equal(0);
  }));

  it('should get a month of data', inject([TimerService], async (service: TimerService) => {
    await loadFixtures(service);
    const date = new Date();
    let calls = 0;
    service.calendar.subscribe((changed: { calendar: TimerPastRecord[], count: number }) => {
      calls++;
      expect(changed.calendar instanceof Array).to.equal(false);
      expect(changed.calendar[date.getFullYear()]).to.be.an.instanceof(Object);
      expect(changed.calendar[date.getFullYear()][date.getMonth()]).to.be.an.instanceof(Object);
      expect(changed.calendar[date.getFullYear()][date.getMonth()] instanceof Array).to.equal(true);
      expect(changed.calendar[date.getFullYear()][date.getMonth()].length).to.equal(5); // five weeks
      for (let week = 0; week < 5; week++) {
        expect(changed.calendar[date.getFullYear()][date.getMonth()][week].length).to.equal(7); // five weeks
        for (let day = 0; day < 7; day++) {
          expect(changed.calendar[date.getFullYear()][date.getMonth()][week][day] instanceof Array).to.equal(true); // days are arrays
        }
      }
      expect(changed.calendar[date.getFullYear()][date.getMonth()][0][1].length).to.equal(totalTimers * totalEntries);
    });
    await service.getMonthOfPastRecords(new Date());
  }));

  it('zeroIndexedWeekInMonth', inject([TimerService], async (service: TimerService) => {
    expect(
      Calendar.zeroIndexedWeekInMonth(new Date(2018, 9, 1))
    ).to.equal(0);
  }));

  it('should create a calendar for a month', inject([TimerService], async (service: TimerService) => {
    const date = new Date(2018, 0, 5);
    const fixtureRecords: TimerPastRecord[] = [
      { start: date.getTime() - 3600, stop: date.getTime(), parentId: null },
      { start: date.getTime() - 2600, stop: date.getTime(), parentId: null },
      { start: date.getTime() - 1600, stop: date.getTime(), parentId: null }
    ];
    const cal = Calendar.fromTimerPastRecordList(fixtureRecords);
    expect(cal).to.be.an.instanceof(Calendar);
    expect(cal.years.hasOwnProperty(2018)).to.equal(true);
    expect(cal.years[2018].hasOwnProperty(0)).to.equal(true);
    expect(cal.years[2018][0] instanceof Array).to.equal(true);
    expect(cal.years[2018][0].length).to.equal(5);
    expect(cal.years[2018][0][0] instanceof Array).to.equal(true);
    expect(cal.years[2018][0][0].length).to.equal(7);
    expect(cal.years[2018][0][0][4] instanceof Array).to.equal(true);
    expect(cal.years[2018][0][0][4].timerPastRecords.length).to.equal(3);
  }));

  it('colour range', inject([TimerService], async (service: TimerService) => {
    const min = 1;
    const max = 1000;
    const dataset = [min, max];
    const f = Colors.getColorRange(dataset);
    expect(typeof f).to.equal('function');
    expect(f(min)).to.equal(Colors.colourRange.min);
    expect(f(max)).to.equal(Colors.colourRange.max);
  }));
});
