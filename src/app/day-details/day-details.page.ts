import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavParams, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CalendarDay } from '../calendar/calendar.page';
import { TimerCalendar, TimerService } from '../timer/timer.service';

@Component({
  selector: 'app-day-details',
  templateUrl: './day-details.page.html',
  styleUrls: ['./day-details.page.scss'],
})
export class DayDetailsPage implements OnInit {

  public title: string;
  public year: number;
  public month: number;
  public day: number;
  public dayName: string;
  public monthName: string;
  public calendarSubscription: Subscription;
  public calendarDay: CalendarDay;

  constructor(
    public route: ActivatedRoute,
    public navParams: NavParams,
    public platform: Platform,
    public timerService: TimerService
  ) { }

  async ngOnInit() {
    this.calendarDay = this.navParams.get('calendarDay');
    this.title = this.calendarDay.date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    await this.platform.ready();
  }

  setupCalendarData(calendar: TimerCalendar) {
    console.log(calendar);
    console.log(this.year, this.month, this.day);
    console.log(calendar[this.year][this.month][this.day]);
  }

}
