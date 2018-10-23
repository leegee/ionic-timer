import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimerService, TimerMetaRecord } from '../timer/timer.service';
import { PopoverController, Platform } from '@ionic/angular';
import { NewTimerPage } from '../new-timer/new-timer.page';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {

  public timersSubscription: Subscription;
  public timers: TimerMetaRecord[];

  constructor(
    private platform: Platform,
    private timerService: TimerService,
    private popoverController: PopoverController
  ) { }

  ngOnDestroy() {
    this.timersSubscription.unsubscribe();
  }

  async ngOnInit() {
    console.log('Home init');
    await this.platform.ready();
    this.timersSubscription = this.timerService.timersMeta.subscribe(
      (changed: TimerMetaRecord[]) => {
        console.log(`Updated timers`, changed);
        this.timers = new Array(...changed);
      }
    );
    this.timerService.init();
  }

  toggleTimer(timerId: string): void {
    this.timerService.toggle(timerId);
  }

  async addNew(e: Event): Promise<void> {
    const popover = await this.popoverController.create({
      component: NewTimerPage,
      event: e,
      componentProps: { popoverController: this.popoverController }
    });
    return await popover.present();
  }

  reorderItems(indexes) {
    // let element = this.items[indexes.from];
    // this.items.splice(indexes.from, 1);
    // this.items.splice(indexes.to, 0, element);
  }

}
