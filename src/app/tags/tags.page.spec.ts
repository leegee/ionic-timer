import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Platform } from '@ionic/angular';
import { TagsPage } from './tags.page';

describe('TagsPage', () => {
    let component: TagsPage;
    let fixture: ComponentFixture<TagsPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TagsPage],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [Platform]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TagsPage);
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
        const months = component.months(2018);
        expect(months instanceof Array).toBe(true);
        expect(months.length).toEqual(1);
    });

    it('should start 2018-10 on Monday with 6 empty days', () => {
        let blankDays = 0;
        let daysNotBlank = 0;
        const days = component.daysOfMonth(2018, 9);
        expect(days instanceof Array).toBe(true);
        days.forEach(day => {
            expect(day instanceof Array).toBe(true);
            if (day.length > 0) {
                daysNotBlank++;
            } else {
                blankDays++;
            }
        });
        expect(blankDays).toEqual(6);
        expect(daysNotBlank).toEqual(31);
        expect(days.length - blankDays).toEqual(31);
    });

});
