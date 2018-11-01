import { Component, OnInit, Input, OnChanges } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Axis from 'd3-axis';
import * as d3Array from 'd3-array';

import { Colors } from '../../Colors';
import { Calendar, CalendarDay } from '../../Calendar';
import { TimerService, TimerPastRecord, TimerMetaRecord } from '../../timer/timer.service';

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
export class BarChartComponent implements OnInit, OnChanges {

  @Input() public calendar: Calendar;
  @Input() public year: string;
  @Input() public month: string;

  public monthData = [];

  private margin: Margin;

  private width: number;
  private height: number;

  private svg: any;     // TODO replace all `any` by the right type

  private x: any;
  private y: any;
  private z: any;
  private g: any;

  constructor(
    private timerService: TimerService
  ) { }

  ngOnInit() { }

  ngOnChanges() {
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

  private initMargins() {
    this.margin = { top: 20, right: 20, bottom: 30, left: 40 };
  }

  private initSvg() {
    this.svg = d3.select('svg');
    this.svg.selectAll('*').remove();

    this.width = +this.svg.attr('width') - this.margin.left - this.margin.right;
    this.height = +this.svg.attr('height') - this.margin.top - this.margin.bottom;
    this.g = this.svg.append('g').attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.x = d3Scale.scaleBand()
      .rangeRound([0, this.width])
      .paddingInner(0.05)
      .align(0.1);
    this.y = d3Scale.scaleLinear()
      .rangeRound([this.height, 0]);
    // this.z = d3Scale.scaleOrdinal()
    //   .range(
    //     // Colors.getColorRange(max)
    //     // [Colors.colourRange.min, Colors.colourRange.max]
    //     ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00']
    //   );
  }

  private drawChart(data: any[]) {
    this.initMargins();
    this.initSvg();

    const keys = Object.getOwnPropertyNames(data[0]).slice(1);

    data = data.map(v => {
      v.total = keys.map(key => v[key]).reduce((a, b) => a + b, 0);
      return v;
    });
    data.sort((a: any, b: any) => b.total - a.total);

    this.x.domain(data.map((d: any) => d.date));
    this.y.domain([0, d3Array.max(data, (d: any) => d.total)]).nice();
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

    // this.g.append('g')
    //   .attr('class', 'axis')
    //   .attr('transform', 'translate(0,' + this.height + ')')
    //   .call(d3Axis.axisBottom(this.x));

    this.g.append('g')
      .attr('class', 'axis')
      .call(d3Axis.axisLeft(this.y).ticks(null, 's'))
      .append('text')
      .attr('x', 2)
      .attr('y', this.y(this.y.ticks().pop()) + 0.5)
      .attr('dy', '0.32em')
      .attr('fill', '#000')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'start')
      .text('Timers run');

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
