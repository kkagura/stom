import { EventEmitter } from '@stom/shared';
import { CommonEvents } from './models';

export interface BasePluginEvents {
  [CommonEvents.REPAINT](): void;
  [K: string]: any;
}

export interface EditorPlugin<T extends BasePluginEvents> extends EventEmitter<T> {
  paint(ctx: CanvasRenderingContext2D): void;
}
