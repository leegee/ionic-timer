import { NavParams, PopoverController } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { Colors } from '../Colors';

@Component({
  selector: 'color-picker-popover',
  templateUrl: 'color-picker-popover.html'
})
export class ColorPickerPopoverComponent implements OnInit {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalColor: string;
  private chosenColor: string;
  private red = 255;
  private green = 255;
  private blue = 255;
  private alpha = 1;

  constructor(
    private domSanitizer: DomSanitizer,
    public popoverController: PopoverController,
    public navParams: NavParams
  ) {
    // TODO write the color to a new div and getComputedStyles, unless === 'transparent'.....
    this.originalColor = navParams.get('color') || 'rgba(250,250,250,1)';
    [this.chosenColor, this.red, this.green, this.blue, this.alpha] = Colors.rgbaFromAny(this.originalColor);
    console.log('chosenColor now', this.chosenColor, 'from', this.originalColor);
  }

  ngOnInit() {
    this.canvas = document.getElementById('picker') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');
    const image = new Image();
    image.onload = () => {
      this.ctx.drawImage(image, 0, 0, image.width, image.height);
    };
    image.src = 'assets/colorwheel.png';
  }

  getStyleAttr() {
    return this.domSanitizer.bypassSecurityTrustStyle(
      'background-color: ' + this.chosenColor
    );
  }

  setColor() {
    this.chosenColor = 'rgba(' +
      this.red + ', ' +
      this.green + ', ' +
      this.blue + ', ' +
      this.alpha +
      ')';
    console.log('Chosen color ', this.chosenColor);
  }

  pick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const imageData = this.ctx.getImageData(
      e.clientX - rect.left,
      e.clientY - rect.top,
      1, 1
    ).data;
    this.red = imageData[0];
    this.green = imageData[1];
    this.blue = imageData[2];
    console.log('Picked  ', imageData);
    this.setColor();
  }

  cncel() {
    this.popoverController.dismiss({ color: this.originalColor });
  }

  ok() {
    this.popoverController.dismiss({ color: this.chosenColor });
  }
}
