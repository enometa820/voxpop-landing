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

// Task 4에서 구현: renderReveal, renderOwner
// Task 5에서 구현: renderCta
function renderReveal(stage){ stage.innerHTML = '<div class="dash">(가림 순간 — Task 4)</div>'; }
function renderOwner(stage){ stage.innerHTML = '<div class="dash">(사장 화면 — Task 4)</div>'; }
function renderCta(stage){ stage.innerHTML = '<div class="dash">(마무리 — Task 5)</div>'; }

render();
