import { TimerPastRecord } from './timer/timer.service';

export interface CalendarOfTimers {
  [key: number /* year */]: {
    [key: number /* month */]: CalendarEmptyMonth
  };
}

export type CalendarEmptyMonth = [
  // zero-indexed days within zero-indexed weeks
  [CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay],
  [CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay],
  [CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay],
  [CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay],
  [CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay, CalendarDay]
];

export interface CalendarDayOptions {
  date: Date;
  timerPastRecords?: TimerPastRecord[];
  colors?: {
    f: string,
    b: string
  };
}

export class EmptyCalendarDay {
  date: Date;
  setDate(date: Date) {
    this.date = date;
  }
}

export class CalendarDay extends EmptyCalendarDay {
  timerPastRecords: TimerPastRecord[] = [];
  colors = {
    f: undefined,
    b: undefined
  };

  constructor(args: CalendarDayOptions) {
    super();
    this.date = args.date;
    this.timerPastRecords = args.timerPastRecords || [];
    if (args.colors) {
      this.colors = args.colors;
    }
  }

  addTimerPastRecord(timerPastRecord: TimerPastRecord): void {
    this.timerPastRecords.push(timerPastRecord);
  }

  getParentIds2Counts(): { [key: string]: number } {
    const parentId2count = {};
    this.timerPastRecords.forEach(timerPastRecord => {
      parentId2count[timerPastRecord.parentId] = parentId2count.hasOwnProperty(timerPastRecord.parentId) ?
        parentId2count[timerPastRecord.parentId] + 1 : 1;
    });
    return parentId2count;
  }
}

export class Calendar {
  public years: CalendarOfTimers = {};

  constructor() { }

  static fromTimerPastRecordList(timers: TimerPastRecord[]) {
    const self = new Calendar();
    timers.forEach(timer => {
      self.upsertDay(timer);
    });

    return self;
  }

  static zeroIndexedWeekInMonth(date: Date): number {
    return Math.ceil((date.getDate() - date.getDay()) / 7);
  }

  static emptyMonth() {
    return [
      // tslint:disable:max-line-length
      [new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay()],
      [new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay()],
      [new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay()],
      [new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay()],
      [new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay(), new EmptyCalendarDay()]
      // tslint:enable:max-line-length
    ] as CalendarEmptyMonth;
  }

  upsertDay(timerPastRecord: TimerPastRecord) {
    const date = new Date(timerPastRecord.start);

    const year = date.getFullYear();
    const month = date.getMonth();
    const week = Calendar.zeroIndexedWeekInMonth(date);

    this.years[year] = this.years[year] || {};
    this.years[year][month] = this.years[year][month] || Calendar.emptyMonth();

    if (!(this.years[year][month][week][date.getDay()] instanceof CalendarDay)) {
      this.years[year][month][week][date.getDay()] = new CalendarDay({
        date: date
      });
    }

    // console.log(year, month, week, date.getDay(), this.years[year][month][week][date.getDay()]);
    // TODO Itterate from timerPastRecord.start to timerPastRecord.stop, adding entries with
    // times -- use timer.start->23:59:59.999 on day one,
    // on intermediate days use 00:00:00 to 23:59:59.999
    // on end day use 00:00:00 to timer.end
    this.years[year][month][week][date.getDay()].addTimerPastRecord(timerPastRecord);
  }

  addDatesForDaysWithoutData() {
    Object.keys(this.years).forEach(yearKey => {
      const yearNum = Number(yearKey);

      Object.keys(this.years[yearKey]).forEach(monthKey => {
        const monthNum = Number(monthKey);
        const lastDayOfMonth = new Date(yearNum, monthNum + 1, 0).getDate();

        for (let dayOfMonth = 1; dayOfMonth <= lastDayOfMonth; dayOfMonth++) {
          const dayOfMonthDate = new Date(yearNum, monthNum, dayOfMonth);
          const weekInMonth = Calendar.zeroIndexedWeekInMonth(dayOfMonthDate);
          const day = dayOfMonthDate.getDay();

          if (!(this.years[yearKey][monthKey][weekInMonth][day] instanceof CalendarDay)) {
            this.years[yearKey][monthKey][weekInMonth][day].setDate(
              new Date(yearNum, monthNum, dayOfMonth)
            );

          }
        }
      });
    });

  }
}

