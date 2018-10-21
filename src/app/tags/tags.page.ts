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
  public calendar = {};

  constructor(
    private platform: Platform,
    private timerService: TimerService
  ) { }


  ngOnDestroy() {
    this.calendarSubscription.unsubscribe();
  }

  async ngOnInit() {
    await this.platform.ready();
    // this.names2times = await this.timerService.getAll();
    // this.timerService.updateCalendar();

    this.calendarSubscription = this.timerService.calendarChanged$.subscribe(
      (changed: TimerCalendar[]) => {
        this.calendar = changed;
      }
    );
  }

  get years() {
    return Object.keys(this.calendar || {}).sort();
  }

  months(year) {
    return Object.keys(this.calendar[year]).sort();
  }

  weeks(year, month) {
    return Object.keys(this.calendar[year][month]);
  }

  dow(year, month, week) {
    return Object.keys(this.calendar[year][month][week]);
  }

}
