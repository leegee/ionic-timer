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

