import { Component, OnInit } from '@angular/core';
import { NavParams, Platform } from '@ionic/angular';
import { CalendarDay } from '../calendar/calendar.page';
import { TimerCalendar, TimerService } from '../timer/timer.service';

import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
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

  public margin = { top: 20, right: 20, bottom: 30, left: 50 };
  public width: number;
  public height: number;
  public radius: number;
  public arc: any;
  public labelArc: any;
  public labelPer: any;
  public pie: any;
  public color: any;
  public svg: any;

  constructor(
    public navParams: NavParams,
    public platform: Platform,
    public timerService: TimerService
  ) {
    this.width = 300 - this.margin.left - this.margin.right;
    this.height = 300 - this.margin.top - this.margin.bottom;
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
    this.initSvg();
    this.drawPie();
  }

  async setupCalendarData(calendarDay: CalendarDay) {
    const parentId2count = {};
    calendarDay.data.forEach(record => {
      parentId2count[record.parentId] = parentId2count.hasOwnProperty(record.parentId) ?
        parentId2count[record.parentId] + 1 : 1;
    });

    this.data = Object.keys(parentId2count).map(id => {
      return {
        label: this.timerService.id2name(id),
        value: parentId2count[id]
      };
    });
  }

  initSvg() {
    this.color = d3Scale.scaleOrdinal()
      .range(['#FFA500', '#00FF00', '#FF0000', '#6b486b', '#FF00FF', '#d0743c', '#00FA9A']);
    this.arc = d3Shape.arc()
      .outerRadius(this.radius - 10)
      .innerRadius(0);
    this.labelArc = d3Shape.arc()
      .outerRadius(this.radius - 40)
      .innerRadius(this.radius - 40);

    this.labelPer = d3Shape.arc()
      .outerRadius(this.radius - 80)
      .innerRadius(this.radius - 80);


    this.pie = d3Shape.pie()
      .sort(null)
      .value((d: any) => d.value);

    this.svg = d3.select('#pieChart')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0 0 ' + Math.min(this.width, this.height) + ' ' + Math.min(this.width, this.height))
      .append('g')
      .attr('transform', 'translate(' + Math.min(this.width, this.height) / 2 + ',' + Math.min(this.width, this.height) / 2 + ')');
  }

  drawPie() {
    const g = this.svg.selectAll('.arc')
      .data(this.pie(this.data))
      .enter().append('g')
      .attr('class', 'arc');
    g.append('path').attr('d', this.arc)
      .style('fill', (d: any) => this.color(d.data.label));
    g.append('text').attr('transform', (d: any) => 'translate(' + this.labelArc.centroid(d) + ')')
      .attr('dy', '.35em')
      .text((d: any) => d.data.label);

    g.append('text').attr('transform', (d: any) => 'translate(' + this.labelPer.centroid(d) + ')')
      .attr('dy', '.35em')
      .text((d: any) => d.data.value + '%');
  }
}
