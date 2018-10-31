import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarChartComponent } from './bar-chart.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule
  ],
  declarations: [BarChartComponent],
  exports: [BarChartComponent]
})
export class BarChartModule { }

