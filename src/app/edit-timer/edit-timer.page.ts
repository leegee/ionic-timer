import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { TimerMetaRecord, TimerService } from '../timer/timer.service';
import { NavParams, PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-edit-timer',
  templateUrl: './edit-timer.page.html',
  styleUrls: ['./edit-timer.page.scss'],
})
export class EditTimerPage implements OnInit {

  private timerForm: FormGroup;

  public timerId: string;
  public timer: TimerMetaRecord;
  public popoverController: PopoverController;

  constructor(
    public timerService: TimerService,
    public navParams: NavParams,
    private formBuilder: FormBuilder
  ) {
    this.popoverController = this.navParams.get('popoverController');
    this.timerId = this.navParams.get('timerId');
  }

  ngOnInit() {
    this.timer = this.timerService.getMeta(this.timerId);
    this.timerForm = this.formBuilder.group({
      name: new FormControl(this.timer.name, Validators.required)
    });
  }

  get name() {
    return this.timerForm.get('name');
  }

  get color() {
    return this.timerForm.get('name');
  }

  cancel() {
    this.close();
  }

  async submit() {
    this.timer.name = this.name.value;
    this.timer.color = this.color.value;
    try {
      await this.timerService.updateMeta(this.timer);
    } catch (e) {
      throw e;
    }
    this.close();
  }

  close() {
    this.popoverController.dismiss();
  }

}
