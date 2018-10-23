import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimerService, TimerCalendar } from '../timer/timer.service';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tags',
  templateUrl: 'tags.page.html',
  styleUrls: ['tags.page.scss']
})
export class TagsPage implements OnInit, OnDestroy {

  public calendarSubscription: Subscription;
  public calendar: TimerCalendar = {} as TimerCalendar;
  public year = new Date().getFullYear();
  public month = new Date().getMonth();

  constructor(
    private platform: Platform,
    private timerService: TimerService
  ) { }


  ngOnDestroy() {
    this.calendarSubscription.unsubscribe();
  }

  async ngOnInit() {
    await this.platform.ready();
    // this.timerService.init();
    this.timerService.getMonthOfPastRecords(this.year, this.month);

    this.calendarSubscription = this.timerService.calendar$.subscribe(
      ({ calendar }) => {
        console.log('got updated calendar', calendar);
        this.calendar = calendar;
      }
    );
  }

  get years() {
    return [this.year];
  }

  months(year = this.year): string[] {
    return Object.keys(this.calendar[year] || {});
  }

  // calendar from timerservice is year.month.dayOfMonth
  // convert to 
  // setPaddedCalendar(calendar): void {
  //   console.log(this.calendar);
  //   const year = new Date().getFullYear();
  //   const month = new Date().getMonth();
  //   const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  //   let weekContent = [];

  //   for (let dayOfMonth = 1; dayOfMonth <= lastDayOfMonth; dayOfMonth++) {
  //     const dayOfMonthDate = new Date(year, month, dayOfMonth);

  //     if (dayOfMonth === 1) {
  //       const dayOfMonthDow = dayOfMonthDate.getDay();
  //       if (dayOfMonthDow !== 0) { // if month not beginning on a Sunday
  //         // Pad the calendar's first week
  //         for (let emptyDay = 7 - dayOfMonthDow; emptyDay > 0; emptyDay--) {
  //           weekContent.push({});
  //         }
  //       }
  //     }

  //     // dayContent = this.calendar[year][month][dayOfMonth % 5][dayOfMonth % ];
  //     const weekInMonth = Math.ceil((dayOfMonth) / 7);
  //     let dayContent = {
  //       dom: dayOfMonth,
  //       data: calendar[year][month][weekInMonth][dayOfMonth]
  //     };

  //     this.calendar[year][month][weekInMonth][dayOfMonth]
  //   }
  // }

}
