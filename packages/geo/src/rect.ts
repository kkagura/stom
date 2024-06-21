import { IPoint, IRect } from './type';

export const isPointInRoundRect = (point: IPoint, rect: IRect, cornerRadii: number, padding = 0) => {
  const x = rect.x - padding;
  const y = rect.y - padding;
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  if (point.x >= x && point.y >= y && point.x <= x + width && point.y <= y + height) {
    if (point.x <= x + cornerRadii && point.y <= y + cornerRadii) {
      return (point.x - x - cornerRadii) ** 2 + (point.y - y - cornerRadii) ** 2 <= cornerRadii[0] ** 2;
    } else if (point.x >= x + width - cornerRadii && point.y <= y + cornerRadii) {
      return (point.x - x - width + cornerRadii) ** 2 + (point.y - y - cornerRadii) ** 2 <= cornerRadii ** 2;
    } else if (point.x >= x + width - cornerRadii && point.y >= y + height - cornerRadii) {
      return (point.x - x - width + cornerRadii) ** 2 + (point.y - y - height + cornerRadii) ** 2 <= cornerRadii ** 2;
    } else if (point.x <= x + cornerRadii && point.y >= y + height - cornerRadii) {
      return (point.x - x - cornerRadii) ** 2 + (point.y - y - height + cornerRadii) ** 2 <= cornerRadii ** 2;
    } else {
      return true;
    }
  } else {
    return false;
  }
};
