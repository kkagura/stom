import {
  IPoint,
  IRect,
  Direction,
  extendRect,
  getRectByPoints,
  createPath,
  IMatrixArr,
  getDiretion,
  getSweepAngle,
  getOppositeDirection,
  getLineSegmentsByPoints,
  isPointNearLineSegments,
  isPointInRect
} from '@stom/geo';
import { Model, ModelClass, ModelEvents, ModelJson } from './model';
import { Animation, AnimationStatus, clearDrawStyle, createAnimation, genId } from '@stom/shared';
import { LinkControl } from './link-control';
import { CommonEvents } from './common-events';
import { Control } from './control';
import { PointControl } from './point-control';
import { Editor } from '../editor';
import { LineStyle } from './attrs';

export enum LinkModelEvents {
  PORT_CHANGE = 'port-change'
}
interface LinkModelAttrs {
  lineColor: string;
  lineWidth: number;
  lineStyle: LineStyle;
  lineJoin: CanvasLineJoin;
  lineDash: number[];
  lineDashOffset: number;
}

export class LinkModel extends Model<LinkModelAttrs> {
  static CATEGORY = 'link';
  attrs: LinkModelAttrs = {
    lineColor: '#000',
    lineWidth: 2,
    lineStyle: 'dashed',
    lineJoin: 'round',
    lineDash: [10, 10],
    lineDashOffset: -20
  };

  private controlPoints: IPoint[] = [];
  // 寻路时所有的路径点，用来debug
  private mapPoints: IPoint[] = [];

  private _endDirection: Direction = Direction.LEFT;

  private animation: Animation | null = null;

  private isCreating = false;

  private pointControls: PointControl[] = [];

  findPathPoints = () => {
    const startHost = this.start.getHost();
    const start = {
      rect: startHost.getRect(),
      origin: this.start.getSceneCenterPosition(),
      direction: this.getStartDirection()
    };

    const endOrign = 'paint' in this.end ? this.end.getSceneCenterPosition() : this.end;

    const end = {
      rect: 'paint' in this.end ? this.end.getHost().getRect() : undefined,
      origin: endOrign,
      direction: this.getEndDirection()
    };

    const { mapPoints, controlPoints } = createPath(start, end, 20);
    this.mapPoints = mapPoints;
    this.controlPoints = controlPoints;
    controlPoints.shift();
    controlPoints.pop();
    this.emit(CommonEvents.rectChange);
    this.emit(CommonEvents.change);
  };

  constructor(
    private start: LinkControl,
    private end: LinkControl | IPoint,
    public id: string = genId()
  ) {
    super(id);
    start.getHost().on(CommonEvents.rectChange, this.findPathPoints);
    if ('paint' in this.end) {
      this.end.getHost().on(CommonEvents.rectChange, this.findPathPoints);
    }
    this.startAnimation();
    this.initPointControls();
  }

  initPointControls() {
    // todo: 暂时只允许拖拽结束节点
    this.pointControls = [new PointControl(this, 'end')];
  }

  updateControlPosition() {
    const rect = this.getRect();
    this.pointControls.forEach(control => {
      if (control.getTag() === 'end') {
        const { x, y } = this.getEndPoint();
        control.setCenterPosition(x - rect.x, y - rect.y);
      }
    });
  }

  hitTest(x: number, y: number) {
    if (this.isCreating || this.getIsUpdating()) return false;
    // 先判断点是否在绘图区域内
    if (!isPointInRect({ x, y }, this.getRenderRect())) {
      return false;
    }
    // 再判断是否在控制点上
    if (this.getIsHovered()) {
      const pointControl = this.pointControls.find(el => el.hitTest(x, y));
      if (pointControl) return pointControl;
    }
    const lineSegments = getLineSegmentsByPoints(this.getAllPoints());
    return isPointNearLineSegments({ x, y }, lineSegments, this.attrs.lineWidth + 1);
  }

  getStartPoint() {
    return this.start.getSceneCenterPosition();
  }

  getEndPoint() {
    if ('paint' in this.end) {
      return this.end.getSceneCenterPosition();
    }
    return this.end;
  }

  setEnd(end: LinkControl | IPoint) {
    if (this.end === end) return;
    if ('paint' in this.end) {
      this.end.getHost().off(CommonEvents.rectChange, this.findPathPoints);
    }

    this.end = end;
    if ('paint' in end) {
      end.getHost().on(CommonEvents.rectChange, this.findPathPoints);
    }
    this.findPathPoints();
    this.updateControlPosition();
    this.emit(CommonEvents.change);
  }

  setEndDirection(endDirection: Direction) {
    if ('paint' in this.end) return;
    if (this._endDirection === endDirection) return;
    this._endDirection = endDirection;
    this.findPathPoints();
    this.emit(CommonEvents.change);
  }

  getStartDirection(): Direction {
    const controlCenter = this.start.getSceneCenterPosition();
    const hostCenter = this.start.getHost().getCenterPosition();
    const movement: [number, number] = [controlCenter.x - hostCenter.x, controlCenter.y - hostCenter.y];
    const x = getDiretion(movement);
    return getOppositeDirection(x);
  }

  getEndDirection(): Direction {
    if ('paint' in this.end) {
      const controlCenter = this.end.getSceneCenterPosition();
      const hostCenter = this.end.getHost().getCenterPosition();
      const movement: [number, number] = [controlCenter.x - hostCenter.x, controlCenter.y - hostCenter.y];
      const x = getDiretion(movement);
      return getOppositeDirection(x);
    }
    return this._endDirection;
  }

  getAllPoints() {
    const p1 = this.getStartPoint();
    const p2 = this.getEndPoint();
    return [p1, ...this.controlPoints, p2];
  }

  getRect() {
    const p1 = this.getStartPoint();
    const p2 = this.getEndPoint();
    return getRectByPoints(p1, p2, ...this.controlPoints);
    // debug
    // return getRectByPoints(p1, p2, ...this.controlPoints, ...this.mapPoints);
  }

  getRenderRect(): IRect {
    const rect = this.getRect();
    const w = Math.max(PointControl.BORDER_WIDTH, 2);
    const extend = this.attrs.lineWidth * 2 + w;
    return extendRect(rect, extend);
  }

  getSize() {
    const { width, height } = this.getRect();
    return {
      width,
      height
    };
  }

  getWorldTransform(): IMatrixArr {
    const { x, y } = this.getRect();
    return [1, 0, 0, 1, x, y];
  }

  beforePaint(ctx: CanvasRenderingContext2D, editor: Editor): void {}

  paint(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    const points = this.getAllPoints();
    const { x, y } = points.pop()!;
    const dir = this.getEndDirection();
    // 底边
    const a = 8;
    // 高
    const h = 12;
    let minX = Infinity,
      minY = Infinity;
    points.forEach((p, i) => {
      minX = Math.min(p.x, minX);
      minY = Math.min(p.y, minY);
      ctx[i ? 'lineTo' : 'moveTo'](p.x, p.y);
    });
    // 最后一个点需要留出画箭头的空间
    if (dir === Direction.LEFT) {
      ctx.lineTo(x - h / 2, y);
    } else if (dir === Direction.RIGHT) {
      ctx.lineTo(x + h / 2, y);
    } else if (dir === Direction.BOTTOM) {
      ctx.lineTo(x, y + h / 2);
    } else if (dir === Direction.TOP) {
      ctx.lineTo(x, y - h / 2);
    }
    const { attrs } = this;
    const w = attrs.lineWidth;
    ctx.strokeStyle = attrs.lineColor;
    ctx.lineJoin = attrs.lineJoin;
    ctx.lineWidth = w;
    if (attrs.lineStyle === 'dashed') {
      ctx.setLineDash(attrs.lineDash);
      ctx.lineDashOffset = attrs.lineDashOffset;
    } else if (attrs.lineStyle === 'dotted') {
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();

    // 绘制箭头等腰三角形
    ctx.beginPath();
    if (dir === Direction.LEFT) {
      ctx.moveTo(x, y);
      ctx.lineTo(x - h, y - a / 2);
      ctx.lineTo(x - h, y + a / 2);
    } else if (dir === Direction.RIGHT) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + h, y - a / 2);
      ctx.lineTo(x + h, y + a / 2);
    } else if (dir === Direction.BOTTOM) {
      ctx.moveTo(x, y);
      ctx.lineTo(x - a / 2, y + h);
      ctx.lineTo(x + a / 2, y + h);
    } else if (dir === Direction.TOP) {
      ctx.moveTo(x, y);
      ctx.lineTo(x - a / 2, y - h);
      ctx.lineTo(x + a / 2, y - h);
    }
    ctx.closePath();
    ctx.fillStyle = attrs.lineColor;
    ctx.fill();

    if (this.getIsSelected()) {
      ctx.save();
      ctx.translate(minX, minY);
      this.pointControls.forEach(control => {
        clearDrawStyle(ctx);
        control.paint(ctx);
      });
      ctx.restore();
    }

    // debug

    // const renderRect = this.getRenderRect();
    // ctx.fillStyle = 'green';
    // ctx.fillRect(renderRect.x, renderRect.y, renderRect.width, renderRect.height);
    // this.mapPoints.forEach(p => {
    //   ctx.moveTo(p.x, p.y);
    //   ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    //   ctx.fillStyle = 'green';
    //   ctx.fill();
    // });

    // const rect = this.getRect();
    // ctx.rect(rect.x, rect.y, rect.width, rect.height);
    // ctx.stroke();
  }

  afterPaint(ctx: CanvasRenderingContext2D, editor: Editor): void {}

  getCategory() {
    return LinkModel.CATEGORY;
  }

  getStart() {
    return this.start;
  }

  getStartHost() {
    return this.start.getHost();
  }

  getEnd() {
    return this.end;
  }

  getEndHost() {
    if ('getHost' in this.end) {
      return this.end.getHost();
    }
    return null;
  }

  move(x: number, y: number) {
    if (!('paint' in this.end)) {
      this.end.x += x;
      this.end.y += y;
      this.findPathPoints();
      this.emit(CommonEvents.rectChange);
      this.emit(CommonEvents.change);
    }
  }

  getMovable() {
    return !('paint' in this.end);
  }

  getResizeable() {
    return false;
  }

  getRotatable() {
    return false;
  }

  startAnimation() {
    if (!this.animation) {
      const offset = this.attrs.lineDashOffset;
      this.animation = createAnimation({
        startValue: 0,
        endValue: offset,
        duration: 1000,
        loop: true,
        onUpdate: value => {
          this.setAttr('lineDashOffset', value);
        }
      });
    }
    this.animation.start();
  }

  stopAnimation() {
    this.animation?.stop();
    this.animation = null;
  }

  setAnimationState(state: boolean) {
    if (state) {
      this.startAnimation();
    } else {
      this.stopAnimation();
    }
  }

  getAnimationState() {
    return this.animation?.status === AnimationStatus.RUNNING;
  }

  dispose() {
    super.dispose();
    this.animation?.stop();
    this.getStartHost().off(CommonEvents.rectChange, this.findPathPoints);
    this.getEndHost()?.off(CommonEvents.rectChange, this.findPathPoints);
  }

  reset() {
    super.reset();
    this.getStartHost().on(CommonEvents.rectChange, this.findPathPoints);
    this.getEndHost()?.on(CommonEvents.rectChange, this.findPathPoints);
    this.startAnimation();
  }

  toJson(): ModelJson<LinkModelAttrs> {
    const json = super.toJson();
    json.start = this.getStartHost().id;
    const endHost = this.getEndHost();
    json.end = endHost ? endHost.id : this.getEndPoint();
    json.startControlDir = this.start.getTag();
    const end = this.end;
    json.endControlDir = 'getTag' in end ? end.getTag() : this._endDirection;
    return json;
  }

  setIsCreating(bool: boolean) {
    this.isCreating = bool;
  }

  getIsUpdating() {
    return this.pointControls.some(control => control.getIsActive());
  }

  static fromJson(json: ModelJson<any>, models: Model[]): Model {
    const startHost = models.find(m => m.id === json.start);
    if (!startHost) {
      throw new Error(`Link创建失败:找不到ID为${json.start}的元素`);
    }
    const start = startHost.getControlByTag(json.startControlDir)! as LinkControl;
    let end;
    if (typeof json.end === 'string') {
      const endHost = models.find(m => m.id === json.end);
      if (!endHost) {
        throw new Error(`Link创建失败:找不到ID为${json.end}的元素`);
      }
      end = endHost.getControlByTag(json.endControlDir)!;
    } else {
      end = json.end;
    }

    const instance = new LinkModel(start, end, json.id);
    instance.setEndDirection(json.endControlDir);
    instance.attrs = json.attrs;
    instance.setPosition(json.rect.x, json.rect.y);
    instance.setSize(json.rect.width, json.rect.height);
    instance.transform = json.transform;
    instance.setLayerId(json.layerId);
    instance.findPathPoints();
    return instance;
  }
}
