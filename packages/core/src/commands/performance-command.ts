import { Editor } from '../editor';
import { CommonEvents } from '../models';
import { Command } from './command';

export class PerformanceCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
  }

  isEnable(): boolean {
    return true;
  }

  execute() {
    this.editor.setShowPerformance(!this.editor.getShowPerformance());
    this.emit(CommonEvents.change);
  }

  getName() {
    return PerformanceCommand.name;
  }

  isActive(): boolean {
    return this.editor.getShowPerformance();
  }

  dispose(): void {
    super.dispose();
    this.editor.actionManager.off(CommonEvents.change, this.statusChange);
  }

  static name = 'performance';
}
