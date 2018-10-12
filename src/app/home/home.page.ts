import { Component } from '@angular/core';
import { TimerService } from '../timer/timer.service';
import { PopoverController, FabButton } from '@ionic/angular';
import { AddNewComponent } from '../add-new/add-new.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {

  private active = false;

  constructor(
    private timerService: TimerService,
    private popoverController: PopoverController
  ) { }

  toggleTimer() {
    this.active = !this.active;
    if (this.active) {
      this.timerService.start();
    } else {
      this.timerService.stop();
    }
  }

  async addNew(e: Event): Promise<void> {
    // e.target.activated = false;
    const popover = await this.popoverController.create({
      component: AddNewComponent,
      event: e,
      componentProps: { popoverController: this.popoverController }
    });
    return await popover.present();
  }

}