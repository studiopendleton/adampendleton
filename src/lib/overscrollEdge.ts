export type BackgroundPosition = 'top' | 'center' | 'bottom';

export type ImageColumn = {
  width: number;
  height: number;
  samples: readonly number[];
};

export type OverscrollBackground = {
  backgroundColor: string;
  backgroundImage: string;
  backgroundRepeat: 'repeat';
};

function offsetY(position: BackgroundPosition, boxHeight: number, renderedHeight: number): number {
  switch (position) {
    case 'top':
      return 0;
    case 'center':
      return (boxHeight - renderedHeight) / 2;
    case 'bottom':
      return boxHeight - renderedHeight;
    default: {
      const unexpected: never = position;
      return unexpected;
    }
  }
}

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function sampleAt(column: ImageColumn, sourceY: number): string {
  const clamped = Math.min(column.height - 1e-6, Math.max(0, sourceY));
  const index = Math.min(
    column.samples.length - 1,
    Math.floor((clamped / column.height) * column.samples.length),
  );
  return hex(column.samples[index] ?? 0);
}

export function edgeColors(
  column: ImageColumn,
  box: { width: number; height: number },
  position: BackgroundPosition,
): { top: string; bottom: string } {
  const scale = Math.max(box.width / column.width, box.height / column.height);
  const topOffset = offsetY(position, box.height, column.height * scale);
  const sourceY = (boxY: number) => (boxY - topOffset) / scale;
  return {
    top: sampleAt(column, sourceY(0)),
    bottom: sampleAt(column, sourceY(Math.max(0, box.height - 1))),
  };
}

// Safari repeats the root background into the rubber-band. The tile past the
// top of the page is the bottom of this gradient, so the stops are reversed.
export function overscrollBackground(top: string, bottom: string): OverscrollBackground {
  return {
    backgroundColor: top,
    backgroundImage: `linear-gradient(${bottom}, ${top})`,
    backgroundRepeat: 'repeat',
  };
}
