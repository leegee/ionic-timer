import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabsPageRoutingModule } from './tabs.router.module';

import { TabsPage } from './tabs.page';
import { CalendarPageModule } from '../calendar/calendar.module';
import { AboutPageModule } from '../about/about.module';
import { HomePageModule } from '../home/home.module';
import { NewTimerPageModule } from '../new-timer/new-timer.module';
import { DayDetailsPageModule } from '../day-details/day-details.module';
import { EditTimerPageModule } from '../edit-timer/edit-timer.module';
import { ColorPickerPopoverComponentModule } from '../color-picker-popover/color-picker-popover.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    HomePageModule,
    NewTimerPageModule,
    DayDetailsPageModule,
    EditTimerPageModule,
    ColorPickerPopoverComponentModule,
    AboutPageModule,
    CalendarPageModule
  ],
  declarations: [TabsPage]
})
export class TabsPageModule {}
