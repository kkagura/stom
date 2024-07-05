import { Model, ModelClass, RectModel, TerminatorModel } from '@stom/core';

export interface ModelGroup {
  groupName: string;
  groupId: string;
  models: ModelClass[];
}

export const getDefaultLibrary = (): ModelGroup[] => {
  return [
    {
      groupId: 'base',
      groupName: '基础图形',
      models: [RectModel, TerminatorModel]
    }
  ];
};
