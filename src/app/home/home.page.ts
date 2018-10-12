import { Component } from '@angular/core';
import { TimerService } from '../timer/timer.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {

  private active = false;

  constructor(
    private timerService: TimerService
  ) { }

  toggleTimer() {
    this.active = !this.active;
    if (this.active) {
      this.timerService.start();
    } else {
      this.timerService.stop();
    }
  }
}
