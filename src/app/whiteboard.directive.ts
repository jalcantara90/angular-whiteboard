import { Directive, ViewChild, ElementRef, Input, AfterViewInit } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { map, tap, skipUntil, takeUntil, repeat } from 'rxjs/operators';


interface Coords {
  x: number;
  y: number;
}

@Directive({
  selector: '[whiteboard]'
})
export class WhiteboardDirective implements AfterViewInit {

  // @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  @Input() lineJoin: CanvasLineJoin = 'round';
  @Input() lineCap: CanvasLineCap = 'round';
  @Input() lineWidth = 2;
  @Input() color: string | CanvasGradient | CanvasPattern = 'red';

  private ctx: CanvasRenderingContext2D;
  private lastPaintX = Infinity;
  private lastPaintY = Infinity;

  constructor(private canvas: ElementRef<HTMLCanvasElement>) {}

  ngAfterViewInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.canvas.nativeElement.width = this.canvas.nativeElement.parentElement.clientWidth;
    this.canvas.nativeElement.height = this.canvas.nativeElement.parentElement.clientHeight;

    const move$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mousemove').pipe(
      map(this.getLocalClickCoords.bind(this)),
    );
    const mouseDown$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mousedown');
    const mouseUp$ = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mouseup').pipe(
      tap(() => {
        this.lastPaintX = Infinity;
        this.lastPaintY = Infinity;
      })
    );

    const touchMove$ = fromEvent<TouchEvent>(this.canvas.nativeElement, 'touchmove').pipe(
      map(this.getLocalTouchCoords.bind(this)),
    );
    const touchPress$ = fromEvent<TouchEvent>(this.canvas.nativeElement, 'touchstart');
    const touchUnPress$ = fromEvent<TouchEvent>(this.canvas.nativeElement, 'touchend').pipe(
      tap(() => {
        this.lastPaintX = Infinity;
        this.lastPaintY = Infinity;
      })
    );

    const mouse$ =    move$.pipe(
      skipUntil(mouseDown$),
      takeUntil(mouseUp$),
      repeat()
    );

    const touch$ = touchMove$.pipe(
      skipUntil(touchPress$),
      takeUntil(touchUnPress$),
      repeat()
    );

    merge(
      mouse$,
      touch$
    ).subscribe((coords: Coords) => this.paint(coords));
  }

  private getLocalClickCoords(event: MouseEvent): Coords {
    return {
      x: event.offsetX,
      y: event.offsetY
    };
  }

  private getLocalTouchCoords(event: TouchEvent ) {

    const canvas = this.canvas.nativeElement;
    return {
      x: event.targetTouches[0].clientX - canvas.offsetLeft,
      y: event.targetTouches[0].clientY - canvas.offsetTop,
    };
  }

  private paint({ x, y }: Coords) {
    this.ctx.lineJoin = this.lineJoin;
    this.ctx.lineCap = this.lineCap;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.color;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastPaintX, this.lastPaintY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastPaintX = x;
    this.lastPaintY = y;
  }

}
