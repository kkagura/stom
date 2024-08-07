import {
  Command,
  DeleteCommand,
  Editor,
  RndoCommand,
  UndoCommand,
  ZoomInCommand,
  ZoomOutCommand,
  PerformanceCommand,
  AlignTopCommand,
  AlignBottomCommand,
  AlignLeftCommand,
  AlignRightCommand,
  AlignHorizontalCenterCommand,
  AlignVerticalCenterCommand
} from '@stom/core';

/**
 * 为了tree-shaking考虑，默认的command需要自己在外部调用然后再传入UI组件中
 * @param editor
 * @returns
 */
export function getDefaultCommands(editor: Editor): Command[] {
  return [
    new UndoCommand(editor),
    new RndoCommand(editor),
    new ZoomOutCommand(editor),
    new ZoomInCommand(editor),
    new DeleteCommand(editor),
    new PerformanceCommand(editor),
    new AlignTopCommand(editor),
    new AlignBottomCommand(editor),
    new AlignLeftCommand(editor),
    new AlignRightCommand(editor),
    new AlignHorizontalCenterCommand(editor),
    new AlignVerticalCenterCommand(editor)
  ];
}
