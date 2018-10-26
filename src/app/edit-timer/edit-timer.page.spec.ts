import { expect } from 'chai';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTimerPage } from './edit-timer.page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Platform, NavParams } from '@ionic/angular';
import { TimerService } from '../timer/timer.service';

describe('EditTimerPage', () => {
  let component: EditTimerPage;
  let fixture: ComponentFixture<EditTimerPage>;
  const navParams = new NavParams({
    timer: {
      id: 'someId',
      name: 'some name',
      color: '#ffddee'
    }
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule, ReactiveFormsModule
      ],
      providers: [
        Platform,
        TimerService,
        { provide: NavParams, useValue: navParams }
      ],
      declarations: [ EditTimerPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTimerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).to.be.an.instanceof(EditTimerPage);
  });
});
