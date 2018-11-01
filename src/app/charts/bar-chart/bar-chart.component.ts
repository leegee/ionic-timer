import { Component, Input, OnChanges } from '@angular/core';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';
import * as d3Scale from 'd3-scale';
import * as d3 from 'd3-selection';
import * as d3Shape from 'd3-shape';
import { Calendar, CalendarDay } from '../../Calendar';
import { TimerMetaRecord, TimerService } from '../../timer/timer.service';
import { Platform } from '@ionic/angular';



export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

@Component({
  selector: 'timer-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements OnChanges {
  @Input() public calendar: Calendar;
  @Input() public year: string;
  @Input() public month: string;

  private elementId = 'svg';

  public monthData = [];

  private margin: Margin;

  private width: number;
  private height: number;

  private x: any;
  private y: any;
  private z: any;

  private svg: any; // SVGSVGElement;
  private g: any;

  constructor(
    private platform: Platform,
    private timerService: TimerService
  ) { }

  ngOnChanges() {
    if ((!Object.keys(this.calendar.years[this.year]).length) || (!this.calendar.years[this.year][this.month])) {
      return false;
    }

    const lastDayOfMonth = Calendar.lastDayOfMonth(Number(this.year), Number(this.month)).getDate();
    this.monthData = new Array(lastDayOfMonth);
    const allMetaRecords: { [key: string]: TimerMetaRecord } = this.timerService.allMetaById();

    const day2ParentIds2Counts = [];
    this.calendar.years[this.year][this.month].forEach(week => {
      week.filter(day => day instanceof CalendarDay).forEach((day) => {
        day2ParentIds2Counts.push(day.getParentIds2Counts());
      });
    });

    for (let dayOfMonth = 1; dayOfMonth <= lastDayOfMonth; dayOfMonth++) {
      this.monthData[dayOfMonth - 1] = { date: dayOfMonth };

      Object.keys(allMetaRecords).forEach((id: string) => {
        this.monthData[dayOfMonth - 1][allMetaRecords[id].name || id] = '';
      });
    }

    this.calendar.years[this.year][this.month].forEach(week => {
      week.filter(day => day instanceof CalendarDay).forEach((day) => {
        const parentId2count = day2ParentIds2Counts.shift();

        Object.keys(parentId2count).forEach(id => {
          const label = allMetaRecords[id].name || id;
          this.monthData[day.date.getDate() - 1][label] = parentId2count[id];
        });
      });
    });

    this.z = d3Scale.scaleOrdinal().range(
      Object.keys(allMetaRecords).map((id: string) => {
        return allMetaRecords[id].color;
      })
    );

    this.drawChart(this.monthData);
  }

  private initSvg() {
    this.margin = { top: 20, right: 20, bottom: 30, left: 40 };
    this.svg = d3.select(this.elementId);
    this.svg.selectAll('*').remove();
    const elWidth = window.innerWidth;
    const elHeight = window.innerHeight / 2.8;
    this.width = elWidth - this.margin.left - this.margin.right;
    this.height = elHeight - this.margin.top - this.margin.bottom;

    this.svg.attr('width', elWidth).attr('height', elHeight);

    this.g = this.svg.append('g').attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.x = d3Scale.scaleBand()
      .rangeRound([0, this.width])
      .paddingInner(0.05)
      .align(0.1);
    this.y = d3Scale.scaleLinear()
      .rangeRound([this.height, 0]);
  }

  private drawChart(data: any[]): void {
    this.initSvg();

    const keys = Object.getOwnPropertyNames(data[0]).slice(1);

    data = data.map(v => {
      v.total = keys.map(key => v[key]).reduce((a, b) => a + b, 0);
      return v;
    });
    data.sort((a: any, b: any) => b.total - a.total);

    const maxY = d3Array.max(data, (d: any) => d.total);

    this.x.domain(data.map((d: any) => d.date));
    this.y.domain([0, maxY]).nice();
    this.z.domain(keys);

    this.g.append('g')
      .selectAll('g')
      .data(d3Shape.stack().keys(keys)(data))
      .enter().append('g')
      .attr('fill', d => this.z(d.key))
      .selectAll('rect')
      .data(d => d)
      .enter().append('rect')
      .attr('x', d => this.x(d.data.date))
      .attr('y', d => this.y(d[1]))
      .attr('height', d => this.y(d[0]) - this.y(d[1]))
      .attr('width', this.x.bandwidth());

    this.g.append('g')
      .attr('class', 'axis horizontal')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(d3Axis.axisBottom(this.x));

    this.g.append('g')
      .attr('class', 'axis vertical')
      .call(d3Axis.axisLeft(this.y).ticks(
        maxY, 'd'
        // null, 's')
      )
      // .append('text')
      // .attr('x', 2)
      // .attr('y', this.y(this.y.ticks().pop()) + 0.5)
      // .attr('dy', '0.32em')
      // .attr('fill', '#000')
      // .attr('font-weight', 'bold')
      // .attr('text-anchor', 'start')
      // .text('Timers run')
      ;

    const legend = this.g.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(keys.slice().reverse())
      .enter().append('g')
      .attr('transform', (d, i) => 'translate(0,' + i * 20 + ')');

    legend.append('rect')
      .attr('x', this.width - 19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', this.z);

    legend.append('text')
      .attr('x', this.width - 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d);
  }

}
