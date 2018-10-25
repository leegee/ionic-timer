import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimerService, TimerCalendar, TimerMetaRecord, TimerPastRecord, Calendar } from '../timer/timer.service';
import { Platform, PopoverController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { DayDetailsPage } from '../day-details/day-details.page';

export interface CalendarDay {
  dom: number;
  date: Date;
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

  public calendarSubscription: Subscription;
  public calendar = {};
  public year = new Date().getFullYear();
  public month = new Date().getMonth();
  public title: string;

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
    this.calendarSubscription = this.timerService.calendar$.subscribe(({ calendar }) => {
      this.setCalendar(calendar as TimerCalendar);
    });
    this.timerService.getMonthOfPastRecords(new Date(this.year, this.month));
    this.title = new Date(this.year, this.month).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
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
            const weekInMonth = Calendar.zeroIndexedWeekInMonth(dayOfMonthDate);
            const day = dayOfMonthDate.getDay();

            if (parse === 1) {
              monthCache[weekInMonth][day] = {
                date: dayOfMonthDate,
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
      b: Calendar.colorScale[index]
    };
  }

  async showDetails(e: Event, calendarDay: TimerPastRecord[], date: string | Date): Promise<void> {
    const popover = await this.popoverController.create({
      component: DayDetailsPage,
      event: e,
      componentProps: {
        popoverController: this.popoverController,
        calendarDay: calendarDay,
        date: date
      }
    });
    return await popover.present();
  }

}
