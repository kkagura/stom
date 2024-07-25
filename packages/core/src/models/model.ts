import { IBox, IMatrixArr, IPoint, IRect, ISize, Matrix, boxToRect, calcRectBbox, getTransformAngle, invertMatrix, multiplyMatrix } from '@stom/geo';
import { EventEmitter, cloneDeep, genId } from '@stom/shared';
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

interface Events<Attrs extends Record<string, any> = any> {
  [CommonEvents.change]: () => void;
  [CommonEvents.rectChange]: () => void;
  [ModelEvents.mouseIn]: (e: MouseEvent) => void;
  [ModelEvents.mouseOut]: (e: MouseEvent) => void;
  [ModelEvents.selected]: () => void;
  [ModelEvents.unselected]: () => void;
  [ModelEvents.ATTR_CHANGE](payload: { property: keyof Attrs; value: Attrs[keyof Attrs] }): void;
}

export abstract class Model<Attrs extends Record<string, any> = any> extends EventEmitter<Events<Attrs>> {
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
  }

  getWorldTransform(): IMatrixArr {
    const [a, b, c, d] = this.transform;
    return [a, b, c, d, this.rect.x, this.rect.y];
  }

  setWorldTransform(transform: IMatrixArr) {
    const [a, b, c, d, dx, dy] = transform;
    this.transform = [a, b, c, d, 0, 0];
    this.setPosition(dx, dy);
  }

  hitTest(x: number, y: number): boolean | Control {
    return false;
  }

  beforePaint(ctx: CanvasRenderingContext2D, editor: Editor) {}

  abstract paint(ctx: CanvasRenderingContext2D): void;

  afterPaint(ctx: CanvasRenderingContext2D, editor: Editor) {}

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
    return getTransformAngle(this.getWorldTransform());
  }

  setRotate(newRotate: number, center: IPoint) {
    const rotate = this.getRotate();
    const delta = newRotate - rotate;
    const rotateMatrix = new Matrix().translate(-center.x, -center.y).rotate(delta).translate(center.x, center.y);

    const tf = this.getWorldTransform();

    const newWoldTf = rotateMatrix.append(new Matrix(...tf)).getArray();

    this.setWorldTransform(newWoldTf);
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

  setAttr<K extends keyof Attrs>(attr: K, value: Attrs[K], force = false) {
    const oldVal = this.attrs[attr];
    if (oldVal !== value || force) {
      this.attrs[attr] = value;
      this.emit(ModelEvents.ATTR_CHANGE, {
        property: attr,
        value
      });
      this.emit(CommonEvents.change);
    }
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
}
