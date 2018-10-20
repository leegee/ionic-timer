import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimerService, Timer, TimerMetaRecord } from '../timer/timer.service';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tags',
  templateUrl: 'tags.page.html',
  styleUrls: ['tags.page.scss']
})
export class TagsPage implements OnInit, OnDestroy {

  public names2times: { [key: string]: Timer[] };

  public calendarSubscription: Subscription;
  public calendar;

  public monthSubscription: Subscription;
  public monthData;

  constructor(
    private platform: Platform,
    private timerService: TimerService
  ) { }


  ngOnDestroy() {
    // this.calendarSubscription.unsubscribe();
    // this.monthSubscription.unsubscribe();
  }

  async ngOnInit() {
    await this.platform.ready();
    // this.names2times = await this.timerService.getAll();
    // this.timerService.updateCalendar();

    // this.calendarSubscription = this.timerService.calendarChangeSource.subscribe(
    //   (changed: TimerMetaRecord[]) => {
    //     this.calendar = changed;
    //   }
    // );

    // this.monthSubscription = this.timerService.monthChangeSource.subscribe(
    //   (changed: { [key: string]: any }) => {
    //     this.monthData = changed;
    //   }
    // );
  }

  get years() {
    return Object.keys(this.calendar || {}).sort();
  }

  months(year) {
    return Object.keys(this.calendar[year]).sort();
  }

  days(year, month) {
    return Object.keys(this.calendar[year][month]).sort();
  }

  get timerNames() {
    const rv = Object.keys(this.names2times || {}) || [];
    console.log('timerNames', rv);
    return rv;
  }

  getMonthData(week, dow) {

  }
}
