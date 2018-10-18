import { TestBed, inject } from '@angular/core/testing';

import { TimerService } from './timer.service';
import { IonicStorageModule } from '@ionic/storage';
import { Platform } from '@ionic/angular';

describe('TimerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicStorageModule.forRoot({
          name: 'goddard-timer-db-test',
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

  it('should be create a db', inject([TimerService], async (service: TimerService) => {
    await service.connect();
    expect(service.timers).toBeTruthy();
  }));

  it('should getAll', inject([TimerService], async (service: TimerService) => {
    await service.deleteAll();
    await service.addNew('bar');
    await service.addNew('foo');
    await service.start('foo');
    await service.stop('foo');
    const all = await service.getAll();
    console.log(all);
    expect(Object.keys(all).length).toBe(2);
    expect(all.foo.length).toBe(1);
  }));
});
