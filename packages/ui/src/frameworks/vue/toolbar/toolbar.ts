import { Command, Editor, RndoCommand, UndoCommand } from '@stom/core';

/**
 * 为了tree-shaking考虑，默认的command需要自己在外部调用然后再传入UI组件中
 * @param editor
 * @returns
 */
export function getDefaultCommands(editor: Editor): Command[] {
  return [new UndoCommand(editor), new RndoCommand(editor)];
}
