import { Component, OnDestroy, OnInit } from '@angular/core';
import { Platform, PopoverController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Calendar, CalendarDay } from '../Calendar';
import { Colors } from '../Colors';
import { DayDetailsPage } from '../day-details/day-details.page';
import { TimerPastRecord, TimerService } from '../timer/timer.service';
import { Pie } from '../charts/Pie';

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.page.html',
  styleUrls: ['calendar.page.scss']
})
export class CalendarPage implements OnInit, OnDestroy {

  public calendarSubscription: Subscription;
  public calendar: Calendar;
  public year = new Date().getFullYear();
  public month = new Date().getMonth();
  public title: string;
  public colorRangeFunction: Function;

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
    this.calendarSubscription = this.timerService.calendar$.subscribe((calendar: Calendar) => {
      this.setCalendar(calendar);
    });
    this.timerService.getMonthOfPastRecords(new Date(this.year, this.month));
    this.title = new Date(this.year, this.month).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
  }

  get yearsWithData() {
    return this.calendar ? Object.keys(this.calendar.years) : [];
  }

  monthsWithData(year = this.year): string[] {
    return this.calendar ? Object.keys(this.calendar.years[year]) : [];
  }

  setCalendar(calendar: Calendar): void {
    this.calendar = calendar;
    this.calendar.addDatesForDaysWithoutData();
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
      new Pie('#' + pidId, false).draw(
        this.getCalendarData(calendarDay)
      );
    }
  }

  getCalendarData(calendarDay: CalendarDay) {
    const parentId2count = calendarDay.getParentIds2Counts();
    const allMetaRecords = this.timerService.allMetaById();

    return Object.keys(parentId2count).map(id => {
      return {
        label: (allMetaRecords[id].name || 'Unnamed Timer'),
        color: allMetaRecords[id].color || undefined,
        value: parentId2count[id]
      };
    });
  }

}
