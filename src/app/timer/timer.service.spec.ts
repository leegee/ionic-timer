import { TestBed, inject } from '@angular/core/testing';

import { TimerService } from './timer.service';
import { IonicStorageModule } from '@ionic/storage';

describe('TimerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicStorageModule.forRoot({
          name: 'goddard-timer-db-test',
          driverOrder: ['indexeddb', 'sqlite', 'websql']
        }),
      ],
      providers: [TimerService]
    });
  });

  it('should be created', inject([TimerService], (service: TimerService) => {
    expect(service).toBeTruthy();
  }));

  it('should start/stop', inject([TimerService], async (service: TimerService) => {
    await service.clear();
    service.start();
    await service.stop();
    const numberOfEntries = await service.storage.keys();
    expect(numberOfEntries.length).toBe(1);
  }));
});
