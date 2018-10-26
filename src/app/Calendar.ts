import * as d3Scale from 'd3-scale';
import * as d3Color from 'd3-color';
import { TimerPastRecord } from './timer/timer.service';

export interface CalendarOfTimers {
  [key: number /* year */]: {
    [key: number /* month */]: CalendarEmptyMonth
  };
}

export type CalendarEmptyMonth = [
  // tslint:disable:max-line-length
  // zero-indexed days within zero-indexed weeks
  [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
  [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
  [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
  [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]],
  [TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[], TimerPastRecord[]]
  // tslint:enable:max-line-length
];

export class Calendar {
  static cachedForegroundColor: { [key: number]: string } = {};

  static colourRange = {
    min: 'white',
    max: 'steelblue'
  };

  public data: CalendarOfTimers = {};

  constructor() { }

  static fromTimerPastRecordList(timers: TimerPastRecord[]) {
    const self = new Calendar();
    timers.forEach(timer => {
      const start = new Date(timer.start);
      const year = start.getFullYear();
      const month = start.getMonth();
      self.data[year] = self.data[year] || {};
      self.data[year][month] = self.data[year][month] || Calendar.emptyMonth();
      self.data[year][month][Calendar.zeroIndexedWeekInMonth(start)][start.getDay()].push(timer);
    });

    return self;
  }

  // https://github.com/d3/d3-scale/blob/master/README.md#quantize-scales
  static getColorRange(datasetOrMax: number | number[]) {
    let minTemp = 0;
    let maxTemp: number;
    if (datasetOrMax instanceof Array) {
      minTemp = Math.min(...datasetOrMax);
      maxTemp = Math.max(...datasetOrMax);
    } else {
      maxTemp = datasetOrMax;
    }
    return d3Scale.scaleQuantize()
      .domain([minTemp, maxTemp])
      .range([Calendar.colourRange.min as any, Calendar.colourRange.max]);
  }

  static getForegroundColor(datasetOrMax: number | number[]): string {
    if ((!(datasetOrMax instanceof Array)) &&
      Calendar.cachedForegroundColor.hasOwnProperty(datasetOrMax as number)
    ) {
      return Calendar.cachedForegroundColor[datasetOrMax as number];
    }
    return d3Color.hsl(
      Calendar.getColorRange(datasetOrMax) as any
    ).l > 0.5 ? Calendar.colourRange.max : Calendar.colourRange.min;
    // '#000' : '#fff';
  }

  static zeroIndexedWeekInMonth(date: Date): number {
    return Math.ceil((date.getDate() - date.getDay()) / 7);
  }

  static emptyMonth() {
    return [
      // tslint:disable:max-line-length
      [[] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[]],
      [[] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[]],
      [[] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[]],
      [[] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[]],
      [[] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[], [] as TimerPastRecord[]]
      // tslint:enable:max-line-length
    ] as CalendarEmptyMonth;
  }

  getData(): CalendarOfTimers {
    return this.data;
  }
}

