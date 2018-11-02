import { expect } from 'chai';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Platform, PopoverController, AngularDelegate } from '@ionic/angular';
import { CalendarPage } from './calendar.page';
import { Colors } from '../Colors';
import { Calendar } from '../Calendar';

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
        expect(component).to.be.an.instanceof(CalendarPage);
    });
});
