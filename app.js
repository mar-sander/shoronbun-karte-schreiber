import {
  DETAIL_ITEMS,
  ESSAY_TYPES,
  FIELDS,
  LIMITS,
  PRIMARY_ISSUES,
  RANKS,
  RATINGS,
  SCORE_FIELDS,
  THEME_CATEGORIES,
  blankRecord,
  normalizeRecord,
} from "./schema.js";
import { GoogleSheetsStore } from "./google-sheets.js";

const config = window.SCHREIBER_CONFIG || {};
const state = {
  record: normalizeRecord({
    schema_version: "1.0",
    record_id: "SAMPLE-0001",
    student_id: "SAMPLE-S001",
    display_name: "サンプル生徒",
    created_at: "2026-09-07 00:00:00",
    updated_at: "2026-09-07 00:00:00",
    karte_version: "1.0",
    diagnosis_version: "1.0",
    status: "confirmed",
    karte_no: "001",
    theme: "高校生におけるスマートフォンの使い方",
    character_limit: 600,
    diagnosis_date: "2026-09-06",
    submission_number: 1,
    essay_type: "mixed",
    overall_comment: "結論を先に示すと、一気に筋が通る。",
    score_prompt: 4,
    score_claim: 3,
    score_own_thought: 3,
    score_evidence: 3,
    score_structure: 3,
    overall_notice: "材料は十分にある。あとは何を言いたい文章なのかを先に決めたい。",
    rank: "C-1",
    detail_01_rating: "○",
    detail_01_comment: "高校生のスマートフォン利用について、利便性・問題点・対策まで扱えている。",
    detail_02_rating: "◎",
    detail_02_comment: "テーマから外れず、利用例・依存の問題・対策まで一貫して触れている。",
    detail_03_rating: "△",
    detail_03_comment: "自分の答えが冒頭では示されず、文章の主張が後半まで見えにくい。",
    detail_04_rating: "○",
    detail_04_comment: "地図・買い物・辞書など、自分自身の利用経験をもとに考えられている。",
    detail_05_rating: "△",
    detail_05_comment: "具体例は多いが、結論を説明する材料として十分に整理し切れていない。",
    detail_06_rating: "○",
    detail_06_comment: "利便性→問題点→対策という大きな流れは、おおむね整理されている。",
    detail_07_rating: "○",
    detail_07_comment: "最後は、依存を防ぎながら使うことの大切さへ戻れている。",
    detail_08_rating: "○",
    detail_08_comment: "600字以内など、大きな条件違反は見られない。",
    observation_good: "具体例が豊富で、テーマから大きく外れずに書けている。利便性だけでなく問題点にも触れられている。",
    observation_concern: "高校生はスマートフォンをどう使うべきかという自分の答えが、冒頭ではっきり示されていない。",
    observation_reason: "書きたい材料から始めており、最初に結論を決めてから構成する意識がまだ弱い可能性がある。",
    prescription_first: "冒頭に、高校生はスマートフォンをどう使うべきかという自分の答えを書く。",
    prescription_next: "具体例を整理し、自分の結論を説明するために必要なものだけ残す。",
    prescription_advanced: "最後の結論を、冒頭の主張と同じ軸で回収する。",
    key_phrase: "書きたい材料から始めるな。伝えたい結論から始める。",
    note: "今回は、文法や細かな表現よりも小論文としての筋道を優先して診断しています。",
    theme_category: "technology",
    primary_issue: "claim",
    previous_record_id: "",
    is_revision: false,
    improvement_note: "",
    confirmed: true,
    printed_at: "",
    print_count: 0,
  }),
  cloudRecords: [],
  dirty: false,
  overflow: [],
};

const elements = {
  paper: document.getElementById("kartePaper"),
  stage: document.getElementById("paperStage"),
  previewPane: document.querySelector(".preview-pane"),
  previewScale: document.getElementById("previewScale"),
  recordSelect: document.getElementById("recordSelect"),
  recordStatus: document.getElementById("recordStatus"),
  noticeBar: document.getElementById("noticeBar"),
  connectionBadge: document.getElementById("connectionBadge"),
  detailInputs: document.getElementById("detailInputs"),
  detailComments: document.getElementById("detailComments"),
  detailMarks: document.getElementById("detailMarks"),
  essayTypeInputs: document.getElementById("essayTypeInputs"),
  essayTypeMarks: document.getElementById("essayTypeMarks"),
  scoreInputs: document.getElementById("scoreInputs"),
  rankInput: document.getElementById("rankInput"),
  rankStamp: document.getElementById("rankStamp"),
  themeCategoryInput: document.getElementById("themeCategoryInput"),
  primaryIssueInput: document.getElementById("primaryIssueInput"),
  radarGrid: document.getElementById("radarGrid"),
  radarNumbers: document.getElementById("radarNumbers"),
  radarData: document.getElementById("radarData"),
  checkSummary: document.getElementById("checkSummary"),
  overflowList: document.getElementById("overflowList"),
  measurementLayer: document.getElementById("measurementLayer"),
  importMessage: document.getElementById("importMessage"),
};

const googleStore = new GoogleSheetsStore(config, handleGoogleStatus);
let draftTimer = null;

init();

function init() {
  buildDynamicInputs();
  buildRadarGrid();
  bindEvents();
  renderRecordSelect();
  applyRecordToInputs();
  renderAll();
  resizePreview();
  configureGoogleControls();
  window.addEventListener("resize", resizePreview);
  document.fonts?.ready.then(() => { resizePreview(); scheduleMeasurements(); });
}

function buildDynamicInputs() {
  elements.essayTypeInputs.innerHTML = ESSAY_TYPES.map(([value, label]) => `
    <label><input type="radio" name="essay_type" value="${escapeHtml(value)}" /> ${escapeHtml(label)}</label>
  `).join("");

  elements.scoreInputs.innerHTML = SCORE_FIELDS.map(([field, label]) => `
    <label><span>${escapeHtml(label)}</span><select data-bind="${field}">${[1,2,3,4,5].map((value) => `<option value="${value}">${value}</option>`).join("")}</select></label>
  `).join("");

  elements.rankInput.innerHTML = RANKS.map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("");
  elements.themeCategoryInput.innerHTML = THEME_CATEGORIES.map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("");
  elements.primaryIssueInput.innerHTML = PRIMARY_ISSUES.map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("");

  elements.detailInputs.innerHTML = DETAIL_ITEMS.map(([title, note], index) => {
    const number = String(index + 1).padStart(2, "0");
    const ratingField = `detail_${number}_rating`;
    const commentField = `detail_${number}_comment`;
    return `<section class="detail-input-card">
      <div class="detail-title">${index + 1}. ${escapeHtml(title)}<br><small>${escapeHtml(note)}</small></div>
      <div class="rating-options">${RATINGS.map((rating) => `<label><input type="radio" name="${ratingField}" value="${rating}"> ${rating}</label>`).join("")}</div>
      <label>コメント<textarea data-bind="${commentField}" rows="3"></textarea></label>
    </section>`;
  }).join("");

  elements.detailComments.innerHTML = DETAIL_ITEMS.map((_, index) => {
    const field = `detail_${String(index + 1).padStart(2, "0")}_comment`;
    return `<div class="detail-comment" data-field="${field}" style="top:${90.05 + index * 11.63}mm"></div>`;
  }).join("");

  for (const field of Object.keys(LIMITS)) {
    const control = document.querySelector(`[data-bind="${field}"]`);
    if (!control) continue;
    const counter = document.createElement("span");
    counter.className = "field-counter";
    counter.dataset.counterFor = field;
    control.insertAdjacentElement("afterend", counter);
  }
}

function buildRadarGrid() {
  const center = 50;
  const radius = 49;
  const polygons = [];
  for (let level = 1; level <= 5; level += 1) {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", radarPoints(Array(5).fill(level), center, radius));
    polygon.setAttribute("stroke", level === 5 ? "#A8AFB4" : "#DDE1E4");
    polygon.setAttribute("stroke-width", level === 5 ? "0.55" : "0.42");
    polygons.push(polygon);
  }
  for (let axis = 0; axis < 5; axis += 1) {
    const angle = (-90 + axis * 72) * Math.PI / 180;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", center);
    line.setAttribute("y1", center);
    line.setAttribute("x2", center + radius * Math.cos(angle));
    line.setAttribute("y2", center + radius * Math.sin(angle));
    line.setAttribute("stroke", "#DDE1E4");
    line.setAttribute("stroke-width", "0.42");
    polygons.push(line);
  }
  elements.radarGrid.replaceChildren(...polygons);
  const labels = [];
  for (let value = 1; value <= 5; value += 1) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "49");
    text.setAttribute("y", String(51 - radius * value / 5));
    text.setAttribute("text-anchor", "end");
    text.textContent = String(value);
    labels.push(text);
  }
  elements.radarNumbers.replaceChildren(...labels);
}

function bindEvents() {
  document.addEventListener("input", handleBoundInput);
  document.addEventListener("change", handleBoundInput);
  document.querySelectorAll('input[name="essay_type"]').forEach((input) => input.addEventListener("change", () => {
    state.record.essay_type = input.value;
    markDirtyAndRender();
  }));
  for (let index = 1; index <= 8; index += 1) {
    const field = `detail_${String(index).padStart(2, "0")}_rating`;
    document.querySelectorAll(`input[name="${field}"]`).forEach((input) => input.addEventListener("change", () => {
      state.record[field] = input.value;
      markDirtyAndRender();
    }));
  }
  document.getElementById("importButton").addEventListener("click", importJson);
  document.getElementById("googleAuthButton").addEventListener("click", connectGoogle);
  document.getElementById("reloadButton").addEventListener("click", reloadCloudRecords);
  document.getElementById("saveGoogleButton").addEventListener("click", saveToGoogle);
  document.getElementById("saveDraftButton").addEventListener("click", saveDraftManually);
  document.getElementById("restoreDraftButton").addEventListener("click", restoreDraft);
  document.getElementById("printButton").addEventListener("click", printKarte);
  elements.recordSelect.addEventListener("change", selectRecord);
  window.addEventListener("beforeprint", () => { renderAll(); elements.paper.style.transform = "none"; });
  window.addEventListener("afterprint", resizePreview);
}

function handleBoundInput(event) {
  const control = event.target.closest("[data-bind]");
  if (!control) return;
  const field = control.dataset.bind;
  if (!FIELDS.includes(field)) return;
  let value = control.type === "checkbox" ? control.checked : control.value;
  if (control.type === "number" && value !== "") value = Number(value);
  state.record[field] = value;
  markDirtyAndRender();
}

function markDirtyAndRender() {
  state.dirty = true;
  elements.recordStatus.textContent = "編集中。この端末に一時保存されます。";
  renderAll();
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => saveDraft(false), 600);
}

function applyRecordToInputs() {
  document.querySelectorAll("[data-bind]").forEach((control) => {
    const value = state.record[control.dataset.bind];
    if (control.type === "checkbox") control.checked = Boolean(value);
    else control.value = value ?? "";
  });
  document.querySelectorAll('input[name="essay_type"]').forEach((input) => { input.checked = input.value === state.record.essay_type; });
  for (let index = 1; index <= 8; index += 1) {
    const field = `detail_${String(index).padStart(2, "0")}_rating`;
    document.querySelectorAll(`input[name="${field}"]`).forEach((input) => { input.checked = input.value === state.record[field]; });
  }
}

function renderAll() {
  renderPaper();
  renderConfirmationState();
  scheduleMeasurements();
}

function renderPaper() {
  document.querySelectorAll(".paper-field[data-field], .detail-comment[data-field]").forEach((element) => {
    const field = element.dataset.field;
    let value = state.record[field] ?? "";
    if (field === "diagnosis_date") value = formatPaperDate(value);
    element.textContent = String(value);
  });

  const essayPositions = {
    episode: [272.25, 51.15],
    certain_but: [302.65, 51.15],
    mixed: [272.25, 57.55],
    prompt_mismatch: [289.2, 57.55],
    other: [323.5, 57.55],
  };
  elements.essayTypeMarks.replaceChildren();
  const essayPosition = essayPositions[state.record.essay_type];
  if (essayPosition) {
    const mark = document.createElement("span");
    mark.className = "essay-mark";
    mark.style.left = `${essayPosition[0]}mm`;
    mark.style.top = `${essayPosition[1]}mm`;
    mark.textContent = "✓";
    elements.essayTypeMarks.append(mark);
  }

  const markNodes = [];
  for (let index = 1; index <= 8; index += 1) {
    const field = `detail_${String(index).padStart(2, "0")}_rating`;
    const selectedRating = state.record[field];
    const row = document.createElement("div");
    row.className = "detail-rating-row";
    row.style.top = `${89.8 + (index - 1) * 11.63}mm`;
    for (const rating of RATINGS) {
      const mark = document.createElement("span");
      mark.className = `detail-mark${selectedRating === rating ? " selected" : ""}`;
      mark.textContent = rating;
      row.append(mark);
    }
    markNodes.push(row);
  }
  elements.detailMarks.replaceChildren(...markNodes);

  const values = SCORE_FIELDS.map(([field]) => Number(state.record[field]) || 1);
  elements.radarData.setAttribute("points", radarPoints(values, 50, 49));
  const rank = RANKS.some(([code]) => code === state.record.rank) ? state.record.rank : "";
  if (rank) elements.rankStamp.src = `assets/${rank}.png`;
  else elements.rankStamp.removeAttribute("src");
}

function renderConfirmationState() {
  if (!state.record.confirmed) {
    setNotice("warning", "未確定データです。印刷は可能ですが、内容を確認してください。");
  } else if (!googleStore.connected) {
    setNotice("info", googleStore.configured
      ? "Google Sheetsに未接続です。手動入力・JSON取込・印刷は使用できます。"
      : "Google認証未設定です。手動入力・JSON取込・印刷は使用できます。");
  }
}

function radarPoints(values, center, radius) {
  return values.map((value, index) => {
    const angle = (-90 + index * 72) * Math.PI / 180;
    const distance = radius * Math.min(5, Math.max(1, Number(value))) / 5;
    return `${(center + distance * Math.cos(angle)).toFixed(3)},${(center + distance * Math.sin(angle)).toFixed(3)}`;
  }).join(" ");
}

function scheduleMeasurements() {
  cancelAnimationFrame(scheduleMeasurements.frame);
  scheduleMeasurements.frame = requestAnimationFrame(measureOverflow);
}

function measureOverflow() {
  const results = [];
  for (const [field, limit] of Object.entries(LIMITS)) {
    const target = document.querySelector(`[data-field="${field}"]`);
    if (!target) continue;
    const text = String(state.record[field] ?? "");
    const chars = Array.from(text).length;
    const lines = renderedLineCount(target, text);
    const over = chars > limit.chars || lines > limit.lines || target.scrollHeight > target.clientHeight + 1;
    const result = {
      field,
      label: limit.label,
      maxChars: limit.chars,
      maxLines: limit.lines,
      actualChars: chars,
      actualLines: lines,
      over,
    };
    results.push(result);
    const counter = document.querySelector(`[data-counter-for="${field}"]`);
    if (counter) {
      counter.textContent = `${chars} / ${limit.chars}${chars > limit.chars ? " OVER" : ""}　${lines} / ${limit.lines}${lines > limit.lines ? " OVER" : ""}`;
      counter.classList.toggle("over", over);
    }
  }
  state.overflow = results.filter((result) => result.over);
  renderCheckSummary();
}

function renderedLineCount(target, text) {
  if (!text) return 0;
  const style = getComputedStyle(target);
  const probe = document.createElement("div");
  probe.textContent = text;
  probe.style.width = `${target.offsetWidth}px`;
  probe.style.fontFamily = style.fontFamily;
  probe.style.fontSize = style.fontSize;
  probe.style.fontWeight = style.fontWeight;
  probe.style.lineHeight = style.lineHeight;
  probe.style.letterSpacing = style.letterSpacing;
  probe.style.whiteSpace = style.whiteSpace;
  probe.style.overflowWrap = style.overflowWrap;
  probe.style.wordBreak = style.wordBreak;
  probe.style.padding = style.padding;
  probe.style.border = "0";
  elements.measurementLayer.replaceChildren(probe);
  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2;
  const verticalPadding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  return Math.max(1, Math.round((probe.scrollHeight - verticalPadding) / lineHeight));
}

function renderCheckSummary() {
  const missing = requiredMissing();
  const issueCount = missing.length + state.overflow.length;
  elements.checkSummary.classList.toggle("has-errors", issueCount > 0);
  elements.checkSummary.innerHTML = issueCount === 0
    ? "必須項目・評価・紙面内表示を確認しました。"
    : `要確認：必須項目 ${missing.length}件、overflow ${state.overflow.length}件。`;
  const messages = [];
  for (const field of missing) messages.push(`<div class="overflow-item">未入力：${escapeHtml(field)}</div>`);
  for (const item of state.overflow) {
    const charSuffix = item.actualChars > item.maxChars ? " OVER" : "";
    const lineSuffix = item.actualLines > item.maxLines ? " OVER" : "";
    messages.push(`<div class="overflow-item">${escapeHtml(item.label)}：${item.actualChars} / ${item.maxChars}${charSuffix}、${item.actualLines} / ${item.maxLines}${lineSuffix}</div>`);
  }
  elements.overflowList.innerHTML = messages.join("");
}

function requiredMissing() {
  const fields = [
    "record_id", "student_id", "display_name", "theme", "character_limit", "diagnosis_date",
    "submission_number", "essay_type", "overall_comment", "rank", "observation_good",
    "observation_concern", "observation_reason", "prescription_first", "prescription_next",
    "prescription_advanced", "key_phrase",
    ...SCORE_FIELDS.map(([field]) => field),
  ];
  for (let index = 1; index <= 8; index += 1) {
    const number = String(index).padStart(2, "0");
    fields.push(`detail_${number}_rating`, `detail_${number}_comment`);
  }
  return fields.filter((field) => state.record[field] === "" || state.record[field] === null || state.record[field] === undefined);
}

function resizePreview() {
  if (matchMedia("print").matches) return;
  const pxPerMm = 96 / 25.4;
  const baseWidth = 420 * pxPerMm;
  const baseHeight = 297 * pxPerMm;
  const width = Math.max(320, elements.previewPane.clientWidth - 48);
  const height = Math.max(240, elements.previewPane.clientHeight - 76);
  const scale = Math.min(width / baseWidth, height / baseHeight);
  elements.paper.style.transform = `scale(${scale})`;
  elements.stage.style.width = `${baseWidth * scale}px`;
  elements.stage.style.height = `${baseHeight * scale}px`;
  elements.previewScale.textContent = `${Math.round(scale * 100)}%`;
}

function formatPaperDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return match ? `${match[1]}年${Number(match[2])}月${Number(match[3])}日` : String(value || "");
}

function renderRecordSelect() {
  const options = [`<option value="sample">サンプル：${escapeHtml(state.record.display_name)}　${escapeHtml(state.record.theme)}</option>`];
  state.cloudRecords.forEach((record, index) => {
    const date = String(record.diagnosis_date || "").replaceAll("-", "/");
    options.push(`<option value="cloud:${index}">${escapeHtml(`${date}　${record.display_name || "名称なし"}　${record.theme || "テーマなし"}`)}</option>`);
  });
  elements.recordSelect.innerHTML = options.join("");
}

function selectRecord() {
  if (elements.recordSelect.value === "sample") return;
  const index = Number(elements.recordSelect.value.split(":")[1]);
  const record = state.cloudRecords[index];
  if (!record) return;
  state.record = normalizeRecord(record);
  state.dirty = false;
  applyRecordToInputs();
  renderAll();
  elements.recordStatus.textContent = `Google Sheetsから読み込み：${state.record.record_id}`;
}

async function importJson() {
  const text = document.getElementById("jsonImport").value.trim();
  try {
    if (!text) throw new Error("JSONが空です。");
    const parsed = JSON.parse(text);
    const source = Array.isArray(parsed) ? parsed[0] : (parsed.data && typeof parsed.data === "object" ? parsed.data : parsed);
    validateImportedRecord(source);
    const candidate = normalizeRecord({ ...state.record, ...source });
    state.record = candidate;
    state.dirty = true;
    applyRecordToInputs();
    renderAll();
    await saveDraft(false);
    elements.importMessage.textContent = "JSONを反映しました。既存データは検証完了後にのみ更新されています。";
    elements.importMessage.style.color = "#256c37";
    elements.recordStatus.textContent = "JUIZ IMPORTから編集中";
  } catch (error) {
    elements.importMessage.textContent = `反映していません：${error.message}`;
    elements.importMessage.style.color = "#a12424";
  }
}

function validateImportedRecord(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("1件分のJSONオブジェクトが必要です。");
  const known = Object.keys(source).filter((key) => FIELDS.includes(key));
  if (!known.length) throw new Error("Schema Ver.1.0のフィールドがありません。");
  if (source.schema_version && String(source.schema_version) !== "1.0") throw new Error(`schema_version ${source.schema_version} は未対応です。`);
  for (const [field] of SCORE_FIELDS) {
    if (source[field] !== undefined && (!Number.isFinite(Number(source[field])) || Number(source[field]) < 1 || Number(source[field]) > 5)) {
      throw new Error(`${field} は1～5で指定してください。`);
    }
  }
  if (source.rank !== undefined && !RANKS.some(([code]) => code === source.rank)) throw new Error("rankが正式6種類に含まれていません。");
  if (source.essay_type !== undefined && !ESSAY_TYPES.some(([code]) => code === source.essay_type)) throw new Error("essay_typeが正式選択肢に含まれていません。");
  for (let index = 1; index <= 8; index += 1) {
    const field = `detail_${String(index).padStart(2, "0")}_rating`;
    if (source[field] !== undefined && source[field] !== "" && !RATINGS.includes(source[field])) throw new Error(`${field} は◎・○・△・×で指定してください。`);
  }
}

function configureGoogleControls() {
  const auth = document.getElementById("googleAuthButton");
  const save = document.getElementById("saveGoogleButton");
  if (!googleStore.configured) {
    auth.disabled = true;
    save.disabled = true;
    auth.title = "config.jsへOAuth Client IDを設定してください";
    save.title = auth.title;
  }
}

async function connectGoogle() {
  try {
    setNotice("info", "Google認証を開始します。ポップアップでNo.Mのアカウントを選択してください。");
    await googleStore.authorize();
    await loadCloudRecords();
  } catch (error) {
    handleGoogleError(error);
  }
}

async function reloadCloudRecords() {
  try {
    if (!googleStore.connected) await googleStore.authorize();
    await loadCloudRecords();
  } catch (error) {
    handleGoogleError(error);
  }
}

async function loadCloudRecords() {
  setNotice("info", "Google Sheetsの診断データを読み込んでいます。現在の編集内容は上書きしません。");
  state.cloudRecords = await googleStore.loadRecords();
  renderRecordSelect();
  elements.recordSelect.value = "sample";
  setNotice("success", `${state.cloudRecords.length}件を読み込みました。上部のデータ選択から選べます。`);
  elements.recordStatus.textContent = "Google Sheetsを再読み込み済み";
}

async function saveToGoogle() {
  try {
    if (!googleStore.connected) throw new Error("Google Sheetsに接続できません。再認証してください。");
    if (!state.record.record_id) state.record.record_id = makeRecordId();
    if (!state.record.created_at) state.record.created_at = tokyoTimestamp();
    state.record.updated_at = tokyoTimestamp();
    applyRecordToInputs();
    const result = await googleStore.saveRecord(state.record);
    state.dirty = false;
    await saveDraft(false);
    setNotice("success", result.action === "updated" ? "既存レコードを更新しました。" : "新規レコードを追加しました。");
    elements.recordStatus.textContent = `保存済み：${state.record.record_id}`;
    await loadCloudRecords();
  } catch (error) {
    handleGoogleError(error);
  }
}

function handleGoogleStatus(status) {
  if (status === "connected") {
    elements.connectionBadge.className = "connection-badge online";
    elements.connectionBadge.textContent = "Google接続中";
    document.getElementById("saveGoogleButton").disabled = false;
  } else if (status === "expired") {
    elements.connectionBadge.className = "connection-badge error";
    elements.connectionBadge.textContent = "再認証が必要";
    setNotice("error", "Google Sheetsに接続できません。再認証してください。手動入力と印刷は利用できます。");
  }
}

function handleGoogleError(error) {
  elements.connectionBadge.className = "connection-badge error";
  elements.connectionBadge.textContent = "接続エラー";
  setNotice("error", `Google Sheetsに接続できません：${error.message}　手動入力と印刷は利用できます。`);
}

async function saveDraftManually() {
  try {
    await saveDraft(true);
  } catch (error) {
    setNotice("error", `端末へ一時保存できません：${error.message}`);
  }
}

async function saveDraft(showMessage) {
  await idbPut("current", { ...state.record, _draftSavedAt: tokyoTimestamp() });
  if (showMessage) setNotice("success", "この端末へ作業中ドラフトを一時保存しました。正式正本はGoogle Sheetsです。");
}

async function restoreDraft() {
  try {
    const draft = await idbGet("current");
    if (!draft) throw new Error("一時保存されたドラフトがありません。");
    state.record = normalizeRecord(draft);
    state.dirty = true;
    applyRecordToInputs();
    renderAll();
    setNotice("success", `端末の一時ドラフトを復元しました（${draft._draftSavedAt || "保存時刻不明"}）。`);
  } catch (error) {
    setNotice("error", error.message);
  }
}

async function printKarte() {
  state.record.printed_at = tokyoTimestamp();
  state.record.print_count = Number(state.record.print_count || 0) + 1;
  renderAll();
  await saveDraft(false).catch(() => {});
  window.print();
}

function renderCheckAfterState() {
  renderAll();
}

function setNotice(kind, text) {
  elements.noticeBar.className = `notice-bar ${kind}`;
  elements.noticeBar.textContent = text;
}

function tokyoTimestamp() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  return formatter.format(new Date()).replace("T", " ");
}

function makeRecordId() {
  return `REC-${tokyoTimestamp().replaceAll(/[- :]/g, "")}`;
}

function idbOpen() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("schreiber-drafts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("drafts", "readwrite");
    transaction.objectStore("drafts").put(value, key);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("drafts", "readonly");
    const request = transaction.objectStore("drafts").get(key);
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
}

window.__SCHREIBER_TEST__ = {
  getState: () => ({ record: { ...state.record }, overflow: [...state.overflow], markerCount: elements.radarData.parentElement.querySelectorAll("circle").length }),
  applyRecord: (record) => { state.record = normalizeRecord({ ...blankRecord(), ...record }); applyRecordToInputs(); renderCheckAfterState(); },
  measureField: (field, text) => {
    const target = document.querySelector(`[data-field="${field}"]`);
    if (!target) throw new Error(`Unknown paper field: ${field}`);
    return {
      chars: Array.from(String(text)).length,
      lines: renderedLineCount(target, String(text)),
      fontSize: getComputedStyle(target).fontSize,
      widthPx: target.offsetWidth,
      heightPx: target.offsetHeight,
    };
  },
};
