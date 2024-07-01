export * from './command-manager';
export * from './command';
import { Editor } from '../editor';
import { Command } from './command';
import { UndoCommond } from './undo-command';

/**
 * 为了tree-shaking考虑，默认的command需要自己在外部调用然后再传入UI组件中
 * @param editor
 * @returns
 */
export function getDefaultCommands(editor: Editor): Command[] {
  return [new UndoCommond(editor)];
}

export { UndoCommond };
