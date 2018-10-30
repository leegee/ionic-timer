import 'hammerjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TimerService, TimerMetaRecord } from '../timer/timer.service';
import { PopoverController, Platform } from '@ionic/angular';
import { EditTimerPage } from '../edit-timer/edit-timer.page';
import { LoggingService, Logger } from 'ionic-logging-service';

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
  private logger: Logger;

  constructor(
    private platform: Platform,
    private timerService: TimerService,
    private popoverController: PopoverController,
    loggingService: LoggingService
  ) {
    this.logger = loggingService.getLogger('HomePage');
  }

  ngOnDestroy() {
    this.timersSubscription.unsubscribe();
  }

  async ngOnInit() {
    await this.platform.ready();
    this.timersSubscription = this.timerService.timersMeta.subscribe((timers: TimerMetaRecord[]) => {
      this.timers = this.viewableTimers(timers);
      console.log('Got %d timers', this.timers.length);
    });
  }

  viewableTimers(timers: TimerMetaRecord[]): TimerMetaRecordDisplay[] {
    const skipOppositeRecordIds = {};

    const displayable = timers.reduce((accumulator: TimerMetaRecordDisplay[], timer: TimerMetaRecord) => {
      if (skipOppositeRecordIds.hasOwnProperty(timer.id)) {
        return accumulator;
      }

      const rv = { ...timer } as any;
      rv.label = (timer.start === undefined ? 'Start' : 'Stop') + ' ' + timer.name;
      if (rv.oppositeId) {
        const oppositeRecord = timers.find(v => v.id === timer.oppositeId);
        if (oppositeRecord) {
          rv.label += ', ' + (timer.start === undefined ? 'stop ' : 'start') + ' ' + oppositeRecord.name;
          skipOppositeRecordIds[oppositeRecord.id]++;
          rv.background = 'linear-gradient( to right, ' + rv.color + ',' + oppositeRecord.color + ')';
        } else {
          this.logger.warn('oppositeId\'s record could not be found where timer.name===', timer.name);
        }
      } else {
        this.logger.debug('No oppositeId for ', rv.id, rv);
        rv.background = rv.color;
      }

      accumulator.push(rv);
      return accumulator;
    }, []);

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
        await this.timerService.resetMetaRecord(eDismissed.data.timer);
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
