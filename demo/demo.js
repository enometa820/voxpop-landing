import { processFeedback, buildOwnerDashboard, buildDailyDigest, getSeedFeedback } from '../lib/voc-engine.js';

const STORE = '모닝브루 성수점';
const TOTAL_STEPS = 6;
const seed = getSeedFeedback();               // 이미 processFeedback된 items
const state = { step: 1, visitor: null };     // visitor = processFeedback 결과(제출 후)

const RUDE_EXAMPLE = '직원 김민수 진짜 불친절하고 지랄남. 항의하려니 010-1234-5678로 연락하라고만 함';

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
  if (state.step === 5) return renderThread(stage);
  if (state.step === 6) return renderCta(stage);
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
        <div class="col masked"><p style="font-size:13px;color:var(--accent)">사장님이 보는 한마디</p><p>${escapeHtml(v.cleanSentence)}</p>${v.maskedMeta?.length ? `<p style="font-size:12px;color:var(--muted);margin-top:8px">가린 내역 — ${v.maskedMeta.map((m) => escapeHtml(`${m.type} ${m.count}건`)).join(' · ')}</p>` : ''}</div>
      </div>
      <p style="color:var(--muted);font-size:14px;margin-top:14px">욕설·전화번호·직원 지칭·개인정보를 가리되, 사장님에게는 토큰 없는 한 문장으로 전합니다. 무엇을 가렸는지는 아래에 따로 보여줍니다.</p>
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
        <button class="btn btn-primary" id="toThread">사장님이 답하기 →</button>
      </div>
    </div>`;
  $('toThread').onclick = () => goto(5);
}

function renderThread(stage) {
  const v = state.visitor?.submission;
  const replyDrafts = {
    맛: '맛이 기대에 못 미쳤군요. 오늘 바로 점검하겠습니다.',
    응대: '응대가 불편하셨다니 죄송합니다. 직원과 바로 공유하겠습니다.',
    청결: '청결에 신경 쓰지 못해 죄송합니다. 바로 점검하겠습니다.',
    대기: '기다리게 해 죄송합니다. 대기 안내를 바로 개선하겠습니다.',
    가격: '가격이 부담되셨군요. 구성과 양을 다시 살펴보겠습니다.',
    소음: '시끄러워 불편하셨군요. 피크 시간 소음을 점검하겠습니다.',
    기타: '소중한 의견 감사합니다. 바로 살펴보고 개선하겠습니다.',
  };
  const reply = replyDrafts[v?.category] ?? replyDrafts.기타;
  const guestLine = v?.cleanSentence || '대기가 길었고 안내가 없어 답답했어요';
  const bubble = (side, who, text) => `
    <div style="align-self:${side === 'owner' ? 'flex-end' : 'flex-start'};max-width:82%;
      background:${side === 'owner' ? 'var(--accent)' : 'var(--paper)'};color:${side === 'owner' ? '#fff' : 'inherit'};
      border:1px solid ${side === 'owner' ? 'var(--accent)' : 'var(--line)'};
      border-radius:${side === 'owner' ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};padding:10px 14px">
      <span style="font-size:12px;opacity:.75">${escapeHtml(who)}</span>
      <p style="margin:4px 0 0">${escapeHtml(text)}</p>
    </div>`;
  stage.innerHTML = `
    <div class="dash">
      <p style="color:var(--accent);font-weight:700">무기명 스레드 · 핵심</p>
      <h2>사장님이 답하면 손님이 다시 봅니다 — 끝까지 익명으로</h2>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">
        ${bubble('guest', '손님 · 익명', guestLine)}
        ${bubble('owner', '사장님 답', reply)}
        ${bubble('guest', '손님 · 영수증 링크로 열람', '답변 확인했어요. 다음에 또 들를게요.')}
      </div>
      <p style="color:var(--muted);font-size:14px;margin-top:16px">손님은 받은 영수증 링크로만 사장님 답을 봅니다. 누가 썼는지는 사장님도 voxpop도 끝까지 알 수 없어요 — 익명이 벽이 아니라 다리가 됩니다.</p>
      <div class="demo-cta" style="justify-content:flex-start;margin-top:16px">
        <button class="btn btn-ghost" id="backOwner">사장님 화면으로</button>
        <button class="btn btn-primary" id="toCta">마무리 →</button>
      </div>
    </div>`;
  $('backOwner').onclick = () => goto(4);
  $('toCta').onclick = () => goto(6);
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
