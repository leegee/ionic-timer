import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimerService } from '../timer/timer.service';
import { PopoverController, FabButton, Platform } from '@ionic/angular';
import { NewTimerPage } from '../new-timer/new-timer.page';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {

  private active = false;
  public timersSubscription: Subscription;
  public timers: { [key: string]: Object[] } = {};

  constructor(
    private platform: Platform,
    private timerService: TimerService,
    private popoverController: PopoverController
  ) { }

  ngOnDestroy() {
    this.timersSubscription.unsubscribe();
  }

  async ngOnInit() {
    await this.platform.ready();
    this.timersSubscription = this.timerService.changeAnnounced$.subscribe(
      (changed: { [key: string]: any }) => {
        console.log(`**** `, changed);
        this.timers = Object.assign(this.timers, changed);
      }
    );
    console.log('this.timers', this.timers);
  }

  toggleTimer(timerName: string): void {
    this.timerService.toggle(timerName);
  }

  async addNew(e: Event): Promise<void> {
    const popover = await this.popoverController.create({
      component: NewTimerPage,
      event: e,
      componentProps: { popoverController: this.popoverController }
    });
    return await popover.present();
  }

  get timerNames() {
    return Object.keys(this.timers) || [];
  }

  getTimer(name) {
    return this.timers[name];
  }

  reorderItems(indexes) {
    // let element = this.items[indexes.from];
    // this.items.splice(indexes.from, 1);
    // this.items.splice(indexes.to, 0, element);
  }

}
