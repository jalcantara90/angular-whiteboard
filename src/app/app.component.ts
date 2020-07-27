import { Component, ViewChild, ElementRef, OnInit, AfterContentInit, AfterViewInit } from '@angular/core';
import { fromEvent, zip, merge } from 'rxjs';
import { mapTo, map, scan, skipUntil, takeUntil, repeat, tap } from 'rxjs/operators';

interface Coords {
  x: number;
  y: number;
}

interface DrawEvents {
  eventType: string;
  coords: Coords;
}

interface DrawCoords {
  origin: Coords;
  coords: Coords;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;

  infiniteX = Infinity;
  infiniteY = Infinity;
  colorHue = 0;

  ngAfterViewInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.canvas.nativeElement.width = window.innerWidth - 20;
    this.canvas.nativeElement.height = window.innerHeight - 20;
    // this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    // this.ctx.moveTo(this.canvas.nativeElement.offsetLeft, this.canvas.nativeElement.offsetTop);
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'red';

    const move$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mousemove').pipe(
      map(event => this.getLocalClickCoords(event, this.canvas.nativeElement)),
    );
    const mouseDown$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mousedown')
    const mouseUp$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mouseup')

    merge(
      move$,
    ).pipe(
      skipUntil(mouseDown$),
      takeUntil(mouseUp$),
      // scan((oldState, newState) => {
      //   return {
      //     coords: newState.coords,
      //     origin: oldState.origin
      //   };
      // }, { coords: { x: null, y: null}, origin: { x: this.canvas.nativeElement.offsetLeft, y: this.canvas.nativeElement.offsetTop } }),
      repeat()
    ).subscribe((coords: Coords) => this.paint(coords));
  }

  getLocalClickCoords(event: MouseEvent, parent: HTMLCanvasElement): Coords {
    return {
      x: event.clientX - parent.offsetLeft,
      y: event.clientY - parent.offsetTop,
      // coords: {
      // },
      // origin: {
      //   x: null,
      //   y: null
      // }
    };
  }

  paint({ x, y }: Coords) {
    this.ctx.beginPath();
    if (Math.abs(this.infiniteX - x) && Math.abs(this.infiniteY - y) < 100) {
      this.ctx.moveTo(this.infiniteX, this.infiniteY);
    }
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.infiniteX = x;
    this.infiniteY = y;
    this.colorHue++;
  }

}
