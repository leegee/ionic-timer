import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { TimerMetaRecord, TimerService } from '../timer/timer.service';
import { NavParams, PopoverController } from '@ionic/angular';
import { ColorPickerPopoverComponent } from '../color-picker-popover/color-picker-popover';
// import { Emojis } from '../Emojis';


@Component({
  selector: 'app-edit-timer',
  templateUrl: './edit-timer.page.html',
  styleUrls: ['./edit-timer.page.scss'],
})
export class EditTimerPage implements OnInit {

  public title: string;
  private timerForm: FormGroup;
  public labelsAndValuesOfPossibleOpposites: TimerMetaRecord[];
  public timer: TimerMetaRecord;
  public popoverController: PopoverController;

  constructor(
    public timerService: TimerService,
    public navParams: NavParams,
    // public actionSheetController: ActionSheetController,
    private formBuilder: FormBuilder
  ) {
    this.popoverController = this.navParams.get('popoverController');
    this.timer = this.navParams.get('timer');
    this.title = this.timer.id ? `Edit '${this.timer.name}'` : 'New Timer';
  }

  async ngOnInit() {
    this.timerForm = this.formBuilder.group({
      name: new FormControl(this.timer.name, Validators.required),
      color: new FormControl(this.timer.color),
      oppositeId: new FormControl(this.timer.oppositeId)
    });
    this.labelsAndValuesOfPossibleOpposites = await this.timerService.allMeta()
      .filter(record => record.id !== this.timer.id && !record.oppositeId);
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
    console.log(this.timerForm);
    console.log(eDismissed.data);
    this.timerForm.get('color').setValue(eDismissed.data.color as string);
  }

  // async namePressed() {
  //   const actionSheet = await this.actionSheetController.create({
  //     header: 'Emojis',
  //     cssClass: 'emojis',
  //     buttons: Emojis.list().map(emoji => {
  //       return {
  //         text: emoji,
  //         role: '',
  //         // icon: '',
  //         handler: (e) => {
  //           console.log(' clicked', e);
  //         }
  //       } as ActionSheetButton;
  //     })
  //   });

  //   await actionSheet.present();
  // }
}
