import { describe, expect, it } from 'vitest';
import { commentMediaKind, validateCommentMediaFiles } from '@/services/api';

const makeFile = (type: string, name = 'upload', size = 1024): File => {
  const file = new File([new Uint8Array(8)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('comment media validation', () => {
  it('maps GIFs, short videos and stills to renderer kinds', () => {
    expect(commentMediaKind(makeFile('image/gif'))).toBe('GIF');
    expect(commentMediaKind(makeFile('video/mp4'))).toBe('VIDEO');
    expect(commentMediaKind(makeFile('image/webp'))).toBe('IMAGE');
  });

  it('accepts up to three images', () => {
    expect(() => validateCommentMediaFiles([
      makeFile('image/png', 'a.png'),
      makeFile('image/jpeg', 'b.jpg'),
      makeFile('image/webp', 'c.webp'),
    ])).not.toThrow();
  });

  it('counts already attached media against the limit', () => {
    expect(() => validateCommentMediaFiles([makeFile('image/png')], ['IMAGE', 'IMAGE', 'GIF']))
      .toThrow(/up to 3 media files/);
  });

  it('allows only one video per comment', () => {
    expect(() => validateCommentMediaFiles(
      [makeFile('video/webm', 'b.webm')],
      ['VIDEO'],
    )).toThrow(/one video/);
  });

  it('enforces separate image and video size ceilings', () => {
    expect(() => validateCommentMediaFiles([makeFile('image/png', 'huge.png', 6 * 1024 * 1024)]))
      .toThrow(/larger than 5 MB/);
    expect(() => validateCommentMediaFiles([makeFile('video/mp4', 'huge.mp4', 16 * 1024 * 1024)]))
      .toThrow(/15 MB or smaller/);
  });

  it('rejects unsupported formats such as SVG', () => {
    expect(() => validateCommentMediaFiles([makeFile('image/svg+xml', 'x.svg')]))
      .toThrow(/Only JPEG/);
  });
});
