namespace CNV {
  export class Timer {
    now: number = 0
    deltaTime: number = 0
    frameCount: number = 0

    private lastTime: number = 0
    update() {
      this.lastTime = this.now
      this.now = window.performance.now()
      this.deltaTime = this.now - this.lastTime
      this.frameCount++
    }
  }

  export class Transform {
    rotate: Vector2 = vec2()
    scale: Vector2 = vec2(1, 1)
    translate: Vector2 = vec2()

    get matrix2D(): Matrix2D {
      return Matrix2D.translate(this.translate).mult(Matrix2D.rotate(this.rotate.x)).mult(Matrix2D.scale(this.scale))
    }
  }

  class TransformStack {
    public transforms: Array<Transform> = []
    private cachedMatrix: Matrix2D = new Matrix2D
    private isDirtyTransform: boolean = true

    get matrix2D(): Matrix2D {
      if (this.isDirtyTransform) {
        this.cachedMatrix = Matrix2D.identity
        for (let x = this.transforms.length - 1; x >= 0; x--) {
          // for (let transform of this.transforms) {
          let transform = this.transforms[x]
          this.cachedMatrix = <Matrix2D>this.cachedMatrix.mult(transform.matrix2D)
        }
        this.isDirtyTransform = false
      }
      return this.cachedMatrix
    }

    setDirty() {
      this.isDirtyTransform = true
    }
  }

  export interface ICnv {
    init(id: string, width: number, height: number): void;
    clear(startPosition?: { x: number, y: number } | null, size?: { w: number, h: number } | null): void;
    setDrawCallback(callback: FrameRequestCallback): void;
    setBackground(color: Color | number | string, g?: number, b?: number, a?: number): void
    drawLoop(): void
    setDrawCallback(callback: FrameRequestCallback): void
    fill(color: Color | number | string, g?: number, b?: number, a?: number): void
    stroke(color: Color | number | string, g?: number, b?: number, a?: number): void

    push(): void
    translate(x: number, y: number): void
    scale(x: number, y: number): void
    rotate(theta: number): void

    pop(): Transform
  }

  abstract class CanvasBase {
    time: Timer = new Timer()

    width: number = 0
    height: number = 0

    transformStack: TransformStack = new TransformStack

    drawingState = {
      hasStroke: false,
      hasFill: false,
      isShapeStarted: false,
      startLocation: vec2()
    }
    drawCallback: FrameRequestCallback | null = null
    abstract clear(startPosition?: { x: number, y: number } | null, size?: { w: number, h: number } | null): void;

    push() {
      this.transformStack.transforms.push(new Transform)
      this.transformStack.setDirty()
    }

    translate(x: number, y: number) {
      this.transformStack.transforms[
        this.transformStack.transforms.length - 1].translate = vec2(x, y)
      this.transformStack.setDirty()
    }

    scale(x: number, y: number) {
      this.transformStack.transforms[
        this.transformStack.transforms.length - 1].scale = vec2(x, y)
      this.transformStack.setDirty()
    }

    rotate(theta: number) {
      this.transformStack.transforms[
        this.transformStack.transforms.length - 1].rotate = vec2(radians(theta))
      this.transformStack.setDirty()
    }

    pop(): Transform {
      this.transformStack.setDirty()
      return <Transform>this.transformStack.transforms.pop()
    }

    init(id: any | string, width: number, height: number) {
      this.width = width
      this.height = height
    }


    static drawLoop(that: CanvasBase) {
      that.clear()
      that.time.update()
      //@ts-ignore
      that.drawCallback()
    }

    abstract drawLoop(): void;

    setDrawCallback(callback: FrameRequestCallback) {
      this.drawCallback = callback
    }
    abstract setOnClickCallback(callback: Function): void;

  }

  export class Canvas extends CanvasBase implements ICnv {
    // @ts-ignore
    private context: CanvasRenderingContext2D
    // @ts-ignore
    private canvas: HTMLCanvasElement

    setOnClickCallback(callback: Function) {
      // Add event listener for `click` events.
      let elemLeft = this.canvas.offsetLeft
      let elemTop = this.canvas.offsetTop
      this.canvas.addEventListener('click', function(event) {
        var x = event.pageX - elemLeft,
            y = event.pageY - elemTop;
        callback(x, y)
      }, false);
    }

    init(id: any | string, width: number, height: number) {
      super.init(id, width, height)

      let canvasElement = document.getElementById(<string>id)
      if (canvasElement != null) {
        // @ts-ignore
        canvasElement.width = width
        // @ts-ignore
        canvasElement.height = height
      }
      let htmlCanvasElement = <HTMLCanvasElement>canvasElement
      // Get the device pixel ratio, falling back to 1.
      var dpr = window.devicePixelRatio || 1;
      // Get the size of the canvas in CSS pixels.
      var rect = htmlCanvasElement.getBoundingClientRect();
      // Give the canvas pixel dimensions of their CSS
      // size * the device pixel ratio.
      htmlCanvasElement.width = rect.width * dpr;
      htmlCanvasElement.height = rect.height * dpr;

      htmlCanvasElement.style.width = `${rect.width}px`;
      htmlCanvasElement.style.height = `${rect.height}px`;

      // @ts-ignore
      this.context = (<HTMLCanvasElement>canvasElement).getContext('2d')
      this.context.scale(dpr, dpr);

      this.canvas = <HTMLCanvasElement>canvasElement
    }
    vertex(x: number, y: number) {
      let xformed = this.transformStack.matrix2D.multiplyPoint(vec2(x, y))
      if (this.drawingState.isShapeStarted) {
        this.drawingState.isShapeStarted = false
        this.context.moveTo(xformed.x, xformed.y)
        this.drawingState.startLocation = xformed
      } else {
        this.context.lineTo(xformed.x, xformed.y)
      }
    }

    rect(x: number, y: number, width: number, height: number) {
      // TODO fix scale
      let xformed = this.transformStack.matrix2D.multiplyPoint(vec2(x, y))
      if (this.drawingState.hasFill) {
        this.context.fillRect(xformed.x, xformed.y, width, height)
      }
      if (this.drawingState.hasStroke) {
        this.context.strokeRect(xformed.x, xformed.y, width, height)
      }
    }

    beginShape() {
      this.drawingState.isShapeStarted = true
      this.context.beginPath();
    }

    endShape(isClosed?: boolean) {
      if (isClosed === true) {
        this.context.lineTo(this.drawingState.startLocation.x,
          this.drawingState.startLocation.y)
      }

      this.context.closePath();

      if (this.drawingState.hasFill) {
        this.context.fill()
      }

      if (this.drawingState.hasStroke) {
        this.context.stroke()
      }
    }

    clear(startPosition?: { x: number, y: number } | null, size?: { w: number, h: number } | null) {
      startPosition = startPosition || { x: 0, y: 0 }
      size = size || { w: this.width, h: this.height }
      this.context.clearRect(startPosition.x, startPosition.y, size.w, size.h)
    }

    setBackground(color: Color | number | string, g?: number, b?: number, a?: number) {
      this.context.fillStyle = col(color, g, b, a).toString()
      this.context.fillRect(0, 0, this.width, this.height);
    }


    fill(color: Color | number | string, g?: number, b?: number, a?: number) {
      this.context.fillStyle = col(color, g, b, a).toString()
      this.drawingState.hasFill = true
    }

    stroke(color: Color | number | string, g?: number, b?: number, a?: number) {
      this.context.strokeStyle = col(color, g, b, a).toString()
      this.drawingState.hasStroke = true
    }

    drawLoop(): void {
      Canvas.drawLoop(this)
    }

    static drawLoop(that: Canvas) {
      CanvasBase.drawLoop(that)
      window.requestAnimationFrame(function (timestamp) {
        Canvas.drawLoop(that)
      })
    }
  }
}
