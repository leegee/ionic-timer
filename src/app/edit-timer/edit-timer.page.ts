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

  ngOnInit() {
    this.timerForm = this.formBuilder.group({
      name: new FormControl(this.timer.name, Validators.required),
      color: new FormControl(this.timer.color)
    });
  }

  get name() {
    return this.timerForm.get('name');
  }

  get color() {
    return this.timerForm.get('color');
  }

  cancel() {
    this.close();
  }

  async delete() {
    try {
      await this.timerService.delete(this.timer);
    } catch (e) {
      throw e;
    }
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
    console.log('got ', eDismissed.data.color);
    this.timerForm.get('color').setValue( eDismissed.data.color as string);
    console.log('set ', this.color.value);
  }
}

// chooseColor(cssRuleName: string) {
//   let modal = this.modalCtrl.create(ColorPickerPopoverComponent, {
//       color: this.selections[cssRuleName]
//   });

//   modal.onDidDismiss((data) => {
//       this.selections[cssRuleName] = data.color;
//       this.onChange();
//   });

//   modal.present();
// }

