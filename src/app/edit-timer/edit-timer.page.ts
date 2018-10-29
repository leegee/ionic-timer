import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { TimerMetaRecord, TimerService } from '../timer/timer.service';
import { NavParams, PopoverController } from '@ionic/angular';
import { ColorPickerPopoverComponent } from '../color-picker-popover/color-picker-popover';

@Component({
  selector: 'app-edit-timer',
  templateUrl: './edit-timer.page.html',
  styleUrls: ['./edit-timer.page.scss'],
})
export class EditTimerPage implements OnInit {

  private timerForm: FormGroup;
  public labelsAndValuesOfTimers: TimerMetaRecord[];
  public timer: TimerMetaRecord;
  public popoverController: PopoverController;

  constructor(
    public timerService: TimerService,
    public navParams: NavParams,
    private formBuilder: FormBuilder
  ) {
    this.popoverController = this.navParams.get('popoverController');
    this.timer = this.navParams.get('timer');
  }

  async ngOnInit() {
    this.timerForm = this.formBuilder.group({
      name: new FormControl(this.timer.name, Validators.required),
      oppositeId: new FormControl(this.timer.oppositeId),
      color: new FormControl(this.timer.color)
    });
    this.labelsAndValuesOfTimers = await this.timerService.allMeta();
  }

  get name() {
    return this.timerForm.get('name');
  }

  get color() {
    return this.timerForm.get('color');
  }

  get oppositeId() {
    return this.timerForm.get('oppositeId');
  }

  cancel() {
    this.close();
  }

  delete() {
    this.popoverController.dismiss({
      action: 'delete'
    });
    this.close();
  }

  submit() {
    this.timer.name = this.name.value;
    this.timer.color = this.color.value;
    this.timer.oppositeId = this.oppositeId.value;
    this.popoverController.dismiss({
      timer: this.timer
    });
    this.close();
  }

  close() {
    this.popoverController.dismiss();
  }

  async chooseColor(e: Event) {
    const popover = await this.popoverController.create({
      component: ColorPickerPopoverComponent,
      event: e,
      componentProps: {
        popoverController: this.popoverController,
        color: this.color.value
      }
    });

    await popover.present();

    const eDismissed = await popover.onDidDismiss();
    this.timerForm.get('color').setValue(eDismissed.data.color as string);
  }
}
