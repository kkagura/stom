import { Model } from '@stom/core';
import { inject, InjectionKey, Ref } from 'vue';

export interface PropertySchema {
  label?: string;
  key?: string;
  keyType?: 'attr' | 'base';
  component: any;
  componentAttrs?: Record<string, any>;
  getter?(model: any): void;
  setter?(model: any, value: any): void;
  watch?: string;
}

export interface PropertyGroup {
  name: string;
  properties: PropertySchema[];
}

export interface ModelSchema {
  name: string;
  propertyGroups: PropertyGroup[];
}

export interface NormalizedPropertySchema {
  label?: string;
  component: any;
  getter(model: Model): void;
  setter(model: Model, value: any): void;
}

export const currentModelKey: InjectionKey<Ref<Model | null>> = Symbol();

export function useCurrentModel(): Ref<Model | null> {
  return inject(currentModelKey)!;
}
