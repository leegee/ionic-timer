import { expect } from 'chai';

import { Calendar } from './Calendar';
import { TimerPastRecord } from './timer/timer.service';
import { Colors } from './charts/Colors';


describe('TimerService', () => {
    it('zeroIndexedWeekInMonth', () => {
        expect(
            Calendar.zeroIndexedWeekInMonth(new Date(2018, 9, 1))
        ).to.equal(0);
    });

    it('should create a calendar for a month', () => {
        const date = new Date(2018, 0, 5);
        const fixtureRecords: TimerPastRecord[] = [
            { start: date.getTime() - 3600, stop: date.getTime(), parentId: null },
            { start: date.getTime() - 2600, stop: date.getTime(), parentId: null },
            { start: date.getTime() - 1600, stop: date.getTime(), parentId: null }
        ];
        const cal = Calendar.fromTimerPastRecordList(fixtureRecords);
        expect(cal instanceof Calendar).to.equal(true);
        expect(cal.years.hasOwnProperty(2018)).to.equal(true);
        expect(cal.years[2018].hasOwnProperty(0)).to.equal(true);
        expect(cal.years[2018][0] instanceof Array).to.equal(true);
        expect(cal.years[2018][0].length).to.equal(5);
        expect(cal.years[2018][0][0] instanceof Array).to.equal(true);
        expect(cal.years[2018][0][0].length).to.equal(7);
        expect(cal.years[2018][0][0][4] instanceof Array).to.equal(true);
        expect(cal.years[2018][0][0][4].timerPastRecords.length).to.equal(3);
    });

    it('colour range', () => {
        const min = 1;
        const max = 1000;
        const dataset = [min, max];
        const f = Colors.getColorRange(dataset);
        expect(f).to.be.instanceof(Function);
        expect(f(min)).to.equal(Colors.colourRange.min);
        expect(f(max)).to.equal(Colors.colourRange.max);
    });
});
