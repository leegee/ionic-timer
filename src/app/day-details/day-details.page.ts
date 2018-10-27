import { Component, OnInit } from '@angular/core';
import { NavParams, Platform } from '@ionic/angular';
import { TimerService } from '../timer/timer.service';
import { Pie, LabelsColorsValuesDataset } from '../charts/Pie';
import { CalendarDay } from '../Calendar';

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
    new Pie(
      '#pieChart', this.width, this.height
    ).draw(
      this.getLabelsColorsValuesForCalendarDay(calendarDay)
    );
  }

  getLabelsColorsValuesForCalendarDay(calendarDay: CalendarDay): LabelsColorsValuesDataset[] {
    console.log('getCalendarData:', calendarDay);
    const parentId2count = calendarDay.getParentIds2Counts();
    const allMetaRecords = this.timerService.allMetaById();

    const rv = Object.keys(parentId2count).map(id => {
      return {
        label: (allMetaRecords[id].name || 'Unnamed Timer'),
        color: allMetaRecords[id].color || undefined,
        value: parentId2count[id]
      };
    });
    console.log('getCalendarDay:', rv);
    return rv;
  }
}
