import { Component, OnDestroy, OnInit } from '@angular/core';
import { Platform, PopoverController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Calendar, CalendarDay } from '../Calendar';
import { Colors } from '../Colors';
import { DayDetailsPage } from '../day-details/day-details.page';
import { TimerService, TimerMetaRecord } from '../timer/timer.service';
import { Pie } from '../charts/Pie';

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.page.html',
  styleUrls: ['calendar.page.scss']
})
export class CalendarPage implements OnInit, OnDestroy {

  static PAN_DEBOUNCE_MS = 500;

  public calendarSubscription: Subscription;
  public calendar: Calendar;
  public date = new Date();
  public title = 'Loading calendar...';
  public colorRangeFunction: Function;
  private lastTimerStamp = 0;

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
    console.log('ngOnInit');
    this.calendarSubscription = this.timerService.calendar$.subscribe((calendar: Calendar) => {
      this.setCalendar(calendar);
    });
    this.loadMonth();
  }

  setCalendar(calendar: Calendar): void {
    console.log('set calendar', calendar);
    this.calendar = calendar;
    this.calendar.addDatesForDaysWithoutData();
    this.title = this.date.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
  }

  loadMonth() {
    this.timerService.getMonthOfPastRecords(this.date);
  }

  gotData(year, month, week, day): boolean {
    return this.calendar.years[year]
      && this.calendar.years[year][month]
      && this.calendar.years[year][month][week]
      && this.calendar.years[year][month][week][day]
      && this.calendar.years[year][month][week][day].date
      && this.calendar.years[year][month][week][day].timerPastRecords
      && this.calendar.years[year][month][week][day].timerPastRecords.length > 0;
  }

  hasaDate(year, month, week, day): boolean {
    return this.calendar.years[year]
      && this.calendar.years[year][month]
      && this.calendar.years[year][month][week]
      && this.calendar.years[year][month][week][day]
      && this.calendar.years[year][month][week][day].hasOwnProperty('date');
  }

  get year() {
    return this.date.getFullYear();
  }

  get month() {
    return this.date.getMonth();
  }

  get yearsWithData() {
    return this.calendar ? Object.keys(this.calendar.years) : [];
  }

  monthsWithData(year = this.date.getFullYear()): string[] {
    return this.calendar && this.calendar.years[year] ? Object.keys(this.calendar.years[year]) : [];
  }

  heatmapCalendarDay(itemValue: number, max: number): { f: string, b: string } {
    this.colorRangeFunction = this.colorRangeFunction || Colors.getColorRange(max);
    if (max === 0 || itemValue === 0) {
      return {
        f: `default`,
        b: 'transparent'
      };
    }
    return {
      f: Colors.getForegroundColor(max),
      b: this.colorRangeFunction(max)
    };
  }

  async showDetails(e: Event, calendarDay: CalendarDay, date: string | Date): Promise<void> {
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

  pieId(year: number, month: number, week: number, day: number) {
    return ['pie', year, month, week, day].join('-');
  }

  getPie(year: number, month: number, week: number, day: number, calendarDay: CalendarDay) {
    const pidId = this.pieId(year, month, week, day);
    const el = document.getElementById(pidId);
    if (el && el.childElementCount === 0) {
      const allMetaRecords = this.timerService.allMetaById();
      new Pie('#' + pidId, false).draw(
        this.getCalendarDayData(allMetaRecords, calendarDay)
      );
    }
  }

  getCalendarDayData(allMetaRecords: { [key: string]: TimerMetaRecord }, calendarDay: CalendarDay) {
    const parentId2count = calendarDay.getParentIds2Counts();
    return Object.keys(parentId2count).map(id => {
      return {
        label: (allMetaRecords[id].name || 'Unnamed Timer'),
        color: allMetaRecords[id].color || undefined,
        value: parentId2count[id]
      };
    });
  }

  pan(e) {
    if (e.timeStamp - this.lastTimerStamp < CalendarPage.PAN_DEBOUNCE_MS) {
      return;
    }
    this.lastTimerStamp = e.timeStamp;
    this.date.setMonth(
      this.date.getMonth() + (
        e.deltaX > 0 ? 1 : -1
      )
    );
    this.loadMonth();
  }
}
