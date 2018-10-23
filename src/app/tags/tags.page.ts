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
  public calendar = {}; // : TimerCalendar = {} as TimerCalendar;
  public year = new Date().getFullYear();
  public month = new Date().getMonth();

  public monthName = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'Octoboer', 'Novemeber', 'December'
  ];

  constructor(
    private platform: Platform,
    private timerService: TimerService
  ) { }

  ngOnDestroy() {
    this.calendarSubscription.unsubscribe();
  }

  async ngOnInit() {
    await this.platform.ready();
    this.timerService.getMonthOfPastRecords(this.year, this.month);
    this.calendarSubscription = this.timerService.calendar$.subscribe(({ calendar }) => {
      this.setCalendar(calendar);
    });
  }

  get yearsWithData() {
    return Object.keys(this.calendar || {});
  }

  monthsWithData(year = this.year): string[] {
    return Object.keys(this.calendar[year] || {});
  }

  setCalendar(calendar): void {
    // TODO itterate
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    this.calendar = {
      [year]: {
        [month]: [ // 5 weeks
          [
            [], [], [], [], [], [], [] // 7 days
          ], [
            [], [], [], [], [], [], []
          ], [
            [], [], [], [], [], [], []
          ], [
            [], [], [], [], [], [], []
          ], [
            [], [], [], [], [], [], []
          ]
        ]
      }
    }; //  as <TimerCalendar>;

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    for (let dayOfMonth = 1; dayOfMonth <= lastDayOfMonth; dayOfMonth++) {
      const dayOfMonthDate = new Date(year, month, dayOfMonth);
      const weekInMonth = this.timerService.zeroIndexedWeekInMonth(dayOfMonthDate);
      this.calendar[year][month][weekInMonth][dayOfMonthDate.getDay()] = {
        dom: dayOfMonth,
        data: calendar[year][month][weekInMonth][dayOfMonthDate.getDay()] || []
      };
    }
  }

}
