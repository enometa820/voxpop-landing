/**
 * 에셋의 발 밑선을 땅(ground) 선에 맞추기 위해 아래로 끌어내릴 px.
 * footInset = 발 밑 투명 여백 비율(0~1), renderSize = 렌더된 에셋 px 높이.
 */
export function footOffsetPx(footInset: number, renderSize: number): number {
  return footInset * renderSize;
}
