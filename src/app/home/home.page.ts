import 'hammerjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TimerService, TimerMetaRecord } from '../timer/timer.service';
import { PopoverController, Platform } from '@ionic/angular';
import { EditTimerPage } from '../edit-timer/edit-timer.page';

export interface TimerMetaRecordDisplay extends TimerMetaRecord {
  label: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  public timersSubscription: Subscription;
  public timers: TimerMetaRecordDisplay[] = [];

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
    this.timersSubscription = this.timerService.timersMeta.subscribe((timers: TimerMetaRecord[]) => {
      this.timers = this.addViewFields(timers);
      console.log('Got %d timers', this.timers.length);
    });
    // this.timerService.init();
  }

  addViewFields(timers: TimerMetaRecord[]): TimerMetaRecordDisplay[] {
    const displayable = timers.map(timer => {
      const rv = { ...timer } as any;
      rv.label = (timer.start === undefined ? 'Start' : 'Stop') + ' ' + timer.name;
      if (rv.oppositeId) {
        rv.label += ', ' + (timer.start === undefined ? 'stop ' : 'start') + ' ' +
          timers.find(
            v => v.id === timer.oppositeId
          ).name;
      }
      return rv as TimerMetaRecordDisplay;
    });
    return displayable;
  }

  toggleTimer(timerId: string): void {
    this.timerService.toggle(timerId);
  }

  async editTimer(timerId: string, e: Event): Promise<void> {
    e.preventDefault();

    const timer = await this.timerService.getMeta(timerId);

    const popover = await this.popoverController.create({
      component: EditTimerPage,
      event: e,
      componentProps: {
        popoverController: this.popoverController,
        timer: timer
      }
    });

    await popover.present();

    const eDismissed = await popover.onDidDismiss();
    if (eDismissed.data) {
      console.log(eDismissed.data);
      if (eDismissed.data.action) {
        await this.timerService.delete(timer);
      } else {
        await this.timerService.updateMeta(eDismissed.data.timer);
      }
    }
  }

  async addNew(e: Event): Promise<void> {
    const popover = await this.popoverController.create({
      component: EditTimerPage,
      event: e,
      componentProps: {
        popoverController: this.popoverController,
        timer: {
          name: '',
          oppositeId: undefined,
          color: undefined
        }
      }
    });

    await popover.present();

    const eDismissed = await popover.onDidDismiss();
    if (eDismissed.data) {
      await this.timerService.addNewTimer(eDismissed.data.timer);
    }
  }

  reorderItems(indexes) {
    // let element = this.items[indexes.from];
    // this.items.splice(indexes.from, 1);
    // this.items.splice(indexes.to, 0, element);
  }

}
