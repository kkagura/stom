export * from './command-manager';
export * from './command';
import { Editor } from '../editor';
import { Command } from './command';
import { UndoCommand } from './undo-command';
import { RndoCommand } from './redo-command';

/**
 * 为了tree-shaking考虑，默认的command需要自己在外部调用然后再传入UI组件中
 * @param editor
 * @returns
 */
export function getDefaultCommands(editor: Editor): Command[] {
  return [new UndoCommand(editor), new RndoCommand(editor)];
}

export { UndoCommand };
