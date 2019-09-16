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

  export class Color {
    r: number = 0
    g: number = 0
    b: number = 0
    a: number = 1

    toString() {
      return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
    }
  }

  export class Matrix2D {
    m00: number = 0
    m10: number = 0

    m01: number = 0
    m11: number = 0

    m02: number = 0
    m12: number = 0

    constructor(column0?: Vec, column1?: Vec, column2?: Vec) {
      if (column0 && column1 && column2) {
        this.m00 = column0.x
        this.m10 = column0.y

        this.m01 = column1.x
        this.m11 = column1.y

        this.m02 = column2.x
        this.m12 = column2.y
      }
    }

    get hash(): number {
      return this.col(0).hash ^ (this.col(1).hash << 2) ^ (this.col(2).hash >> 2);
    }


    public get(row: number, column?: number): number {
      if (!column) {
        switch (row) {
          case 0: return this.m00;
          case 1: return this.m10;
          case 2: return this.m01;
          case 3: return this.m11;
          case 4: return this.m02;
          case 5: return this.m12;
          default:
            throw "Out of bounds";
        }
      } else {
        return this.get(row + column * 2)
      }
    }

    public set(value: number, row: number, column?: number) {
      if (!column) {
        switch (row) {
          case 0: this.m00 = value; break;
          case 1: this.m10 = value; break;
          case 2: this.m01 = value; break;
          case 3: this.m11 = value; break;
          case 4: this.m02 = value; break;
          case 5: this.m12 = value; break;

          default:
            throw "Invalid matrix index!"
        }
      } else {
        this.set(value, row + column * 2)
      }
    }

    public col(index: number): Vec {
      switch (index) {
        case 0: return vec(this.m00, this.m10)
        case 1: return vec(this.m01, this.m11)
        case 2: return vec(this.m02, this.m12)
        default:
          throw "Invalid column index!"
      }
    }

    public row(index: number): Vec {
      switch (index) {
        case 0: vec(this.m00, this.m01, this.m02);
        case 1: vec(this.m10, this.m11, this.m12);
        default:
          throw "Invalid row index!"
      }
    }

    public setCol(index: number, column: Vec) {
      this.set(0, index, column.x)
      this.set(1, index, column.y)
    }

    public setRow(index: number, row: Vec) {
      this.set(index, 0, row.x)
      this.set(index, 1, row.y)
      this.set(index, 2, row.z)
    }

    public equals(rhs: Matrix2D): boolean {
      return this.col(0).equals(rhs.col(0))
        && this.col(1).equals(rhs.col(1))
        && this.col(2).equals(rhs.col(2))
    }

    public mult(rhs: Matrix2D): Matrix2D {
      let lhs = this
      let res = new Matrix2D
      let rhs_ = <Matrix2D>rhs
      res.m00 = lhs.m00 * rhs_.m00 + lhs.m01 * rhs_.m10
      res.m01 = lhs.m00 * rhs_.m01 + lhs.m01 * rhs_.m11
      res.m02 = lhs.m00 * rhs_.m02 + lhs.m01 * rhs_.m12 + lhs.m02

      res.m10 = lhs.m10 * rhs_.m00 + lhs.m11 * rhs_.m10
      res.m11 = lhs.m10 * rhs_.m01 + lhs.m11 * rhs_.m11
      res.m12 = lhs.m10 * rhs_.m02 + lhs.m11 * rhs_.m12 + lhs.m12
      return res
    }

    public multVec(rhs: Vec): Vec {
      let lhs = this
      // Transform vector
      let res = vec()
      let vector = <Vec>rhs
      res.x = lhs.m00 * vector.x + lhs.m01 * vector.y + lhs.m02;
      res.y = lhs.m10 * vector.x + lhs.m11 * vector.y + lhs.m12;
      return res
    }

    public multiplyPoint(point: Vec): Vec {
      let res = vec()
      res.x = this.m00 * point.x + this.m01 * point.y + this.m02;
      res.y = this.m10 * point.x + this.m11 * point.y + this.m12;
      return res
    }
    public multiplyVector(vector: Vec): Vec {
      let res = vec()
      res.x = this.m00 * vector.x + this.m01 * vector.y;
      res.y = this.m10 * vector.x + this.m11 * vector.y;
      return res;
    }

    public static get zero(): Matrix2D {
      return new Matrix2D(vec(0, 0), vec(0, 0), vec(0, 0));
    }

    public static get identity(): Matrix2D {
      return new Matrix2D(vec(1, 0), vec(0, 1), vec(0, 0));
    }

    public inverse(): Matrix2D {
      let invMat: Matrix2D = new Matrix2D()

      let det = this.get(0, 0) * this.get(1, 1) - this.get(0, 1) * this.get(1, 0);
      if (0.0 === det)
        return Matrix2D.zero

      let invDet = 1.0 / det;

      invMat.set(0, 0, this.get(1, 1) * invDet)
      invMat.set(0, 1, -this.get(0, 1) * invDet)
      invMat.set(1, 0, -this.get(1, 0) * invDet)
      invMat.set(1, 1, this.get(0, 0) * invDet)

      // Do the translation part
      invMat.set(0, 2, -(this.get(0, 2) * invMat.get(0, 0) + this.get(1, 2) * invMat.get(0, 1)))
      invMat.set(1, 2, -(this.get(0, 2) * invMat.get(1, 0) + this.get(1, 2) * invMat.get(1, 1)))

      return invMat;
    }

    public static scale(vector: Vec): Matrix2D {
      let m = new Matrix2D;
      m.m00 = vector.x; m.m01 = 0; m.m02 = 0;
      m.m10 = 0; m.m11 = vector.y; m.m12 = 0;
      return m;
    }

    public static translate(vector: Vec): Matrix2D {
      let m = new Matrix2D;
      m.m00 = 1; m.m01 = 0; m.m02 = vector.x;
      m.m10 = 0; m.m11 = 1; m.m12 = vector.y;
      return m;
    }

    public static rotate(angleRadians: number): Matrix2D {
      return this.rotateLH(angleRadians);
    }

    public static rotateRH(angleRadians: number): Matrix2D {
      return this.rotateLH(-angleRadians);
    }

    public static rotateLH(angleRadians: number): Matrix2D {
      // No SinCos? I hope the compiler optimizes this
      let s = Math.sin(angleRadians);
      let c = Math.cos(angleRadians);

      let m: Matrix2D = new Matrix2D
      m.m00 = c; m.m10 = -s;
      m.m01 = s; m.m11 = c;
      m.m02 = 0.0; m.m12 = 0.0;
      return m;
    }

    public static skewX(angleRadians: number): Matrix2D {
      let m = new Matrix2D
      m.m00 = 1.0; m.m01 = Math.tan(angleRadians); m.m02 = 0
      m.m10 = 0; m.m11 = 1.0; m.m12 = 0
      return m;
    }

    public static skewY(angleRadians: number): Matrix2D {
      let m = new Matrix2D
      m.m00 = 1.0; m.m01 = 0; m.m02 = 0;
      m.m10 = Math.tan(angleRadians); m.m11 = 1.0; m.m12 = 0;
      return m;
    }

  }

  const Deg2Rad = 0.01745329251
  const Rad2Deg = 229.183118052
  const PI = 3.14159265359

  export function vec(x?: number, y?: number, z?: number): Vec {
    return Vec.new(x || 0, y || 0, z)
  }

  export function col(r: Color | number | string, g?: number, b?: number, a?: number): Color {
    if (r.hasOwnProperty('a') && r.hasOwnProperty('b')) {
      return <Color>r
    }
    let c = new Color()
    if (typeof r === "number") c.r = r
    if (!g) {
      c.g = c.r
      c.b = c.r
      return c
    }
    if (g) c.g = g
    if (b) c.b = b
    if (a) c.a = a
    return c
  }

  export function fit(value: number, oldmin: number, oldmax: number, newmin: number, newmax: number): number {
    return (value - oldmin) / (oldmax - oldmin) * (newmax - newmin) + newmin;
  }

  export function fit01(value: number, newmin: number, newmax: number) {
    return fit(value, 0, 1, newmin, newmax)
  }

  export function nrand(min: number, max: number): number {
    return fit01(Math.random(), min, max)
  }

  export function radians(degrees: number) {
    return Deg2Rad * degrees
  }

  export function degrees(radians: number) {
    return Rad2Deg * radians
  }

  // https://stackoverflow.com/a/45950044
  const kBuf = new ArrayBuffer(8);
  const kBufAsF64 = new Float64Array(kBuf);
  const kBufAsI32 = new Int32Array(kBuf);

  function hashNumber(n: number) {
    // Remove this `if` if you want 0 and -0 to hash to different values.
    if (~~n === n) {
      return ~~n;
    }
    kBufAsF64[0] = n;
    return kBufAsI32[0] ^ kBufAsI32[1];
  }

  export class Vec {
    x: number = 0.0
    y: number = 0.0
    z?: number = undefined
    w?: number = undefined

    get hash(): number {
      if (this.z) {
        return hashNumber(this.x) ^ (hashNumber(this.y) << 2) ^ (hashNumber(this.z) >> 2)
      }
      if (this.w && this.z) {
        return hashNumber(this.x) ^ (hashNumber(this.y) << 2)
          ^ (hashNumber(this.z) >> 2) ^ (hashNumber(this.w) >> 1)
      }
      return hashNumber(this.x) ^ (hashNumber(this.y) << 2)
    }

    static new(x: number, y: number, z?: number, w?: number): Vec {
      let nvec = new Vec()
      nvec.x = x
      nvec.y = y
      nvec.z = z
      nvec.w = w
      return nvec
    }

    add(vec: Vec) {
      this.x += vec.x
      this.y += vec.y
      if (this.z) {
        this.z += vec.z!
      }
      if (this.w) {
        this.w += vec.w!
      }
    }

    static sub(a: Vec, b: Vec): Vec {
      return Vec.new(a.x - b.x, a.y - b.y, a.z! - b.z!, a.w! - b.w!)
    }

    divide(value: number | Vec) {
      if (typeof value === "number") {
        this.x /= value
        this.y /= value
        this.z! /= value
        this.w! /= value
      } else {
        this.x /= value.x
        this.y /= value.y
        this.z! /= value.z!
        this.w! /= value.w!
      }
    }

    mult(value: number | Vec) {
      if (typeof value === "number") {
        this.x *= value
        this.y *= value
        this.z! *= value
        this.w! *= value
      } else {
        this.x *= value.x
        this.y *= value.y
        this.z! *= value.z!
        this.w! *= value.w!
      }
    }

    get magSq(): number {
      let sum = this.x * this.x + this.y * this.y

      if (this.z) {
        sum += this.z! * this.z!
      }
      if (this.w) {
        sum += this.w! * this.w!
      }
      return sum
    }

    limit(value: number) {
      let l = this.length
      if (l > value) {
        this.x = this.x / l * value
        this.y = this.y / l * value
        if (this.z) this.z = this.z! / l * value
        if (this.w) this.w = this.w! / l * value
      }
    }

    get clone(): Vec {
      return Vec.new(this.x, this.y, this.z, this.w)
    }

    get heading(): number {
      return Math.atan2(this.y, this.x)
    }

    normalize(): Vec {
      let cloned = this.clone
      cloned.divide(this.length)
      return cloned
    }

    equals(rhs: Vec): boolean {
      return this.x === rhs.x && this.y === rhs.y && this.z === rhs.z && this.w === rhs.w
    }

    get mag(): number {
      return this.length
    }

    get length(): number {
      return Math.sqrt(this.magSq)
    }

    static dist(a: Vec, b: Vec): number {
      return a.clone.sub(b).mag
    }

    div(value: Vec | number): Vec {
      if (typeof value === "number") {
        this.x /= value
        this.y /= value
        this.z! /= value
        this.w! /= value
      } else {

        this.x /= value.x
        this.y /= value.y
        if (this.z) {
          this.z /= value.z!
        }
        if (this.w) {
          this.w /= value.w!
        }
      }

      return this.clone
    }

    sub(vec: Vec): Vec {
      this.x -= vec.x
      this.y -= vec.y
      if (this.z) {
        this.z -= vec.z!
      }
      if (this.w) {
        this.w -= vec.w!
      }
      return this.clone
    }

    private constructor() { }
  }

  export class Transform {
    rotate: Vec = vec()
    scale: Vec = vec(1, 1)
    translate: Vec = vec()

    get matrix2D(): Matrix2D {
      return Matrix2D.translate(this.translate).mult(Matrix2D.rotate(this.rotate.x)).mult(Matrix2D.scale(this.scale))

      // return Matrix2D.scale(this.scale).mult(
      //   Matrix2D.rotate(this.rotate.x)).mult(Matrix2D.translate(this.translate))
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
      startLocation: vec()
    }
    drawCallback: FrameRequestCallback | null = null
    abstract clear(startPosition?: { x: number, y: number } | null, size?: { w: number, h: number } | null): void;

    push() {
      this.transformStack.transforms.push(new Transform)
      this.transformStack.setDirty()
    }

    translate(x: number, y: number) {
      this.transformStack.transforms[
        this.transformStack.transforms.length - 1].translate = vec(x, y)
      this.transformStack.setDirty()
    }

    scale(x: number, y: number) {
      this.transformStack.transforms[
        this.transformStack.transforms.length - 1].scale = vec(x, y)
      this.transformStack.setDirty()
    }

    rotate(theta: number) {
      this.transformStack.transforms[
        this.transformStack.transforms.length - 1].rotate = vec(radians(theta))
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

  }


  export class Canvas extends CanvasBase implements ICnv {
    // @ts-ignore
    private context: CanvasRenderingContext2D
    // @ts-ignore



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
    }
    vertex(x: number, y: number) {
      let xformed = this.transformStack.matrix2D.multiplyPoint(vec(x, y))
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
      let xformed = this.transformStack.matrix2D.multiplyPoint(vec(x, y))
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
