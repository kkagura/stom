import { CommonEvents } from '@stom/core';
import { ModelSchema } from './property-panel';

export const rectSchema: ModelSchema = {
  name: '矩形',
  propertyGroups: [
    {
      name: '布局',
      properties: [
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
        }
      ]
    }
  ]
};

export const schemaMap: Record<string, ModelSchema> = {
  rect: rectSchema
};
