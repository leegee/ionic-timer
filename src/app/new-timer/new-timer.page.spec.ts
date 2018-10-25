import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavParams } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage';

import { NewTimerPage } from './new-timer.page';

describe('NewTimerPage', () => {
  let component: NewTimerPage;
  let fixture: ComponentFixture<NewTimerPage>;
  const argsFixture = {
    popoverController: {},
    timer: {
      id: 'someId',
      name: 'a name',
      color: '#ffddee'
    }
  };

  const navParams = new NavParams(argsFixture);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NewTimerPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        IonicStorageModule.forRoot({
          name: 'goddard-timer-db-test',
          driverOrder: ['indexeddb']
        }),
      ],
      providers: [
        Platform,
        { provide: NavParams, useValue: navParams },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewTimerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

