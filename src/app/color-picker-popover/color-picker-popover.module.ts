import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ColorPickerPopoverComponent } from './color-picker-popover';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [ColorPickerPopoverComponent],
  exports: [ColorPickerPopoverComponent],
  entryComponents: [ColorPickerPopoverComponent]
})
export class ColorPickerPopoverComponentModule { }
