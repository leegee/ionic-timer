import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { DayDetailsPage } from './day-details.page';
import { Platform } from '@ionic/angular';

describe('DayDetailsPage', () => {
  let component: DayDetailsPage;
  let fixture: ComponentFixture<DayDetailsPage>;
  const fixtureActivatedRoute = {
    snapshot: {
      data: {}
    }
  } as ActivatedRoute;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        Platform,
        { provide: ActivatedRoute, useValue: fixtureActivatedRoute }
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
    expect(component).toBeTruthy();
  });
});
