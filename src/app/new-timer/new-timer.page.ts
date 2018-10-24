import { Component, OnInit } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { TimerService } from '../timer/timer.service';

@Component({
  selector: 'app-new-timer',
  templateUrl: './new-timer.page.html',
  styleUrls: ['./new-timer.page.scss'],
})
export class NewTimerPage {

  popoverController: PopoverController;
  name = '';
  color = '#ffffff';

  constructor(
    private navParams: NavParams,
    private timerService: TimerService
  ) {
    this.popoverController = this.navParams.get('popoverController');
  }

  submit() {
    this.close();
    if (this.color.length + this.name.length > 0) {
      this.timerService.addNewTimer(this.name, this.color);
    }
  }

  close() {
    this.popoverController.dismiss();
  }
}
