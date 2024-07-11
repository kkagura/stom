import { Command, CommonEvents, Editor, ModelManager } from '@stom/core';
import { saveSceneJson } from './service';

export class SaveCommand extends Command {
  private lastSaveCursor: number = -1;

  constructor(
    editor: Editor,
    public modelManager: ModelManager
  ) {
    super(editor);
    editor.actionManager.on(CommonEvents.change, this.statusChange);
  }

  isEnable(): boolean {
    return this.editor.actionManager.cursor !== this.lastSaveCursor;
  }

  execute(): void {
    const jsonObj = this.editor.getSceneData();
    saveSceneJson(jsonObj);
    this.lastSaveCursor = this.editor.actionManager.cursor;
    this.statusChange();
  }

  dispose(): void {
    super.dispose();
    this.editor.actionManager.off(CommonEvents.change, this.statusChange);
  }

  getName(): string {
    return 'save';
  }

  getLabel(): string {
    return '保存';
  }
}
