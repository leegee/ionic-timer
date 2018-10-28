import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: './tabs/tabs.module#TabsPageModule' },
  { path: 'new-timer', loadChildren: './new-timer/new-timer.module#NewTimerPageModule' },
  { path: 'day-details', loadChildren: './day-details/day-details.module#DayDetailsPageModule' },
  { path: 'edit-timer', loadChildren: './edit-timer/edit-timer.module#EditTimerPageModule' },
  { path: 'color-picker', loadChildren: './color-picker-popover/color-picker-popover#ColorPickerPopoverComponentModule'}
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
