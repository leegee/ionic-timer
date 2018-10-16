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
          driverOrder: ['indexeddb', 'sqlite', 'websql']
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

  it('should start/stop', inject([TimerService], async (service: TimerService) => {
    await service.clear('foo');
    await service.addNew('foo');
    await service.start('foo');
    await service.stop('foo');
  }));

  it('should list', inject([TimerService], async (service: TimerService) => {
    await service.clear('foo');
    await service.addNew('foo');
    await service.start('foo');
    await service.stop('foo');
    const list = await service.list();
    expect(Object.keys(list).length).toBe(1);
  }));
});
