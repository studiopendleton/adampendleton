import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { edgeColors, overscrollBackground, type ImageColumn } from './overscrollEdge.ts';

const column: ImageColumn = {
  width: 100,
  height: 100,
  samples: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00],
};

describe('overscroll edge colors', () => {
  it('uses the top and bottom of a cover image when the box matches its shape', () => {
    const edges = edgeColors(column, { width: 100, height: 100 }, 'top');
    assert.deepEqual(edges, { top: '#ff0000', bottom: '#ffff00' });
  });

  it('keeps a wide short box inside the top of a top-positioned image', () => {
    const edges = edgeColors(column, { width: 200, height: 40 }, 'top');
    assert.deepEqual(edges, { top: '#ff0000', bottom: '#ff0000' });
  });

  it('shows the full height when the box is taller than the image', () => {
    const edges = edgeColors(column, { width: 50, height: 200 }, 'top');
    assert.deepEqual(edges, { top: '#ff0000', bottom: '#ffff00' });
  });

  it('keeps a wide short box inside the bottom of a bottom-positioned image', () => {
    const edges = edgeColors(column, { width: 200, height: 50 }, 'bottom');
    assert.deepEqual(edges, { top: '#ffff00', bottom: '#ffff00' });
  });

  it('samples the middle band when the image is centered', () => {
    const edges = edgeColors(column, { width: 200, height: 50 }, 'center');
    assert.deepEqual(edges, { top: '#00ff00', bottom: '#0000ff' });
  });

  it('reverses the gradient stops so a repeated tile matches each edge', () => {
    const background = overscrollBackground('#112233', '#445566');
    assert.deepEqual(background, {
      backgroundColor: '#112233',
      backgroundImage: 'linear-gradient(#445566, #112233)',
      backgroundRepeat: 'repeat',
    });
  });
});
