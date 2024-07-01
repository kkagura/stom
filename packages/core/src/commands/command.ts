import { Editor } from '../editor';
import { CommandName } from './command-manager';

export abstract class Command {
  static name: CommandName;

  constructor(public editor: Editor) {}

  abstract isEnable(): boolean;

  abstract execute(): void;

  abstract getName(): CommandName;
}
