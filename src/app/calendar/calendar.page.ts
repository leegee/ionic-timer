import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimerService, TimerCalendar, TimerMetaRecord, TimerPastRecord } from '../timer/timer.service';
import { Platform, PopoverController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { DayDetailsPage } from '../day-details/day-details.page';

export interface CalendarDay {
  dom: number;
  data: TimerPastRecord[];
  colors: {
    f: string,
    b: string
  };
}

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.page.html',
  styleUrls: ['calendar.page.scss']
})
export class CalendarPage implements OnInit, OnDestroy {

  // Mucc good: https://gka.github.io/palettes/#colors=lightyellow,orange,deeppink,darkred|steps=100|bez=1|coL=1
  // tslint:disable-next-line:max-line-length
  public colorScale = ['#ffffe0', '#fffddb', '#fffad7', '#fff7d1', '#fff5cd', '#fff2c8', '#fff0c4', '#ffedbf', '#ffebba', '#ffe9b7', '#ffe5b2', '#ffe3af', '#ffe0ab', '#ffdda7', '#ffdba4', '#ffd9a0', '#ffd69c', '#ffd399', '#ffd196', '#ffcd93', '#ffca90', '#ffc88d', '#ffc58a', '#ffc288', '#ffbf86', '#ffbd83', '#ffb981', '#ffb67f', '#ffb47d', '#ffb17b', '#ffad79', '#ffaa77', '#ffa775', '#ffa474', '#ffa172', '#ff9e70', '#ff9b6f', '#ff986e', '#ff956c', '#fe916b', '#fe8f6a', '#fd8b69', '#fc8868', '#fb8567', '#fa8266', '#f98065', '#f87d64', '#f77a63', '#f67862', '#f57562', '#f37261', '#f37060', '#f16c5f', '#f0695e', '#ee665d', '#ed645c', '#ec615b', '#ea5e5b', '#e85b59', '#e75859', '#e55658', '#e45356', '#e35056', '#e14d54', '#df4a53', '#dd4852', '#db4551', '#d9434f', '#d8404e', '#d53d4d', '#d43b4b', '#d2384a', '#cf3548', '#cd3346', '#cc3045', '#ca2e43', '#c72b42', '#c52940', '#c2263d', '#c0233c', '#be213a', '#bb1e37', '#ba1c35', '#b71933', '#b41731', '#b2152e', '#b0122c', '#ac1029', '#aa0e27', '#a70b24', '#a40921', '#a2071f', '#a0051c', '#9d0419', '#990215', '#970212', '#94010e', '#91000a', '#8e0006', '#8b0000'];
  public monthName = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'Octoboer', 'Novemeber', 'December'
  ];

  public calendarSubscription: Subscription;
  public calendar = {};
  public year = new Date().getFullYear();
  public month = new Date().getMonth();

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
        const monthCache = [ // 5 weeks
          [
            {} as CalendarDay, {} as CalendarDay, {} as CalendarDay, {} as CalendarDay,
            {} as CalendarDay, {} as CalendarDay, {} as CalendarDay
          ],
          [
            {} as CalendarDay, {} as CalendarDay, {} as CalendarDay, {} as CalendarDay,
            {} as CalendarDay, {} as CalendarDay, {} as CalendarDay
          ],
          [
            {} as CalendarDay, {} as CalendarDay, {} as CalendarDay, {} as CalendarDay,
            {} as CalendarDay, {} as CalendarDay, {} as CalendarDay
          ],
          [
            {} as CalendarDay, {} as CalendarDay, {} as CalendarDay, {} as CalendarDay,
            {} as CalendarDay, {} as CalendarDay, {} as CalendarDay
          ],
          [
            {} as CalendarDay, {} as CalendarDay, {} as CalendarDay, {} as CalendarDay,
            {} as CalendarDay, {} as CalendarDay, {} as CalendarDay
          ],
        ];

        let maxEntriesInMonth = 0;

        [1, 2].forEach(parse => {
          for (let dayOfMonth = 1; dayOfMonth <= lastDayOfMonth; dayOfMonth++) {
            const dayOfMonthDate = new Date(year, month, dayOfMonth);
            const weekInMonth = this.timerService.zeroIndexedWeekInMonth(dayOfMonthDate);
            const day = dayOfMonthDate.getDay();

            if (parse === 1) {
              monthCache[weekInMonth][day] = {
                dom: dayOfMonth,
                data: calendar[year][month][weekInMonth][day] || [],
                colors: { f: 'default', b: 'default' }
              } as CalendarDay;

              if (monthCache[weekInMonth][day].data.length > maxEntriesInMonth) {
                maxEntriesInMonth = monthCache[weekInMonth][day].data.length;
              }

            } else {
              monthCache[weekInMonth][day].colors =
                this.heatmapCalendarDay(monthCache[weekInMonth][day].data.length, maxEntriesInMonth);
            }
          }
        });

        this.calendar[year][month] = monthCache;
      });
    });
  }

  heatmapCalendarDay(entries: number, max: number): { f: string, b: string } {
    if (max === 0 || entries === 0) {
      return {
        f: `default`,
        b: 'transparent'
      };
    }
    const index = ((max / entries) * 100) - 1;
    return {
      f: index >= 50 ? 'white' : 'black',
      b: this.colorScale[index]
    };
  }

  async showDetails(e: Event): Promise<void> {
    const popover = await this.popoverController.create({
      component: DayDetailsPage,
      event: e,
      componentProps: { popoverController: this.popoverController }
    });
    return await popover.present();
  }

}
