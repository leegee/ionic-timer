import { Component, OnInit } from '@angular/core';
import { NavParams, Platform } from '@ionic/angular';
import { CalendarDay } from '../calendar/calendar.page';
import { TimerService } from '../timer/timer.service';
import { Calendar } from '../calendar';

import * as d3 from 'd3-selection';
import * as d3Shape from 'd3-shape';

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
  public radius: number;

  constructor(
    public navParams: NavParams,
    public platform: Platform,
    public timerService: TimerService
  ) {
    this.radius = Math.min(this.width, this.height) / 2;
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
    this.setupCalendarData(calendarDay);
    this.draw();
  }

  async setupCalendarData(calendarDay: CalendarDay) {
    const parentId2count = {};
    calendarDay.data.forEach(record => {
      parentId2count[record.parentId] = parentId2count.hasOwnProperty(record.parentId) ?
        parentId2count[record.parentId] + 1 : 1;
    });

    const allMetaRecords = this.timerService.allMetaById();
    this.data = Object.keys(parentId2count).map(id => {
      return {
        label: allMetaRecords[name],
        color: allMetaRecords[id].color || undefined,
        value: parentId2count[id]
      };
    });
  }


  draw() {
    const color = Calendar.getColorRange(
      this.data.map(i => i.value)
    );

    const arc = d3Shape.arc()
      .outerRadius(this.radius - 10)
      .innerRadius(0);
    const labelArc = d3Shape.arc()
      .outerRadius(this.radius - 40)
      .innerRadius(this.radius - 40);
    const labelPercent = d3Shape.arc()
      .outerRadius(this.radius - 80)
      .innerRadius(this.radius - 80);

    const pie = d3Shape.pie()
      .sort(null)
      .value((d: any) => d.value);

    const svg = d3.select('#pieChart')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0 0 ' + Math.min(this.width, this.height) + ' ' + Math.min(this.width, this.height))
      .append('g')
      .attr('transform', 'translate(' + Math.min(this.width, this.height) / 2 + ',' + Math.min(this.width, this.height) / 2 + ')');

    const g = svg.selectAll('.arc')
      .data(pie(this.data))
      .enter().append('g')
      .attr('class', 'arc');

    g.append('path').attr('d', arc as any)
      // .style('fill', (d: any) => color(d.data.value) as any);
      .style('fill', (d: any) => (d.data.color || color(d.data.value)))
      .style('stroke', (d: any) => '#dddddddd');

    g.append('text').attr('transform', (d: any) => 'translate(' + labelArc.centroid(d) + ')')
      .attr('dy', '.35em')
      .text((d: any) => d.data.label);

    g.append('text').attr('transform', (d: any) => 'translate(' + labelPercent.centroid(d) + ')')
      .attr('dy', '.35em')
      .text((d: any) => d.data.value + '%');
  }
}
