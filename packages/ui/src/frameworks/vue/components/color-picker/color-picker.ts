import { inject, InjectionKey, reactive, readonly } from 'vue';
import { getRgba, hsvToRgb, rgbToHex, rgbToHsv } from './color-utils';

export interface ColorPickerState {
  alphaEnable: boolean;
  currentValue: string;
  hex: string;
  rgba: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  hsv: {
    h: number;
    s: number;
    v: number;
  };
  panelWidth: number;
  panelHeight: number;
  cursorSize: number;
  thumbSize: number;
  svPos: {
    x: number;
    y: number;
  };
  alphaPos: {
    x: number;
  };
  huePos: {
    y: number;
  };
}

export interface ColorPickerActions {
  updateHuePosition(): void;
  setHue(hue: number): void;
  updateAlphaPosition(): void;
  setAlpha(alpha: number): void;
  updateSVPosition(): void;
  setSV(s: number, v: number): void;
}

export interface ColorPickerContext {
  state: ColorPickerState;
  actions: ColorPickerActions;
}

export function createColorPickerContext(value: string, alphaEnable: boolean): ColorPickerContext {
  let r = 0,
    g = 0,
    b = 0,
    a = 1;
  let h = 0,
    s = 0,
    v = 0;
  let hex = '';
  if (value) {
    ({ r, g, b, a } = getRgba(value));
    ({ h, s, v } = rgbToHsv(r, g, b));
    hex = rgbToHex(r, g, b);
  }

  const context: ColorPickerContext = reactive({
    state: {
      alphaEnable,
      currentValue: value,
      hex,
      rgba: {
        r,
        g,
        b,
        a
      },
      hsv: {
        h,
        s,
        v
      },
      panelWidth: 280,
      panelHeight: 180,
      cursorSize: 6,
      thumbSize: 4,
      svPos: {
        x: 0,
        y: 0
      },
      alphaPos: {
        x: 0
      },
      huePos: {
        y: 0
      }
    },
    actions: {
      updateHuePosition() {
        const height = context.state.panelHeight;
        const size = context.state.thumbSize;
        context.state.huePos.y = context.state.hsv.h * height - size / 2;
      },
      setHue(hue) {
        context.state.hsv.h = hue;
        const rgb = hsvToRgb(context.state.hsv.h, context.state.hsv.s, context.state.hsv.v);
        context.state.rgba.r = rgb.r;
        context.state.rgba.g = rgb.g;
        context.state.rgba.b = rgb.b;
        const hex = rgbToHex(context.state.rgba.r, context.state.rgba.g, context.state.rgba.b);
        context.state.hex = hex;
      },
      updateAlphaPosition() {},
      setAlpha(alpha) {},
      updateSVPosition() {
        const { s, v } = context.state.hsv;
        const x = s * context.state.panelWidth;
        const y = v * context.state.panelHeight;
        context.state.svPos = { x, y };
      },
      setSV(s, v) {
        context.state.hsv = { h: context.state.hsv.h, s, v };
        const rgb = hsvToRgb(context.state.hsv.h, context.state.hsv.s, context.state.hsv.v);
        context.state.rgba.r = rgb.r;
        context.state.rgba.g = rgb.g;
        context.state.rgba.b = rgb.b;
        const hex = rgbToHex(context.state.rgba.r, context.state.rgba.g, context.state.rgba.b);
        context.state.hex = hex;
      }
    }
  });

  context.actions.updateHuePosition();
  context.actions.updateAlphaPosition();
  context.actions.updateSVPosition();

  return readonly(context);
}

export const colorPickerContextKey: InjectionKey<ColorPickerContext> = Symbol();

export const useColorPickerContext = (): ColorPickerContext => inject(colorPickerContextKey)!;
