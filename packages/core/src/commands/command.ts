import { EventEmitter } from '@stom/shared';
import { Editor } from '../editor';
import { CommonEvents } from '../models';

interface Events {
  [CommonEvents.change](): void;
}
export abstract class Command extends EventEmitter<Events> {
  static name: string;

  constructor(public editor: Editor) {
    super();
  }

  statusChange = () => {
    this.emit(CommonEvents.change);
  };

  abstract isEnable(): boolean;

  abstract execute(): void;

  abstract getName(): string;

  abstract getLabel(): string;

  isActive() {
    return false;
  }

  dispose() {
    this.clear();
  }
}
