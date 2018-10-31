import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarPage } from './calendar.page';
import { BarChartModule } from '../charts/bar-chart/bar-chart.module';

@NgModule({
  imports: [
    BarChartModule,
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: CalendarPage }])
  ],
  declarations: [CalendarPage]
})
export class CalendarPageModule {}
