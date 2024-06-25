import { IRect } from '@stom/geo';
import { EventEmitter } from '@stom/shared';
import { CommonEvents } from './common-events';

interface Events {
  [CommonEvents.rectChange](): void;
  [CommonEvents.change](): void;
}

export abstract class ControlParent<T extends Record<string | symbol, any> = Events> extends EventEmitter<T> {
  abstract setPosition(x: number, y: number): void;
  abstract setSize(dw: number, dh: number): void;
  abstract move(dx: number, dy: number): void;
  abstract changeSize(dw: number, dh: number): { dx: number; dy: number };
  abstract getRect(): IRect;
  abstract getMinWidth(): number;
  abstract getMinHeight(): number;
}
