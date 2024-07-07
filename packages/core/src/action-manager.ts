import { EventEmitter } from '@stom/shared';
import { CommonEvents } from './models/common-events';

export interface Action {
  undo(): void;
  redo(): void;
}

type ActionRecord = Action | Action[];

interface Events {
  [CommonEvents.change](): void;
}

export class ActionManager extends EventEmitter<Events> {
  //  操作栈
  list: ActionRecord[] = [];
  //  需要被合并的操作
  batch: Action[] | null = null;
  //  当前指针
  cursor: number = -1;
  //  是否正在操作（正在操作的时候不进行记录）
  isOperating: boolean = false;
  constructor(private limit: number = ActionManager.MAX) {
    super();
  }
  /**
   * 入栈
   * @param op
   * @returns
   */
  push(op: ActionRecord) {
    //  如果当前正在执行undo或者redo，不进行记录
    if (this.isOperating) {
      return;
    }
    //  如果已开启批量记录，则存入临时数组内
    if (this.batch) {
      this.batch.push(op as Action);
      return;
    }
    //  撤回后再进行新的操作时，当前指针之后的操作全部丢弃
    if (this.cursor !== this.list.length - 1) {
      this.list.splice(this.cursor + 1, this.list.length);
    }
    //  达到limit限制时，丢弃记录里最久远的操作
    if (this.limit === this.list.length) {
      this.list.splice(0, 1);
    }
    this.list.push(op);
    this.cursor = this.list.length - 1;
    this.emit(CommonEvents.change);
  }
  //  清空操作栈
  clear() {
    this.list = [];
    this.emit(CommonEvents.change);
  }
  //  当前是否可以undo
  undoable() {
    return this.cursor >= 0;
  }
  //  当前是否可以redo
  redoable() {
    return this.cursor < this.list.length - 1;
  }
  //  撤销操作
  undo() {
    if (!this.undoable()) {
      return;
    }
    // 获取当前指针所在的操作项
    const action = this.list[this.cursor--];
    // 标记当前正在undo为true（避免在undo的函数内重复记录）
    this.isOperating = true;
    try {
      //  如果是被合并的操纵，依次执行
      if (Array.isArray(action)) {
        for (let i = action.length - 1; i >= 0; i--) {
          action[i].undo();
        }
      } else {
        action.undo();
      }
    } catch (error) {
      console.warn(error);
    } finally {
      this.isOperating = false;
    }
    this.emit(CommonEvents.change);
  }
  redo() {
    if (!this.redoable()) {
      return;
    }
    //  获取当前指针所在的下一个节点
    const action = this.list[++this.cursor];
    this.isOperating = true;
    try {
      if (Array.isArray(action)) {
        action.forEach(ac => ac.redo());
      } else {
        action.redo();
      }
    } catch (error) {
      console.warn(error);
    } finally {
      this.isOperating = false;
    }
    this.emit(CommonEvents.change);
  }
  //  开始批量记录
  startBatch() {
    if (!this.batch) {
      this.batch = [];
    }
  }
  //  将多个原子操作合并为一个，可被批量撤回、批量重做
  endBatch() {
    const batch = this.batch;
    this.batch = null;
    if (batch?.length) {
      this.push(batch);
    }
  }

  dispose() {
    this.clear();
  }

  static MAX: number = 50;
}
