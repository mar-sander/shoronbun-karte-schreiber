export const SCHEMA_VERSION = "1.0";

export const FIELDS = [
  "schema_version", "record_id", "student_id", "display_name", "created_at", "updated_at",
  "karte_version", "diagnosis_version", "status", "karte_no", "theme", "character_limit",
  "diagnosis_date", "submission_number", "essay_type", "overall_comment", "score_prompt",
  "score_claim", "score_own_thought", "score_evidence", "score_structure", "overall_notice", "rank",
  "detail_01_rating", "detail_01_comment", "detail_02_rating", "detail_02_comment",
  "detail_03_rating", "detail_03_comment", "detail_04_rating", "detail_04_comment",
  "detail_05_rating", "detail_05_comment", "detail_06_rating", "detail_06_comment",
  "detail_07_rating", "detail_07_comment", "detail_08_rating", "detail_08_comment",
  "observation_good", "observation_concern", "observation_reason", "prescription_first",
  "prescription_next", "prescription_advanced", "key_phrase", "note", "theme_category",
  "primary_issue", "previous_record_id", "is_revision", "improvement_note", "confirmed",
  "printed_at", "print_count",
];

export const ESSAY_TYPES = [
  ["episode", "エピソード型"],
  ["certain_but", "確かに・しかし型"],
  ["mixed", "混在"],
  ["prompt_mismatch", "設問不一致"],
  ["other", "その他"],
];

export const RANKS = [
  ["A", "A — Good Direction"],
  ["B", "B — Almost There"],
  ["C-1", "C-1 — Claim First"],
  ["C-2", "C-2 — Support Your Claim"],
  ["D-1", "D-1 — Rebuild Your Logic"],
  ["D-2", "D-2 — Check the Prompt"],
];

export const SCORE_FIELDS = [
  ["score_prompt", "設問理解"],
  ["score_claim", "主張の明確さ"],
  ["score_own_thought", "自分の考え"],
  ["score_evidence", "根拠の説得力"],
  ["score_structure", "構成力"],
];

export const DETAIL_ITEMS = [
  ["設問に答えているか", "問いの要求に正面から応えているか"],
  ["テーマ・課題文・資料を踏まえているか", "与えられた条件・情報を適切に扱っているか"],
  ["主張・結論が明確か", "自分の立場・結論がはっきりしているか"],
  ["自分の考えがあるか", "一般論の羅列ではなく、自分の考えが見えるか"],
  ["根拠が結論を支えているか", "理由・具体例・資料が適切で説得力があるか"],
  ["構成・順序が整理されているか", "読みやすい流れで、論理がつながっているか"],
  ["最後で結論を回収できているか", "冒頭の主張と呼応した締めになっているか"],
  ["条件・形式を守れているか", "字数・設問条件・段落・明らかな誤字など"],
];

export const RATINGS = ["◎", "○", "△", "×"];

export const THEME_CATEGORIES = [
  ["", "未選択"], ["society", "社会"], ["technology", "技術"], ["education", "教育"],
  ["environment", "環境"], ["career", "進路"], ["ethics", "倫理"], ["other", "その他"],
];

export const PRIMARY_ISSUES = [
  ["", "未選択"], ["prompt", "設問理解"], ["claim", "主張"], ["own_thought", "自分の考え"],
  ["evidence", "根拠"], ["structure", "構成"], ["conclusion", "結論回収"],
  ["format", "条件・形式"], ["other", "その他"],
];

export const LIMITS = {
  theme: { chars: 50, lines: 2, label: "テーマ・設問" },
  display_name: { chars: 15, lines: 1, label: "display_name" },
  overall_comment: { chars: 19, lines: 1, label: "総合所見" },
  overall_notice: { chars: 32, lines: 2, label: "Overall 気づいたこと" },
  observation_good: { chars: 57, lines: 3, label: "Observation①" },
  observation_concern: { chars: 57, lines: 3, label: "Observation②" },
  observation_reason: { chars: 57, lines: 3, label: "Observation③" },
  prescription_first: { chars: 57, lines: 3, label: "Prescription①" },
  prescription_next: { chars: 57, lines: 3, label: "Prescription②" },
  prescription_advanced: { chars: 57, lines: 3, label: "Prescription③" },
  key_phrase: { chars: 35, lines: 2, label: "Key Phrase" },
  note: { chars: 60, lines: 3, label: "Note" },
};

for (let index = 1; index <= 8; index += 1) {
  const key = `detail_${String(index).padStart(2, "0")}_comment`;
  LIMITS[key] = { chars: 45, lines: 2, label: `Detailed Check ${index}` };
}

export function blankRecord() {
  const record = Object.fromEntries(FIELDS.map((field) => [field, ""]));
  Object.assign(record, {
    schema_version: SCHEMA_VERSION,
    karte_version: "1.0",
    diagnosis_version: "1.0",
    status: "draft",
    submission_number: 1,
    score_prompt: 3,
    score_claim: 3,
    score_own_thought: 3,
    score_evidence: 3,
    score_structure: 3,
    essay_type: "mixed",
    rank: "C-1",
    confirmed: false,
    is_revision: false,
    print_count: 0,
  });
  for (let index = 1; index <= 8; index += 1) {
    record[`detail_${String(index).padStart(2, "0")}_rating`] = "";
  }
  return record;
}

export function normalizeRecord(input = {}) {
  const record = blankRecord();
  for (const field of FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, field) && input[field] !== null) record[field] = input[field];
  }
  for (const field of SCORE_FIELDS.map(([key]) => key)) record[field] = clampScore(record[field]);
  record.submission_number = finiteNumber(record.submission_number, 1);
  record.character_limit = record.character_limit === "" ? "" : finiteNumber(record.character_limit, "");
  record.print_count = finiteNumber(record.print_count, 0);
  record.confirmed = normalizeBoolean(record.confirmed);
  record.is_revision = normalizeBoolean(record.is_revision);
  return record;
}

export function rowToRecord(headers, row) {
  const input = {};
  headers.forEach((header, index) => { if (FIELDS.includes(header)) input[header] = row[index] ?? ""; });
  return normalizeRecord(input);
}

export function recordToRow(record) {
  return FIELDS.map((field) => {
    const value = record[field];
    if (typeof value === "boolean") return value;
    return value ?? "";
  });
}

export function validateSchema(headers) {
  const missing = FIELDS.filter((field) => !headers.includes(field));
  const extra = headers.filter((field) => !FIELDS.includes(field));
  return { valid: headers.length === 55 && missing.length === 0 && extra.length === 0, missing, extra, count: headers.length };
}

function clampScore(value) {
  if (value === "" || value === null || value === undefined) return 3;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(5, Math.max(1, Math.round(number))) : 3;
}

function finiteNumber(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}
