import { Component, OnInit } from '@angular/core';
import { NavParams, Platform } from '@ionic/angular';
import { CalendarDay } from '../calendar/calendar.page';
import { TimerService } from '../timer/timer.service';
import { Pie } from '../charts/Pie';

@Component({
  selector: 'app-day-details',
  templateUrl: './day-details.page.html',
  styleUrls: ['./day-details.page.scss'],
})
export class DayDetailsPage implements OnInit {

  public title: string;
  public calendarDay: CalendarDay;
  public data = [];

  public width = 400;
  public height = 400;

  constructor(
    public navParams: NavParams,
    public platform: Platform,
    public timerService: TimerService
  ) {
  }

  async ngOnInit() {
    const calendarDay: CalendarDay = this.navParams.get('calendarDay');
    this.title = calendarDay.date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    await this.platform.ready();
    console.log(this.getCalendarData(calendarDay));
    new Pie(
      this.width, this.height
    ).draw(
      this.getCalendarData(calendarDay)
    );
  }

  getCalendarData(calendarDay: CalendarDay) {
    const parentId2count = {};
    calendarDay.data.forEach(record => {
      parentId2count[record.parentId] = parentId2count.hasOwnProperty(record.parentId) ?
        parentId2count[record.parentId] + 1 : 1;
    });

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
