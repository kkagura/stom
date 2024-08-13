import {
  IBox,
  IMatrixArr,
  IPoint,
  IRect,
  ISize,
  Matrix,
  boxToRect,
  calcRectBbox,
  degreesToRadians,
  getTransformAngle,
  invertMatrix,
  multiplyMatrix,
  radiansToDegrees
} from '@stom/geo';
import { EventEmitter, TextStyle, cloneDeep, fillText, genId, isEqual, toInt } from '@stom/shared';
import { Editor } from '../editor';
import { Control } from './control';
import { CommonEvents } from './common-events';

export enum ModelEvents {
  mouseIn = 'mouseIn',
  mouseOut = 'mouseOut',
  selected = 'selected',
  unselected = 'unselected',
  ATTR_CHANGE = 'attrChange'
}

export interface ModelJson<Attrs extends Record<string, any> = any> {
  id: string;
  category: string;
  attrs: Attrs;
  rect: IRect;
  transform: IMatrixArr;
  layerId: string;
  [key: string]: any;
}

export interface ModelClass {
  CATEGORY: string;
  fromJson: (json: ModelJson<any>, models: Model[], Model: ModelClass) => Model;
  new (...args: any[]): Model;
}

interface Events {
  [CommonEvents.change]: () => void;
  [CommonEvents.rectChange]: () => void;
  [ModelEvents.mouseIn]: (e: MouseEvent) => void;
  [ModelEvents.mouseOut]: (e: MouseEvent) => void;
  [ModelEvents.selected]: () => void;
  [ModelEvents.unselected]: () => void;
  [ModelEvents.ATTR_CHANGE](payload: { property: string; newValue: any; oldValue: any }): void;
}

export abstract class Model<Attrs extends Record<string, any> = any> extends EventEmitter<Events> {
  abstract attrs: Attrs;
  static CATEGORY: string;
  rect: IRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  transform: IMatrixArr = [1, 0, 0, 1, 0, 0];

  private layerId: string = '';

  private isHovered = false;
  private isSelected = false;
  private activeControl: Control | null = null;

  private textVisible: boolean = true;

  constructor(public id: string = genId()) {
    super();
    this.on(ModelEvents.mouseIn, () => {
      this.setIsHovered(true);
    });
    this.on(ModelEvents.mouseOut, () => {
      this.setIsHovered(false);
    });

    this.on(ModelEvents.selected, () => {
      this.setIsSelected(true);
    });
    this.on(ModelEvents.unselected, () => {
      this.setIsSelected(false);
    });

    this.init();
  }

  init() {}

  getMinWidth() {
    return 0;
  }

  getMinHeight() {
    return 0;
  }

  getSize(): ISize {
    return { width: this.rect.width, height: this.rect.height };
  }

  setSize(w: number, h: number) {
    w = Math.max(w, this.getMinWidth());
    h = Math.max(h, this.getMinHeight());
    let changed = false;
    if (w !== this.rect.width) {
      this.rect.width = w;
      changed = true;
    }
    if (h !== this.rect.height) {
      this.rect.height = h;
      changed = true;
    }
    if (changed) {
      this.emit(CommonEvents.rectChange);
      this.emit(CommonEvents.change);
    }
  }

  setPosition(x: number, y: number) {
    const rect = this.getRect();
    let changed = x !== rect.x || y !== rect.y;
    this.rect.x = x;
    this.rect.y = y;
    if (changed) {
      this.emit(CommonEvents.rectChange);
      this.emit(CommonEvents.change);
    }
  }

  getPosition(): IPoint {
    const rect = this.getRect();
    return {
      x: rect.x,
      y: rect.y
    };
  }

  getCenterPosition(): IPoint {
    const rect = this.getRect();
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  }

  setCenterPosition(x: number, y: number) {
    const { width, height } = this.getRect();
    this.setPosition(x - width / 2, y - height / 2);
  }

  move(offsetX: number, offsetY: number) {
    this.rect.x += offsetX;
    this.rect.y += offsetY;
    if (offsetX !== 0 || offsetY !== 0) {
      this.emit(CommonEvents.rectChange);
      this.emit(CommonEvents.change);
    }
  }

  getRect(): IRect {
    return { ...this.rect };
  }

  getRenderRect(): IRect {
    return this.rect;
  }

  getLayerId() {
    return this.layerId;
  }

  setLayerId(id: string) {
    this.layerId = id;
  }

  getTransform(): IMatrixArr {
    return [...this.transform];
  }

  setTransform(transform: IMatrixArr) {
    this.transform = [...transform];
    this.emit(CommonEvents.rectChange);
    this.emit(CommonEvents.change);
  }

  getWorldTransform(): IMatrixArr {
    const wtf = new Matrix(...this.getTransform());
    const { x, y } = this.getRect();
    return wtf.translate(x, y).getArray();
  }

  hitTest(x: number, y: number): boolean | Control {
    return false;
  }

  beforePaint(ctx: CanvasRenderingContext2D, editor: Editor): void {
    ctx.save();
    const transform = this.getWorldTransform();
    ctx.transform(...transform);
  }

  abstract paint(ctx: CanvasRenderingContext2D): void;

  afterPaint(ctx: CanvasRenderingContext2D, editor: Editor): void {
    ctx.restore();
  }

  getIsHovered() {
    return this.isHovered;
  }

  setIsHovered(isHovered: boolean) {
    if (this.isHovered === isHovered) return;
    this.isHovered = isHovered;
    this.emit(CommonEvents.change);
  }

  getIsSelected() {
    return this.isSelected;
  }

  setIsSelected(isSelected: boolean) {
    if (this.isSelected === isSelected) return;
    this.isSelected = isSelected;
    this.emit(CommonEvents.change);
  }

  getActiveControl() {
    return this.activeControl;
  }

  setActiveControl(activeControl: Control) {
    if (activeControl === this.activeControl) return;
    this.activeControl = activeControl;
    this.emit(CommonEvents.change);
  }

  dispose() {
    this.clear();
    this.isSelected = false;
    this.isHovered = false;
  }

  getBoundingBox(): IBox {
    return calcRectBbox({
      ...this.getSize(),
      transform: this.getWorldTransform()
    });
  }

  getBoundingRect(): IRect {
    return boxToRect(this.getBoundingBox());
  }

  getRotate() {
    return getTransformAngle(this.getTransform());
  }

  setRotate(rotation: number, center: IPoint = this.getCenterPosition()) {
    const rotate = this.getRotate();
    const delta = rotation - rotate;
    if (delta === 0) return;
    const { x, y } = this.getPosition();
    const rotateMatrix = new Matrix().translate(x, y).translate(-center.x, -center.y).rotate(delta).translate(-x, -y).translate(center.x, center.y);
    const newTf = rotateMatrix.append(new Matrix(...this.getTransform())).getArray();

    this.setTransform(newTf);
  }

  getRotateDeg() {
    const deg = radiansToDegrees(this.getRotate());
    return toInt(deg);
  }

  setRotateDeg(deg: number) {
    deg = toInt(deg);
    this.setRotate(degreesToRadians(deg));
  }

  dRotate(dRotation: number, originTf: IMatrixArr, center: IPoint) {
    const { x, y } = this.getPosition();
    const rotateMatrix = new Matrix()
      .translate(x, y)
      .translate(-center.x, -center.y)
      .rotate(dRotation)
      .translate(-x, -y)
      .translate(center.x, center.y);

    const newTf = rotateMatrix.append(new Matrix(...originTf)).getArray();

    this.setTransform(newTf);
  }

  getMovable() {
    return true;
  }

  getResizeable() {
    return true;
  }

  getRotatable() {
    return true;
  }

  updateControlPosition(control: Control) {}

  setAttr(attr: string, value: any) {
    const oldVal = this.getAttr(attr);
    if (isEqual(oldVal, value)) {
      return;
    }
    const paths = attr.split('.');
    let res: any = this.attrs;
    for (let i = 0; i < paths.length - 1; i++) {
      if (!res) {
        return;
      }
      res = res[paths[i]];
    }
    res && (res[paths[paths.length - 1]] = value);

    this.emit(ModelEvents.ATTR_CHANGE, {
      property: attr,
      newValue: value,
      oldValue: oldVal
    });
    this.emit(CommonEvents.change);
  }

  getAttr(attr: string) {
    const paths = attr.split('.');
    let res: any = this.attrs;
    for (let i = 0; i < paths.length; i++) {
      if (!res) {
        return;
      }
      res = res[paths[i]];
    }
    return res;
  }

  toJson(): ModelJson<Attrs> {
    const obj: ModelJson<Attrs> = {
      id: this.id,
      category: this.getCategory(),
      attrs: this.attrs,
      rect: this.rect,
      transform: this.transform,
      layerId: this.layerId
    };
    return cloneDeep(obj);
  }

  abstract getCategory(): string;

  static fromJson(json: ModelJson<any>, models: Model[], Model: ModelClass): Model {
    const instance = new Model(json.id);
    instance.attrs = json.attrs;
    instance.setPosition(json.rect.x, json.rect.y);
    instance.setSize(json.rect.width, json.rect.height);
    instance.transform = json.transform;
    instance.setLayerId(json.layerId);
    return instance;
  }

  getControlByTag(tag: string): Control | null {
    return null;
  }

  getText() {
    return this.getAttr('content.text');
  }

  getTextStyle() {
    return this.getAttr('content.style');
  }

  getContet() {
    return this.getAttr('content');
  }

  setText(text: string) {
    this.setAttr('content.text', text);
  }

  setTextStyle(style: Partial<TextStyle>) {
    this.setAttr('content.style', style);
  }

  setContent(content: { text: string; style: TextStyle }) {
    this.setAttr('content', content);
    this.emit(CommonEvents.change);
  }

  getTextVisible() {
    return this.textVisible;
  }

  setTextVisible(bool: boolean) {
    this.textVisible = bool;
    this.emit(CommonEvents.change);
  }

  paintText(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.getRect();
    const text = this.getText();
    if (text && this.getTextVisible()) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
      fillText(
        ctx,
        {
          x: 0,
          y: 0,
          width,
          height
        },
        text,
        this.getTextStyle()
      );
      ctx.restore();
    }
  }
}
