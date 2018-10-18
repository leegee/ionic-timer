import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimerService, Timer } from '../timer/timer.service';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-tags',
  templateUrl: 'tags.page.html',
  styleUrls: ['tags.page.scss']
})
export class TagsPage implements OnInit, OnDestroy {

  names2times: { [key: string]: Timer[] };
  constructor(
    private platform: Platform,
    private timerService: TimerService
  ) { }

  ngOnDestroy() {
  }

  async ngOnInit() {
    await this.platform.ready();
    this.names2times = await this.timerService.getAll();
  }

  get timerNames() {
    const rv = Object.keys(this.names2times || {}) || [];
    console.log('timerNames', rv);
    return rv;
  }

}
