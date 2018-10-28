import { NavParams, PopoverController } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { SafeStyle } from '@angular/platform-browser/src/security/dom_sanitization_service';

@Component({
  selector: 'color-picker-popover',
  templateUrl: 'color-picker-popover.html'
})
export class ColorPickerPopoverComponent implements OnInit {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  protected originalColor: string;
  private chosenColor: string;
  private red: number;
  private green: number;
  private blue: number;
  private alpha: number;

  constructor(
    private domSanitizer: DomSanitizer,
    public popoverController: PopoverController,
    public navParams: NavParams
  ) {
    // TODO write the color to a new div and getComputedStyles, unless === 'transparent'.....
    let color = navParams.get('color');
    if (typeof color === 'undefined' || color === 'transparent') {
      color = 'rgba(0,0,0,0)';
      console.log('No initial color specified');
    }
    this.originalColor = color;
    this.chosenColor = color;
    console.log('chosenColor now', this.chosenColor, 'from', color);
    [, this.red, this.green, this.blue, , this.alpha] = color.match(
      /^rgba?\(([.\d]+),\s*([.\d]+),\s*([.\d]+)(,\s*([.\d]+)?)?\)$/
    );
    this.alpha = typeof this.alpha === 'undefined' ? 1 : this.alpha;
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
    this.chosenColor = 'rgba(' + this.red + ', ' +
      this.green + ', ' +
      this.blue + ', ' +
      this.alpha +
      ')';
    console.log('Color ', this.chosenColor);
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
    this.setColor();
  }

  cncel() {
    this.popoverController.dismiss({ color: this.originalColor });
  }

  ok() {
    this.popoverController.dismiss({ color: this.chosenColor });
  }
}
