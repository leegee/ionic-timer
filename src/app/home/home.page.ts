import { Component, OnInit } from '@angular/core';
import { TimerService } from '../timer/timer.service';
import { PopoverController, FabButton, Platform } from '@ionic/angular';
import { NewTimerPage } from '../new-timer/new-timer.page';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {

  private active = false;
  timers: Object;

  constructor(
    private platform: Platform,
    private timerService: TimerService,
    private popoverController: PopoverController
  ) { }

  async ngOnInit() {
    await this.platform.ready();
    this.timers = await this.timerService.list();
  }

  toggleTimer() {
    this.active = !this.active;
    // if (this.active) {
    //   this.timerService.start(name);
    // } else {
    //   this.timerService.stop(name);
    // }
  }

  async addNew(e: Event): Promise<void> {
    // e.target.activated = false;
    const popover = await this.popoverController.create({
      component: NewTimerPage,
      event: e,
      componentProps: { popoverController: this.popoverController }
    });
    return await popover.present();
  }

  list() {
    // const rv = Object.keys(this.timers).sort().map((v, i, a) => {
    //   console.log(':::', v, i, a);
    //   return a.push(this.timers[v]);
    // });
    // console.log('rv', rv);
  }

  reorderItems(indexes) {
    // let element = this.items[indexes.from];
    // this.items.splice(indexes.from, 1);
    // this.items.splice(indexes.to, 0, element);
  }

}
