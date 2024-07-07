export interface AnimationOptions {
  startValue: number;
  endValue: number;
  duration: number;
  loop?: boolean;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
}

enum AnimationStatus {
  RUNNING = 'running',
  STOPPED = 'stopped'
}

class AnimationManager {
  private started = false;

  private animations: Animation[] = [];

  add(animation: Animation) {
    if (this.animations.includes(animation)) return;
    this.animations.push(animation);
  }

  tick = () => {
    this.animations = this.animations.filter(el => el.status === AnimationStatus.RUNNING);
    if (this.animations.length) {
      this.animations.forEach(el => el.run());
      requestAnimationFrame(this.tick);
    }
  };

  start() {
    if (this.started) return;
    requestAnimationFrame(this.tick);
  }
}

class Animation {
  private startValue: number;
  private endValue: number;
  private duration: number;
  private startTime: number = Date.now();
  status: AnimationStatus = AnimationStatus.STOPPED;

  constructor(
    private manager: AnimationManager,
    private options: AnimationOptions
  ) {
    this.startValue = options.startValue;
    this.endValue = options.endValue;
    this.duration = options.duration;
  }

  start() {
    this.startTime = Date.now();
    this.status = AnimationStatus.RUNNING;
    this.manager.add(this);
    this.manager.start();
  }

  stop() {
    this.status = AnimationStatus.STOPPED;
  }

  run() {
    const range = this.endValue - this.startValue;
    let time = Date.now() - this.startTime;
    if (time > this.duration) {
      time = this.duration;
      if (this.options.loop) {
        this.startTime = Date.now();
      } else {
        this.status = AnimationStatus.STOPPED;
      }
    }
    const step = this.startValue + (range * time) / this.duration;
    this.options.onUpdate(step);
    if (time === this.duration) {
      this.options.onEnd?.();
    }
  }
}

let manager: AnimationManager | null = null;

export function createAnimation(options: AnimationOptions) {
  if (!manager) {
    manager = new AnimationManager();
  }
  const animation = new Animation(manager, options);
  return animation;
}

export { type Animation };
