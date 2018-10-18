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
  colour = '#ffffff';

  constructor(
    private navParams: NavParams,
    private timerService: TimerService
  ) {
    this.popoverController = navParams.get('popoverController');
  }

  submit() {
    this.close();
    if (this.colour.length + this.name.length > 0) {
      this.timerService.addNew(this.name, this.colour);
    }
  }

  close() {
    this.popoverController.dismiss();
  }
}
