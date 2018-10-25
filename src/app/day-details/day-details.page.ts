import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { TimerService, TimerCalendar } from '../timer/timer.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-day-details',
  templateUrl: './day-details.page.html',
  styleUrls: ['./day-details.page.scss'],
})
export class DayDetailsPage implements OnInit {

  public year: number;
  public month: number;
  public day: number;
  public dayName: string;
  public monthName: string;
  public calendarSubscription: Subscription;

  constructor(
    public route: ActivatedRoute,
    public platform: Platform,
    public timerService: TimerService
  ) { }

  async ngOnInit() {
    this.year = this.route.snapshot.params.year;
    this.month = this.route.snapshot.params.month;
    this.day = this.route.snapshot.params.day;

    this.dayName = new Date(this.year, this.month, this.day)
      .toLocaleDateString('en-GB', { weekday: 'long' });
    this.monthName = new Date(this.year, this.month, this.day)
      .toLocaleDateString('en-GB', { month: 'long' });

    await this.platform.ready();
    await this.timerService.getDayOfPastRecords(this.year, this.month, this.day);

    this.calendarSubscription = this.timerService.calendar$.subscribe(({ calendar }) => {
      this.setupCalendarData(calendar as TimerCalendar);
    });
    this.timerService.getMonthOfPastRecords(new Date(this.year, this.month));
  }

  setupCalendarData(calendar: TimerCalendar) {

  }

}
