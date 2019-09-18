namespace CNV {
  const Deg2Rad = 0.01745329251
  const Rad2Deg = 229.183118052
  const PI = 3.14159265359

  export class Mathf {
    static clamp(value: number, min: number, max: number) {
      return value < min ? min : value > max ? max : value
    }

    static clamp01(value: number) {
      return this.clamp(value, 0, 1)
    }
    static sign(f: number): number { return f >= 0 ? 1 : -1; }
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

    constructor(column0?: Vector2, column1?: Vector2, column2?: Vector2) {
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

    public col(index: number): Vector2 {
      switch (index) {
        case 0: return vec2(this.m00, this.m10)
        case 1: return vec2(this.m01, this.m11)
        case 2: return vec2(this.m02, this.m12)
        default:
          throw "Invalid column index!"
      }
    }

    public row(index: number): Vector2 {
      switch (index) {
        case 0: vec3(this.m00, this.m01, this.m02);
        case 1: vec3(this.m10, this.m11, this.m12);
        default:
          throw "Invalid row index!"
      }
    }

    public setCol(index: number, column: Vector2) {
      this.set(0, index, column.x)
      this.set(1, index, column.y)
    }

    public setRow(index: number, row: Vector3) {
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

    public multVec(rhs: Vector2): Vector2 {
      let lhs = this
      // Transform vector
      let res = vec2()
      let vector = <Vector2>rhs
      res.x = lhs.m00 * vector.x + lhs.m01 * vector.y + lhs.m02;
      res.y = lhs.m10 * vector.x + lhs.m11 * vector.y + lhs.m12;
      return res
    }

    public multiplyPoint(point: Vector2): Vector2 {
      let res = vec2()
      res.x = this.m00 * point.x + this.m01 * point.y + this.m02;
      res.y = this.m10 * point.x + this.m11 * point.y + this.m12;
      return res
    }
    public multiplyVector(vector: Vector2): Vector2 {
      let res = vec2()
      res.x = this.m00 * vector.x + this.m01 * vector.y;
      res.y = this.m10 * vector.x + this.m11 * vector.y;
      return res;
    }

    public static get zero(): Matrix2D {
      return new Matrix2D(vec2(0, 0), vec2(0, 0), vec2(0, 0));
    }

    public static get identity(): Matrix2D {
      return new Matrix2D(vec2(1, 0), vec2(0, 1), vec2(0, 0));
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

    public static scale(vector: Vector2): Matrix2D {
      let m = new Matrix2D;
      m.m00 = vector.x; m.m01 = 0; m.m02 = 0;
      m.m10 = 0; m.m11 = vector.y; m.m12 = 0;
      return m;
    }

    public static translate(vector: Vector2): Matrix2D {
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

  export class Vector3 {
    x = 0
    y = 0
    z = 0

    constructor(x: number, y: number, z: number) {
      this.x = x
      this.y = y
      this.z = z
    }
  }

  export function vec2(x?: number, y?: number): Vector2 {
    return new Vector2(x || 0, y || 0)
  }

  export function vec3(x?: number, y?: number, z?: number): Vector3 {
    return new Vector3(x || 0, y || 0, z || 0)
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

  export class Vector2 {
    x: number = 0
    y: number = 0

    static get kEpsilon(): number { return 0.00001; }

    static get kEpsilonNormalSqrt(): number { return 1e-15; }

    get 0() {
      return this.x
    }

    get 1() {
      return this.y
    }

    get hash(): number {
      return hashNumber(this.x) ^ (hashNumber(this.y) << 2)
    }

    set(newX: number, newY: number) {
      this.x = newX
      this.y = newY
    }

    lerp(a: Vector2, b: Vector2, t: number) {
      t = Mathf.clamp01(t)
      return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
    }

    lerpUnclamped(a: Vector2, b: Vector2, t: number) {
      return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
    }

    static moveTowards(current: Vector2, target: Vector2, maxDistanceDelta: number): Vector2 {
      let toVector_x = target.x - current.x;
      let toVector_y = target.y - current.y;
      let sqDist = toVector_x * toVector_x + toVector_y * toVector_y;

      if (sqDist == 0 || (maxDistanceDelta >= 0 && sqDist <= maxDistanceDelta * maxDistanceDelta)) {
        return target;
      }
      let dist = Math.sqrt(sqDist);
      return new Vector2(current.x + toVector_x / dist * maxDistanceDelta,
        current.y + toVector_y / dist * maxDistanceDelta)
    }

    scale(scale: Vector2): void { this.x *= scale.x; this.y *= scale.y; }

    static scale(a: Vector2, b: Vector2): Vector2 { return new Vector2(a.x * b.x, a.y * b.y); }

    normalize(): void {
      let mag: number = this.mag
      if (mag > Vector2.kEpsilon) {
        this.values = Vector2.divFloat(this, mag)
      } else {
        this.values = Vector2.zero
      }
    }

    equals(other: Vector2) {
      return this.x === other.x && this.y === other.y
    }

    set values(v: Vector2) {
      this.x = v.x
      this.y = v.y
    }

    get normalized() {
      let v = new Vector2(this.x, this.y)
      v.normalize()
      return v
    }


    constructor(x: number, y: number) {
      this.x = x
      this.y = y
    }

    static get zero(): Vector2 { return new Vector2(0, 0) }

    static get one(): Vector2 { return new Vector2(1, 1) }

    static get up(): Vector2 { return new Vector2(0, 1) }

    static get down(): Vector2 { return new Vector2(0, -1) }

    static get left(): Vector2 { return new Vector2(-1, 0) }

    static get right(): Vector2 { return new Vector2(1, 0) }

    static get positiveInfinity(): Vector2 {
      return new Vector2(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    }

    static get negativeInfinity(): Vector2 {
      return new Vector2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    }

    get mag(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }

    get sqrMagnitude(): number { return this.x * this.x + this.y * this.y }
    public static Angle(from: Vector2, to: Vector2): number {
      let denominator = Math.sqrt(from.sqrMagnitude * to.sqrMagnitude);
      if (denominator < Vector2.kEpsilonNormalSqrt)
        return 0

      let dot = Mathf.clamp(Vector2.dot(from, to) / denominator, -1, 1);
      return Math.acos(dot) * Rad2Deg;
    }
    public static signedAngle(from: Vector2, to: Vector2) {
      let unsigned_angle = Vector2.Angle(from, to);
      let sign = Mathf.sign(from.x * to.y - from.y * to.x);
      return unsigned_angle * sign;
    }

    get heading(): number {
      return Math.atan2(this.y, this.x)
    }

    static dist(a: Vector2, b: Vector2): number {
      let diff_x = a.x - b.x;
      let diff_y = a.y - b.y;
      return Math.sqrt(diff_x * diff_x + diff_y * diff_y);
    }

    public static limit(vector: Vector2, maxLength: number): Vector2 {
      let sqrMagnitude = vector.sqrMagnitude;
      if (sqrMagnitude > maxLength * maxLength) {
        let mag = Math.sqrt(sqrMagnitude);

        let normalized_x = vector.x / mag;
        let normalized_y = vector.y / mag;
        return new Vector2(normalized_x * maxLength,
          normalized_y * maxLength);
      }
      return vector;
    }

    limit(maxLength: number) {
      this.values = Vector2.limit(this, maxLength)
    }

    static dot(lhs: Vector2, rhs: Vector2) { return lhs.x * rhs.x + lhs.y * rhs.y; }

    static reflect(inDirection: Vector2, inNormal: Vector2): Vector2 {
      let factor = -2 * Vector2.dot(inNormal, inDirection);
      return new Vector2(factor * inNormal.x + inDirection.x, factor * inNormal.y + inDirection.y);
    }

    static perpendicular(inDirection: Vector2): Vector2 {
      return new Vector2(-inDirection.y, inDirection.x);
    }

    public static min(lhs: Vector2, rhs: Vector2) { return new Vector2(Math.min(lhs.x, rhs.x), Math.min(lhs.y, rhs.y)); }

    static max(lhs: Vector2, rhs: Vector2) {
      return new Vector2(Math.max(lhs.x, rhs.x), Math.max(lhs.y, rhs.y));
    }

    get clone() { return new Vector2(this.x, this.y) }

    public static smoothDamp(current: Vector2, target: Vector2, currentVelocity: Vector2, smoothTime: number, maxSpeed?: number, deltaTime?: number) {
      maxSpeed = maxSpeed || Number.POSITIVE_INFINITY
      deltaTime = deltaTime || 0.0
      smoothTime = Math.max(0.0001, smoothTime);
      let omega = 2 / smoothTime;

      let x = omega * deltaTime;
      let exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

      let change_x = current.x - target.x;
      let change_y = current.y - target.y;
      let originalTo = target.clone

      let maxChange = maxSpeed * smoothTime;

      let maxChangeSq = maxChange * maxChange;
      let sqDist = change_x * change_x + change_y * change_y;
      if (sqDist > maxChangeSq) {
        var mag = Math.sqrt(sqDist);
        change_x = change_x / mag * maxChange;
        change_y = change_y / mag * maxChange;
      }

      target.x = current.x - change_x;
      target.y = current.y - change_y;

      let temp_x = (currentVelocity.x + omega * change_x) * deltaTime;
      let temp_y = (currentVelocity.y + omega * change_y) * deltaTime;

      currentVelocity.x = (currentVelocity.x - omega * temp_x) * exp;
      currentVelocity.y = (currentVelocity.y - omega * temp_y) * exp;

      let output_x = target.x + (change_x + temp_x) * exp;
      let output_y = target.y + (change_y + temp_y) * exp;

      // Prevent overshooting
      let origMinusCurrent_x = originalTo.x - current.x;
      let origMinusCurrent_y = originalTo.y - current.y;
      let outMinusOrig_x = output_x - originalTo.x;
      let outMinusOrig_y = output_y - originalTo.y;

      if (origMinusCurrent_x * outMinusOrig_x + origMinusCurrent_y * outMinusOrig_y > 0) {
        output_x = originalTo.x;
        output_y = originalTo.y;

        currentVelocity.x = (output_x - originalTo.x) / deltaTime;
        currentVelocity.y = (output_y - originalTo.y) / deltaTime;
      }
      return new Vector2(output_x, output_y);
    }

    static add(a: Vector2, b: Vector2) { return new Vector2(a.x + b.x, a.y + b.y); }
    add(b: Vector2) { this.values = Vector2.add(this, b) }
    static sub(a: Vector2, b: Vector2) { return new Vector2(a.x - b.x, a.y - b.y); }
    sub(b: Vector2) { this.values = Vector2.sub(this, b) }
    static mult(a: Vector2, b: Vector2 | number) {
      if (typeof b === "number") {
        return new Vector2(a.x * <number>b, a.y * <number>b)
      } else {
        return new Vector2(a.x * b.x, a.y * b.y); 
      }
    } 
    mult(b: Vector2 | number) { this.values = Vector2.mult(this, b) }
    static div(a: Vector2, b: Vector2 | number) {
      if (typeof b === "number") {
        return new Vector2(a.x / <number>b, a.y / <number>b)
      } else {
        return new Vector2(a.x / b.x, a.y / b.y); 
      }
    }
    div(b: Vector2 | number) { this.values = Vector2.div(this, b) }
    static negate(a: Vector2) { return new Vector2(-a.x, -a.y); }
    static multFloat(a: Vector2, d: number) { return new Vector2(a.x * d, a.y * d); }
    static multVec2Float(d: number, a: Vector2) { return new Vector2(a.x * d, a.y * d); }
    static divFloat(a: Vector2, d: number) { return new Vector2(a.x / d, a.y / d); }
    static eq(lhs: Vector2, rhs: Vector2): boolean {
      let diff_x = lhs.x - rhs.x;
      let diff_y = lhs.y - rhs.y;
      return (diff_x * diff_x + diff_y * diff_y) < Vector2.kEpsilon * Vector2.kEpsilon;
    }
    static notEq(lhs: Vector2, rhs: Vector2): boolean {
      return !(lhs == rhs);
    }
  }

  // export class Vec {
  //   x: number = 0.0
  //   y: number = 0.0
  //   z?: number = undefined
  //   w?: number = undefined

  //   get hash(): number {
  //     if (this.z) {
  //       return hashNumber(this.x) ^ (hashNumber(this.y) << 2) ^ (hashNumber(this.z) >> 2)
  //     }
  //     if (this.w && this.z) {
  //       return hashNumber(this.x) ^ (hashNumber(this.y) << 2)
  //         ^ (hashNumber(this.z) >> 2) ^ (hashNumber(this.w) >> 1)
  //     }
  //     return hashNumber(this.x) ^ (hashNumber(this.y) << 2)
  //   }

  //   static new(x: number, y: number, z?: number, w?: number): Vec {
  //     let nvec = new Vec()
  //     nvec.x = x
  //     nvec.y = y
  //     nvec.z = z
  //     nvec.w = w
  //     return nvec
  //   }

  //   add(vec: Vec) {
  //     this.x += vec.x
  //     this.y += vec.y
  //     if (this.z) {
  //       this.z += vec.z!
  //     }
  //     if (this.w) {
  //       this.w += vec.w!
  //     }
  //   }

  //   static sub(a: Vec, b: Vec): Vec {
  //     return Vec.new(a.x - b.x, a.y - b.y, a.z! - b.z!, a.w! - b.w!)
  //   }

  //   divide(value: number | Vec) {
  //     if (typeof value === "number") {
  //       this.x /= value
  //       this.y /= value
  //       this.z! /= value
  //       this.w! /= value
  //     } else {
  //       this.x /= value.x
  //       this.y /= value.y
  //       this.z! /= value.z!
  //       this.w! /= value.w!
  //     }
  //   }

  //   mult(value: number | Vec) {
  //     if (typeof value === "number") {
  //       this.x *= value
  //       this.y *= value
  //       this.z! *= value
  //       this.w! *= value
  //     } else {
  //       this.x *= value.x
  //       this.y *= value.y
  //       this.z! *= value.z!
  //       this.w! *= value.w!
  //     }
  //   }

  //   get magSq(): number {
  //     let sum = this.x * this.x + this.y * this.y

  //     if (this.z) {
  //       sum += this.z! * this.z!
  //     }
  //     if (this.w) {
  //       sum += this.w! * this.w!
  //     }
  //     return sum
  //   }

  //   limit(value: number) {
  //     let l = this.length
  //     if (l > value) {
  //       this.x = this.x / l * value
  //       this.y = this.y / l * value
  //       if (this.z) this.z = this.z! / l * value
  //       if (this.w) this.w = this.w! / l * value
  //     }
  //   }

  //   get clone(): Vec {
  //     return Vec.new(this.x, this.y, this.z, this.w)
  //   }

  //   get heading(): number {
  //     return Math.atan2(this.y, this.x)
  //   }

  //   normalize(): Vec {
  //     let cloned = this.clone
  //     cloned.divide(this.length)
  //     return cloned
  //   }

  //   equals(rhs: Vec): boolean {
  //     return this.x === rhs.x && this.y === rhs.y && this.z === rhs.z && this.w === rhs.w
  //   }

  //   get mag(): number {
  //     return this.length
  //   }

  //   get length(): number {
  //     return Math.sqrt(this.magSq)
  //   }

  //   static dist(a: Vec, b: Vec): number {
  //     return a.clone.sub(b).mag
  //   }

  //   div(value: Vec | number): Vec {
  //     if (typeof value === "number") {
  //       this.x /= value
  //       this.y /= value
  //       this.z! /= value
  //       this.w! /= value
  //     } else {

  //       this.x /= value.x
  //       this.y /= value.y
  //       if (this.z) {
  //         this.z /= value.z!
  //       }
  //       if (this.w) {
  //         this.w /= value.w!
  //       }
  //     }

  //     return this.clone
  //   }

  //   sub(vec: Vec): Vec {
  //     this.x -= vec.x
  //     this.y -= vec.y
  //     if (this.z) {
  //       this.z -= vec.z!
  //     }
  //     if (this.w) {
  //       this.w -= vec.w!
  //     }
  //     return this.clone
  //   }

  //   private constructor() { }
  // }
}
