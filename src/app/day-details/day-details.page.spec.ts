import { expect } from 'chai';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DayDetailsPage } from './day-details.page';
import { Platform, NavParams } from '@ionic/angular';

describe('DayDetailsPage', () => {
  let component: DayDetailsPage;
  let fixture: ComponentFixture<DayDetailsPage>;
  const fixtureNavParams = new NavParams({
    calendarDay: {
      dom: 21,
      date: new Date(),
      data: [
        {
          name: 'some name',
          color: '#ffddee',
        }
      ]
    }
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        Platform,
        { provide: NavParams, useValue: fixtureNavParams }
      ],
      declarations: [DayDetailsPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DayDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).to.be.an.instanceof(Object);
  });
});
