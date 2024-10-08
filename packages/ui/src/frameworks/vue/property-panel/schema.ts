import { CommonEvents, ModelEvents } from '@stom/core';
import { ModelSchema, PropertyGroup, PropertySchema } from './property-panel';

const baseLayoutSchema: PropertySchema[] = [
  {
    component: 'Position',
    getter(model) {
      const pos = model.getPosition();
      return [pos.x, pos.y];
    },
    setter(model, value) {
      if (!Array.isArray || value.length !== 2) return;
      model.setPosition(value[0], value[1]);
    },
    // model和selectionManager支持监听，scene不支持
    watch: CommonEvents.rectChange
  },
  {
    component: 'Size',
    getter(model) {
      const pos = model.getSize();
      return [pos.width, pos.height];
    },
    setter(model, value) {
      if (!Array.isArray || value.length !== 2) return;
      model.setSize(value[0], value[1]);
    },
    watch: CommonEvents.rectChange
  },
  {
    label: '旋转',
    component: 'IntInput',
    key: 'rotateDeg',
    keyType: 'base',
    watch: CommonEvents.rectChange,
    componentAttrs: { append: '°' }
  }
];

const baseBorderSchema: PropertySchema[] = [
  {
    label: '边框大小',
    component: 'IntInput',
    key: 'border.width',
    keyType: 'attr'
  },
  {
    label: '边框类型',
    component: 'Select',
    key: 'border.style',
    keyType: 'attr',
    componentAttrs: {
      options: [
        { label: '实线', value: 'solid' },
        { label: '虚线', value: 'dashed' }
        // todo: 支持点线绘制
        // { label: '点线', value: 'dotted' }
      ]
    }
  },
  {
    label: '边框颜色',
    component: 'ColorPicker',
    key: 'border.color',
    keyType: 'attr'
  }
];

const baseTextSchema: PropertySchema[] = [
  {
    label: '字体颜色',
    component: 'ColorPicker',
    key: 'content.style.color',
    keyType: 'attr'
  },
  {
    label: '字体大小',
    component: 'IntInput',
    key: 'content.style.fontSize',
    keyType: 'attr'
  }
];

export const rectSchema: ModelSchema = {
  name: '矩形',
  propertyGroups: [
    {
      name: '布局',
      properties: baseLayoutSchema
    },
    {
      name: '填充',
      properties: [
        {
          label: '填充色',
          component: 'ColorPicker',
          key: 'fillColor',
          keyType: 'attr'
        }
      ]
    },
    {
      name: '边框',
      properties: [
        {
          label: '圆角',
          component: 'IntInput',
          key: 'roundGap',
          keyType: 'attr'
        },
        ...baseBorderSchema
      ]
    },
    {
      name: '文本',
      properties: baseTextSchema
    }
  ]
};

export const terminatorSchema: ModelSchema = {
  name: '起始/结束',
  propertyGroups: [
    {
      name: '布局',
      properties: baseLayoutSchema
    },
    {
      name: '填充',
      properties: [
        {
          label: '填充色',
          component: 'ColorPicker',
          key: 'fillColor',
          keyType: 'attr'
        }
      ]
    },
    {
      name: '边框',
      properties: [...baseBorderSchema]
    },
    {
      name: '文本',
      properties: baseTextSchema
    }
  ]
};

export const ellipseSchema: ModelSchema = {
  name: '椭圆',
  propertyGroups: [
    {
      name: '布局',
      properties: baseLayoutSchema
    },
    {
      name: '填充',
      properties: [
        {
          label: '填充色',
          component: 'ColorPicker',
          key: 'fillColor',
          keyType: 'attr'
        }
      ]
    },
    {
      name: '边框',
      properties: [...baseBorderSchema]
    },
    {
      name: '文本',
      properties: baseTextSchema
    }
  ]
};

export const diamondSchema: ModelSchema = {
  name: '菱形',
  propertyGroups: [
    {
      name: '布局',
      properties: baseLayoutSchema
    },
    {
      name: '填充',
      properties: [
        {
          label: '填充色',
          component: 'ColorPicker',
          key: 'fillColor',
          keyType: 'attr'
        }
      ]
    },
    {
      name: '边框',
      properties: [...baseBorderSchema]
    },
    {
      name: '文本',
      properties: baseTextSchema
    }
  ]
};

export const linkSchema: ModelSchema = {
  name: '连线',
  propertyGroups: [
    {
      name: '样式',
      properties: [
        {
          label: '线条颜色',
          component: 'ColorPicker',
          key: 'lineColor',
          keyType: 'attr'
        },
        {
          label: '线条宽度',
          component: 'IntInput',
          key: 'lineWidth',
          keyType: 'attr'
        },
        {
          label: '线条类型',
          component: 'Select',
          key: 'lineStyle',
          keyType: 'attr',
          componentAttrs: {
            options: [
              { label: '实线', value: 'solid' },
              { label: '虚线', value: 'dashed' }
              // todo: 支持点线绘制
              // { label: '点线', value: 'dotted' }
            ]
          }
        },
        {
          label: '动画',
          component: 'Switch',
          key: 'animationState',
          keyType: 'base'
        }
      ]
    }
  ]
};

export const sceneSchema: ModelSchema = {
  name: '场景',
  propertyGroups: [
    {
      name: '场景',
      properties: [
        {
          label: '刻度尺',
          component: 'Switch',
          key: 'showRuler',
          keyType: 'base'
        },
        {
          label: '网格线',
          component: 'Switch',
          key: 'showGrid',
          keyType: 'base'
        }
      ]
    }
  ]
};

export const schemaMap: Record<string, ModelSchema> = {
  rect: rectSchema,
  terminator: terminatorSchema,
  ellipse: ellipseSchema,
  diamond: diamondSchema,
  link: linkSchema,
  scene: sceneSchema
};
