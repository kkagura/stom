import { IMatrixArr, IRect, Matrix, getSweepAngle, isPointInRect, radiansToDegrees } from '@stom/geo';
import { Control } from './control';
import { Editor } from '../editor';
import { SelectionManager } from '../selection-manager';
import { useDragEvent } from '@stom/shared';

export class RotateControl extends Control<SelectionManager> {
  init() {
    this.setSize(RotateControl.SIZE, RotateControl.SIZE);
  }

  updatePosition(): void {
    const { width, height } = this.getHost().getRect();
    this.setPosition(width, -RotateControl.SIZE);
  }

  handleMousedown(e: MouseEvent, editor: Editor): void {
    const selectionManager = this.getHost();
    const selectionList = selectionManager.getSelectionList().filter(el => el.getRotatable());
    if (selectionList.length === 0) return;
    const originTransformMap = new Map<string, IMatrixArr>();
    const originRectMap = new Map<string, IRect>();
    selectionList.forEach(el => {
      originTransformMap.set(el.id, el.getTransform());
      originRectMap.set(el.id, { ...el.getRect() });
    });
    const { x, y, width, height } = selectionManager.getBoundingRect();
    const selectionBoxCenter = {
      x: x + width / 2,
      y: y + height / 2
    };
    const mousePoint = editor.viewportManager.getCursorScenePoint(e);
    let startRotation = getSweepAngle(
      { x: 0, y: -1 },
      {
        x: mousePoint.x - selectionBoxCenter.x,
        y: mousePoint.y - selectionBoxCenter.y
      }
    );

    selectionManager.togglePauseUpdateRect(true);

    const updatedTransformMap = new Map<string, IMatrixArr>();

    useDragEvent(
      {
        onDragStart: () => {
          this.setIsActive(true);
        },
        onDragMove: e => {
          const lastPoint = editor.viewportManager.getCursorScenePoint(e);
          const { x: cxInSelectedElementsBBox, y: cyInSelectedElementsBBox } = selectionBoxCenter;

          const currRotation = getSweepAngle(
            { x: 0, y: -1 },
            {
              x: lastPoint.x - cxInSelectedElementsBBox,
              y: lastPoint.y - cyInSelectedElementsBBox
            }
          );
          const dRotation = currRotation - startRotation;

          selectionList.forEach(el => {
            el.dRotate(dRotation, originTransformMap.get(el.id)!, {
              x: cxInSelectedElementsBBox,
              y: cyInSelectedElementsBBox
            });
            updatedTransformMap.set(el.id, el.getTransform());
          });

          selectionManager.setRotate(dRotation);
        },
        onDragEnd: e => {
          this.setIsActive(false);
          selectionManager.setRotate(0);
          selectionManager.togglePauseUpdateRect(false);
          selectionManager.caculateContainRect();
          const action = {
            undo: () => {
              selectionList.forEach(el => {
                const originTransform = originTransformMap.get(el.id)!;
                el.setTransform(originTransform);
              });
            },
            redo: () => {
              selectionList.forEach(el => {
                const originTransform = updatedTransformMap.get(el.id)!;
                el.setTransform(originTransform);
              });
            }
          };
          editor.actionManager.push(action);
        }
      },
      e
    );
  }

  paint(ctx: CanvasRenderingContext2D): void {
    // https://demo.qunee.com/svg2canvas/
    const isActive = this.getIsHovered() || this.getIsActive();
    const fillColor = isActive ? RotateControl.ACTIVE_FILL_STYLE : RotateControl.FILL_STYLE;
    ctx.save();
    ctx.translate(this.rect.x, this.rect.y);
    ctx.strokeStyle = 'rgba(0,0,0,0)';
    ctx.miterLimit = 4;
    ctx.scale(0.015625, 0.015625);
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(793.6, 993.28);
    ctx.bezierCurveTo(784.384, 993.28, 775.168, 989.696, 768, 983.04);
    ctx.lineTo(594.432, 808.9599999999999);
    ctx.bezierCurveTo(580.6080000000001, 795.136, 580.6080000000001, 772.0959999999999, 594.432, 758.2719999999999);
    ctx.bezierCurveTo(608.256, 744.448, 631.296, 744.448, 645.12, 758.2719999999999);
    ctx.lineTo(793.6, 906.752);
    ctx.lineTo(942.08, 758.2719999999999);
    ctx.bezierCurveTo(955.904, 744.448, 978.9440000000001, 744.448, 992.768, 758.2719999999999);
    ctx.bezierCurveTo(1006.592, 772.0959999999999, 1006.592, 795.136, 992.768, 808.9599999999999);
    ctx.lineTo(819.2, 983.04);
    ctx.bezierCurveTo(812.032, 989.6959999999999, 802.816, 993.28, 793.6, 993.28);
    ctx.closePath();
    ctx.moveTo(250.88, 450.56);
    ctx.bezierCurveTo(241.664, 450.56, 232.448, 446.976, 225.792, 439.808);
    ctx.lineTo(51.712, 266.24);
    ctx.bezierCurveTo(37.888000000000005, 252.416, 37.888000000000005, 229.376, 51.712, 215.55200000000002);
    ctx.lineTo(225.79200000000003, 41.98400000000001);
    ctx.bezierCurveTo(239.61600000000004, 28.16000000000001, 262.656, 28.16000000000001, 276.48, 41.98400000000001);
    ctx.bezierCurveTo(290.30400000000003, 55.80800000000001, 290.30400000000003, 78.84800000000001, 276.48, 92.67200000000001);
    ctx.lineTo(128.00000000000003, 241.152);
    ctx.lineTo(276.48, 389.63199999999995);
    ctx.bezierCurveTo(290.30400000000003, 403.45599999999996, 290.30400000000003, 426.4959999999999, 276.48, 440.31999999999994);
    ctx.bezierCurveTo(269.312, 446.97599999999994, 260.096, 450.55999999999995, 250.88000000000002, 450.55999999999995);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(793.6, 993.28);
    ctx.bezierCurveTo(773.6320000000001, 993.28, 757.76, 977.408, 757.76, 957.4399999999999);
    ctx.lineTo(757.76, 803.8399999999999);
    ctx.bezierCurveTo(757.76, 513.0239999999999, 521.216, 276.4799999999999, 230.39999999999998, 276.4799999999999);
    ctx.lineTo(76.8, 276.4799999999999);
    ctx.bezierCurveTo(56.831999999999994, 276.4799999999999, 40.959999999999994, 260.6079999999999, 40.959999999999994, 240.6399999999999);
    ctx.bezierCurveTo(40.959999999999994, 220.6719999999999, 56.831999999999994, 204.7999999999999, 76.8, 204.7999999999999);
    ctx.lineTo(230.39999999999998, 204.7999999999999);
    ctx.bezierCurveTo(560.64, 204.7999999999999, 829.4399999999999, 473.5999999999999, 829.4399999999999, 803.8399999999999);
    ctx.lineTo(829.4399999999999, 957.4399999999999);
    ctx.bezierCurveTo(829.4399999999999, 977.4079999999999, 813.568, 993.28, 793.5999999999999, 993.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    // ctx.strokeRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
  }

  static SIZE = 16;
  static FILL_STYLE = '#333';
  static ACTIVE_FILL_STYLE = '#0f8eff';
}
