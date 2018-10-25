import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimerService, TimerCalendar, TimerMetaRecord } from '../timer/timer.service';
import { Platform, PopoverController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { DayDetailsPage } from '../day-details/day-details.page';

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.page.html',
  styleUrls: ['calendar.page.scss']
})
export class CalendarPage implements OnInit, OnDestroy {

  public calendarSubscription: Subscription;
  public calendar = {};
  public year = new Date().getFullYear();
  public month = new Date().getMonth();

  public monthName = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'Octoboer', 'Novemeber', 'December'
  ];

  constructor(
    private platform: Platform,
    private timerService: TimerService,
    private popoverController: PopoverController
  ) { }

  ngOnDestroy() {
    this.calendarSubscription.unsubscribe();
  }

  async ngOnInit() {
    await this.platform.ready();
    this.timerService.getMonthOfPastRecords(this.year, this.month);
    this.calendarSubscription = this.timerService.calendar$.subscribe(({ calendar }) => {
      this.setCalendar(calendar as TimerCalendar);
    });
  }

  get yearsWithData() {
    return Object.keys(this.calendar || {});
  }

  monthsWithData(year = this.year): string[] {
    return Object.keys(this.calendar[year] || {});
  }

  setCalendar(calendar: TimerCalendar): void {
    this.calendar = {};

    Object.keys(calendar).forEach(_year => {
      const year = Number(_year);
      this.calendar[year] = {};
      Object.keys(calendar[year]).forEach(_month => {
        const month = Number(_month);
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        this.calendar[year][month] = [ // 5 weeks
          [[], [], [], [], [], [], []],
          [[], [], [], [], [], [], []],
          [[], [], [], [], [], [], []],
          [[], [], [], [], [], [], []],
          [[], [], [], [], [], [], []]
        ];

        for (let dayOfMonth = 1; dayOfMonth <= lastDayOfMonth; dayOfMonth++) {
          const dayOfMonthDate = new Date(year, month, dayOfMonth);
          const weekInMonth = this.timerService.zeroIndexedWeekInMonth(dayOfMonthDate);
          this.calendar[year][month][weekInMonth][dayOfMonthDate.getDay()] = {
            dom: dayOfMonth,
            data: calendar[year][month][weekInMonth][dayOfMonthDate.getDay()] || []
          };
        }
      });
    });
  }

  async showDetails(e: Event): Promise<void> {
    const popover = await this.popoverController.create({
      component: DayDetailsPage,
      event: e,
      componentProps: { popoverController: this.popoverController }
    });
    return await popover.present();
  }

  // hsl(timer: TimerMetaRecord): string {
  //   const rgb = timercolor.match(/^(..)(..)(..)/);
  // }

}
