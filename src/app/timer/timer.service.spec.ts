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

  // it('should getAll', inject([TimerService], async (service: TimerService) => {
  //   await service.deleteAll();
  //   await service.addNew('bar');
  //   await service.addNew('foo');
  //   await service.start('foo');
  //   await service.stop('foo');
  //   const list = await service.getAll();
  //   expect(Object.keys(list).length).toBe(2);
  // }));

  it('should getSubscription', inject([TimerService], async (service: TimerService) => {
    console.log(`---------------start`);
    // service.timers.subscribe({
    //   next: x => console.log('Observer got a next value: ' + x),
    //   error: err => console.error('Observer got an error: ' + err),
    //   complete: () => console.log('Observer got a complete notification'),
    // });
    await service.deleteAll();
    await service.addNew('bar');
    await service.addNew('foo');
    await service.start('foo');
    await service.stop('foo');
    console.log(`---------------done`);
    // expect(Object.keys(list).length).toBe(2);
  }));
});
