import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Platform, PopoverController, AngularDelegate } from '@ionic/angular';
import { CalendarPage } from './calendar.page';

describe('CalendarPage', () => {
    let component: CalendarPage;
    let fixture: ComponentFixture<CalendarPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CalendarPage],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                Platform,
                PopoverController,
                AngularDelegate
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CalendarPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('it should list months with content', () => {
        component.calendar[2018] = {};
        component.calendar[2018][9] = [
            [ // 5 weeks
                [], [], [], [], [], [], [] // 7 days
            ], [
                [], [], [], [], [], [], []
            ], [
                [], [], [], [], [], [], []
            ], [
                [], [], [], [], [], [], []
            ], [
                [], [], [], [], [], [], []
            ]
        ];
        const months = component.monthsWithData(2018);
        expect(months instanceof Array).toBe(true);
        expect(months.length).toEqual(1);
    });
});
