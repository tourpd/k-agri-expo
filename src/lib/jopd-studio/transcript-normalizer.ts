export const JOPD_TERMS: Array<{
  canonical: string;
  variants: string[];
}> = [
  {
    canonical: "홍산마늘",
    variants: [
      "홍삼마늘",
      "홍산 마늘",
      "홍삼 마늘",
      "홍산마늘",
    ],
  },
  {
    canonical: "백령도",
    variants: [
      "백령도",
      "백영도",
      "백령 도",
    ],
  },
];

export function normalizeTranscriptText(
  input: string
) {
  let text = String(input || "");

  for (const term of JOPD_TERMS) {
    for (const variant of term.variants) {
      if (variant === term.canonical) continue;

      text = text.split(variant).join(term.canonical);
    }
  }

  return text;
}

export function isLowValueClosing(
  input: string
) {
  const text = normalizeTranscriptText(input)
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /^감사합니다[.! ]*$/,
    /^고맙습니다[.! ]*$/,
    /^시청해\s*주셔서\s*감사합니다[.! ]*$/,
    /^시청해주셔서\s*감사합니다[.! ]*$/,
    /^오늘도\s*영상\s*봐주셔서\s*감사합니다[.! ]*$/,
    /^촬영에\s*협조해주신.*감사합니다[.! ]*$/,
  ];

  return patterns.some((pattern) =>
    pattern.test(text)
  );
}

export function looksLikeQuestion(
  input: string
) {
  const text = normalizeTranscriptText(input);

  return (
    text.includes("?") ||
    /왜\s/.test(text) ||
    /왜.*(하|해|심|심는|가는|하는)/.test(text) ||
    /(뭔가요|뭐예요|무엇|어떻게|어디|언제|누가|이유|겁니까|건가요|거예요|입니까)/.test(
      text
    )
  );
}
