import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { EditTimerPage } from './edit-timer.page';
import { ColorPickerPopoverComponentModule } from '../color-picker-popover/color-picker-popover.module';

const routes: Routes = [
  {
    path: '',
    component: EditTimerPage
  }
];

@NgModule({
  imports: [
    ColorPickerPopoverComponentModule,
    CommonModule,
    FormsModule, ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [EditTimerPage]
})
export class EditTimerPageModule {}
