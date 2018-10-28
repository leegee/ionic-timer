import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ColorPickerPopoverComponent } from './color-picker-popover';

const routes: Routes = [
  {
    path: '',
    component: ColorPickerPopoverComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ColorPickerPopoverComponent]
})
export class ColorPickerPopoverComponentModule { }
