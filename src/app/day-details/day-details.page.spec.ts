// import { expect } from 'chai';

// import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { async, ComponentFixture, TestBed } from '@angular/core/testing';

// import { DayDetailsPage } from './day-details.page';
// import { Platform, NavParams } from '@ionic/angular';
// import { TimerPastRecord } from '../timer/timer.service';
// import { CalendarDay } from '../Calendar';

// describe('DayDetailsPage', () => {
//   let component: DayDetailsPage;
//   let fixture: ComponentFixture<DayDetailsPage>;
//   const fixtureNavParams = new NavParams({
//     calendarDay: new CalendarDay({
//       date: new Date(),
//       timerPastRecords: [
//         {
//           parentId: 'NeedToCreateThis',
//           start: 1,
//           stop: 2
//         } as TimerPastRecord
//       ]
//     })
//   });

//   beforeEach(async(() => {
//     TestBed.configureTestingModule({
//       providers: [
//         Platform,
//         { provide: NavParams, useValue: fixtureNavParams }
//       ],
//       declarations: [DayDetailsPage],
//       schemas: [CUSTOM_ELEMENTS_SCHEMA],
//     })
//       .compileComponents();
//   }));

//   beforeEach(() => {
//     fixture = TestBed.createComponent(DayDetailsPage);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).to.be.an.instanceof(Object);
//   });
// });
