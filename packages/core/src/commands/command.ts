import { EventEmitter } from '@stom/shared';
import { Editor } from '../editor';
import { CommonEvents } from '../models';
import { CommandName } from './command-manager';

interface Events {
  [CommonEvents.change](): void;
}
export abstract class Command extends EventEmitter<Events> {
  static name: CommandName;

  constructor(public editor: Editor) {
    super();
  }

  abstract isEnable(): boolean;

  abstract execute(): void;

  abstract getName(): CommandName;

  dispose() {
    this.clear();
  }
}
