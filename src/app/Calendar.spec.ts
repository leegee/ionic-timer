import { expect } from 'chai';

import { Calendar, CalendarDay } from './Calendar';
import { TimerPastRecord } from './timer/timer.service';
import { Colors } from './Colors';


describe('TimerService', () => {
    it('zeroIndexedWeekInMonth', () => {
        expect(
            Calendar.zeroIndexedWeekInMonth(new Date(2018, 9, 1))
        ).to.equal(0);
    });

    it('should create a calendar for a single month', () => {
        const date = new Date(2018, 0, 5);
        const fixtureRecords: TimerPastRecord[] = [
            { start: date.getTime() - 3600, stop: date.getTime(), parentId: null },
            { start: date.getTime() - 2600, stop: date.getTime(), parentId: null },
            { start: date.getTime() - 1600, stop: date.getTime(), parentId: null }
        ];
        const cal = Calendar.fromTimerPastRecordList(fixtureRecords);
        expect(cal).to.be.an.instanceOf(Calendar);
        expect(cal.years.hasOwnProperty(2018)).to.equal(true);
        expect(cal.years[2018].hasOwnProperty(0)).to.equal(true);
        expect(cal.years[2018][0]).to.be.an.instanceof(Array);
        expect(cal.years[2018][0].length).to.equal(5);
        expect(cal.years[2018][0][0]).to.be.an.instanceof(Array);
        expect(cal.years[2018][0][0].length).to.equal(7);
        expect(cal.years[2018][0][0][4]).to.be.an.instanceof(CalendarDay);
        expect(cal.years[2018][0][0][4].timerPastRecords.length).to.equal(3);
    });
});
