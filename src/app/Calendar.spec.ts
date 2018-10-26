import { TestBed } from '@angular/core/testing';
import { Calendar } from './Calendar';
import { TimerPastRecord } from './timer/timer.service';


describe('TimerService', () => {
    it('zeroIndexedWeekInMonth', () => {
        expect(
            Calendar.zeroIndexedWeekInMonth(new Date(2018, 9, 1))
        ).toBe(0);
    });

    it('should create a calendar for a month', () => {
        const date = new Date(2018, 0, 5);
        const fixtureRecords: TimerPastRecord[] = [
            { start: date.getTime() - 3600, stop: date.getTime(), parentId: null },
            { start: date.getTime() - 2600, stop: date.getTime(), parentId: null },
            { start: date.getTime() - 1600, stop: date.getTime(), parentId: null }
        ];
        const cal = Calendar.fromTimerPastRecordList(fixtureRecords);
        expect(cal instanceof Calendar).toBe(true);
        expect(cal.data.hasOwnProperty(2018)).toBe(true);
        expect(cal.data[2018].hasOwnProperty(0)).toBe(true);
        expect(cal.data[2018][0] instanceof Array).toBe(true);
        expect(cal.data[2018][0].length).toBe(5);
        expect(cal.data[2018][0][0] instanceof Array).toBe(true);
        expect(cal.data[2018][0][0].length).toBe(7);
        expect(cal.data[2018][0][0][4] instanceof Array).toBe(true);
        expect(cal.data[2018][0][0][4].length).toBe(3);
    });

    // it('colour range', () => {
    //     const min = 1;
    //     const max = 1000;
    //     const dataset = [min, max];
    //     const f = Calendar.getColorRange(dataset);
    //     expect(typeof f).toBe('function');
    //     expect(f(min)).toEqual(Calendar.colourRange.min);
    //     expect(f(max)).toEqual(Calendar.colourRange.max);
    // });
});
