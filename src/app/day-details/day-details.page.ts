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
  public dataset: LabelsColorsValuesDataset[];

  constructor(
    public navParams: NavParams,
    public platform: Platform,
    public timerService: TimerService
  ) { }

  async ngOnInit() {
    const calendarDay: CalendarDay = this.navParams.get('calendarDay');
    this.title = calendarDay.date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    this.dataset = this.getLabelsColorsValuesForCalendarDay(calendarDay);

    await this.platform.ready();
    new Pie('#pieChart').draw(this.dataset);
  }

  get footer() {
    const t = this.totalEntries;
    return t + ' total ' + (t !== 1 ? 'entries' : 'entry');
  }

  get totalEntries() {
    return this.dataset ? this.dataset.reduce((prev: number, current: LabelsColorsValuesDataset) => {
      return prev + current.value;
    }, 0) : 0;
  }

  getLabelsColorsValuesForCalendarDay(calendarDay: CalendarDay): LabelsColorsValuesDataset[] {
    if (!(calendarDay instanceof CalendarDay)) {
      throw new TypeError('calendarDay should be a CalendarDay!');
    }
    console.log('calendarDay', calendarDay);
    const parentId2count = calendarDay.getParentIds2Counts();
    const allMetaRecords = this.timerService.allMetaById();

    const rv = Object.keys(parentId2count).map(id => {
      return {
        label: (allMetaRecords[id].name || 'Unnamed Timer'),
        color: allMetaRecords[id].color || undefined,
        value: parentId2count[id]
      };
    });
    return rv;
  }
}
