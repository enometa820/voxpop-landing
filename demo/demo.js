import { processFeedback, buildOwnerDashboard, buildDailyDigest, getSeedFeedback } from '../lib/voc-engine.js';

const STORE = '모닝브루 성수점';
const TOTAL_STEPS = 5;
const seed = getSeedFeedback();               // 이미 processFeedback된 items
const state = { step: 1, visitor: null };     // visitor = processFeedback 결과(제출 후)

const RUDE_EXAMPLE = '직원 김민수 진짜 개짜증나고 불친절함. 항의하려니 010-1234-5678로 연락하라고만 함';

const $ = (id) => document.getElementById(id);

function items() {
  return state.visitor ? [...seed, state.visitor] : [...seed];
}

function renderStepbar() {
  $('stepbar').innerHTML = Array.from({ length: TOTAL_STEPS }, (_, i) =>
    `<span class="${i < state.step ? 'on' : ''}"></span>`).join('');
}

function goto(step) { state.step = step; render(); }

function render() {
  renderStepbar();
  const stage = $('stage');
  if (state.step === 1) return renderIntro(stage);
  if (state.step === 2) return renderCustomerForm(stage);
  if (state.step === 3) return renderReveal(stage);
  if (state.step === 4) return renderOwner(stage);
  if (state.step === 5) return renderCta(stage);
}

function renderIntro(stage) {
  stage.innerHTML = `
    <div class="phone">
      <p style="color:var(--muted);font-size:14px">${STORE}</p>
      <h2>여기는 ${STORE}이에요</h2>
      <p>손님이 테이블 QR을 찍고 들어온 화면입니다. 손님이 되어 한마디 남겨볼까요?</p>
      <button class="btn btn-primary" id="toForm">손님이 되어보기 →</button>
    </div>`;
  $('toForm').onclick = () => goto(2);
}

function renderCustomerForm(stage) {
  stage.innerHTML = `
    <div class="phone">
      <p style="color:var(--muted);font-size:14px">${STORE} · 익명 한마디</p>
      <fieldset><legend>오늘 경험</legend>
        <label>별점
          <select id="rating">
            <option value="1">1</option><option value="2" selected>2</option>
            <option value="3">3</option><option value="4">4</option><option value="5">5</option>
          </select>
        </label>
        <label style="margin-left:12px">카테고리
          <select id="category">
            <option>맛</option><option>응대</option><option>청결</option>
            <option selected>대기</option><option>가격</option><option>소음</option><option>기타</option>
          </select>
        </label>
      </fieldset>
      <label for="comment">한 줄 코멘트</label>
      <textarea id="comment" rows="4" maxlength="300" placeholder="예: 대기가 길었고 안내가 없어 답답했어요"></textarea>
      <p style="font-size:13px;color:var(--muted)">막막하면? 일부러 욕설·전화번호가 섞인 예시를 넣어보세요.</p>
      <div class="demo-cta" style="justify-content:flex-start">
        <button class="btn btn-ghost" id="fillRude">거친 예시 넣어보기</button>
        <button class="btn btn-primary" id="submit">비공개로 전달 →</button>
      </div>
    </div>`;
  $('fillRude').onclick = () => { $('comment').value = RUDE_EXAMPLE; };
  $('submit').onclick = () => {
    const input = {
      storeId: 'demo-cafe', qrLocation: 'demo', deviceKey: 'visitor',
      rating: Number($('rating').value),
      category: $('category').value,
      comment: $('comment').value.trim() || RUDE_EXAMPLE,
      submittedAt: '2026-06-07T01:00:00.000Z',
    };
    state.visitor = processFeedback(input);
    goto(3);
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function renderReveal(stage) {
  if (!state.visitor) { goto(1); return; }
  const v = state.visitor.submission;
  stage.innerHTML = `
    <div class="dash">
      <p style="color:var(--accent);font-weight:700">가림 순간</p>
      <h2>이렇게 안전하게 바뀌어 저장됩니다</h2>
      <div class="reveal-grid">
        <div class="col"><p style="font-size:13px;color:var(--muted)">손님이 입력한 원문</p><p>${escapeHtml(v.comment)}</p></div>
        <div class="col masked"><p style="font-size:13px;color:var(--accent)">가려져 저장되는 한마디</p><p>${escapeHtml(v.sanitizedComment)}</p></div>
      </div>
      <p style="color:var(--muted);font-size:14px;margin-top:14px">욕설·전화번호·직원 지칭·개인정보가 자동으로 가려집니다. 사장님은 가려진 한마디만 봅니다.</p>
      <div class="demo-cta" style="justify-content:flex-start;margin-top:16px">
        <button class="btn btn-ghost" id="back2">다시 입력</button>
        <button class="btn btn-primary" id="toOwner">사장님 화면 보기 →</button>
      </div>
    </div>`;
  $('back2').onclick = () => goto(2);
  $('toOwner').onclick = () => goto(4);
}

function renderOwner(stage) {
  const all = items();
  const dash = buildOwnerDashboard(all, { storeName: STORE, now: '2026-06-07T01:30:00.000Z' });
  const digest = buildDailyDigest(all, { now: '2026-06-07T01:30:00.000Z' });
  const top = dash.topPainPoints?.[0]?.category ?? '아직 없음';
  stage.innerHTML = `
    <div class="dash">
      <p style="color:var(--accent);font-weight:700">${escapeHtml(dash.storeName)} · 사장님 화면</p>
      <h2>오늘 볼 것</h2>
      <p style="font-size:18px;font-weight:600">${escapeHtml(dash.todayAction ?? '')}</p>
      <div style="display:grid;gap:12px;grid-template-columns:repeat(3,1fr);margin:18px 0">
        <div class="col" style="border:1px solid var(--line);border-radius:10px;padding:12px">
          <p style="font-size:13px;color:var(--muted)">유효 응답</p><strong style="font-size:22px">${dash.responseCount}</strong></div>
        <div class="col" style="border:1px solid var(--line);border-radius:10px;padding:12px">
          <p style="font-size:13px;color:var(--muted)">반복 신호</p><strong style="font-size:22px">${escapeHtml(top)}</strong></div>
        <div class="col" style="border:1px solid var(--alert);border-radius:10px;padding:12px">
          <p style="font-size:13px;color:var(--alert)">위험 신호</p><strong style="font-size:22px">${dash.riskSignalCount}건</strong></div>
      </div>
      <details style="margin-top:8px"><summary style="cursor:pointer;color:var(--accent)">전체 보기 · 주간 요약</summary>
        <ul style="color:var(--muted);line-height:1.7">${String(digest.body).split('\n').map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>
      </details>
      <p style="color:var(--muted);font-size:14px;margin-top:8px">방금 남기신 한마디도 이 안에 반영됐어요. 제외된 입력 ${dash.filteredCount}건은 통계에서 빠집니다.</p>
      <div class="demo-cta" style="justify-content:flex-start;margin-top:16px">
        <button class="btn btn-primary" id="toCta">마무리 →</button>
      </div>
    </div>`;
  $('toCta').onclick = () => goto(5);
}

function renderCta(stage) {
  stage.innerHTML = `
    <div class="dash" style="text-align:center">
      <h2>우리 매장도 이렇게 받아보고 싶다면</h2>
      <p class="lead" style="margin-inline:auto;color:var(--muted)">손님은 부담 없이 솔직하게, 사장님은 가려진 한마디를 오늘 할 일로 받습니다.</p>
      <div class="demo-cta" style="margin-top:18px">
        <a class="btn btn-primary" href="../index.html#cta">베타 문의 →</a>
        <a class="btn btn-ghost" href="../owner-guide/">사장님 가이드 보기</a>
        <button class="btn btn-ghost" id="restart">처음부터 다시</button>
      </div>
      <p style="margin-top:14px"><a href="../story/">우리가 푸는 문제와 가는 방향 →</a></p>
    </div>`;
  $('restart').onclick = () => { state.visitor = null; goto(1); };
}

render();
