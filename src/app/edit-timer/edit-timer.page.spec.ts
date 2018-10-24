import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTimerPage } from './edit-timer.page';

describe('EditTimerPage', () => {
  let component: EditTimerPage;
  let fixture: ComponentFixture<EditTimerPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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
    expect(component).toBeTruthy();
  });
});
