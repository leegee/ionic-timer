import { Component, OnInit } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';

@Component({
  selector: 'app-add-new',
  templateUrl: './add-new.component.html',
  styleUrls: ['./add-new.component.scss']
})
export class AddNewComponent {

  popoverController: PopoverController;

  constructor(navParams: NavParams) {
    this.popoverController = navParams.get('popoverController');
  }

  close() {
    this.popoverController.dismiss();
  }

}
