import { Command } from './command';

export enum CommandName {
  UNDO = 'undo',
  REDO = 'redo'
  // SAVE = 'save',
  // DELETE = 'delete'
}

export class CommandManager {
  private commandMap: Map<string, Command> = new Map();
  constructor(private commandList: Command[]) {
    commandList.forEach(command => {
      this.commandMap.set(command.getName(), command);
    });
  }

  execute(name: string) {
    const command = this.commandMap.get(name);
    if (command) {
      command.execute();
    }
  }

  isEnable(name: string) {
    const command = this.commandMap.get(name);
    if (command) {
      return command.isEnable();
    }
    return false;
  }

  setCommandList(commandList: Command[]) {
    this.commandList.forEach(command => {
      command.dispose();
    });

    this.commandList = commandList;

    commandList.forEach(command => {
      this.commandMap.set(command.getName(), command);
    });
  }

  getCommandList() {
    return this.commandList;
  }

  dispose() {
    this.commandList.forEach(command => {
      command.dispose();
    });
  }
}
