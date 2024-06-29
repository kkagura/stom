import { Coordinate } from './grid';
import { ICompareable } from './heap';

function makeKey(coord: Coordinate) {
  return `${coord[0]}:${coord[1]}`;
}

export class APoint extends ICompareable {
  public H: number;
  public key: string;
  public F: number;

  constructor(
    public coord: Coordinate,
    public G: number = 0,
    public parent: APoint | null = null
  ) {
    super();

    this.G = G;
    this.H = 0;
    this.key = makeKey(coord);
    this.F = G;
  }

  setParent(parent: APoint) {
    this.parent = parent;
  }

  setG(G: number) {
    this.G = G;
    this.F = this.H + this.G;
  }

  setH(H: number) {
    this.H = H;
    this.F = this.H + this.G;
  }

  compare(other: APoint) {
    return this.F - other.F;
  }
}
