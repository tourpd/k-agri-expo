/**
 * 기업 전화번호부 (DB에 번호가 비어 있을 때 쓰는 보조 명단)
 *
 * 기업 이름(브랜드명·부스명·제품의 회사명)에 key가 포함되면 그 번호를 씁니다.
 * DB(부스 phone, 입점 신청서 phone)에 번호가 있으면 그쪽이 먼저입니다.
 * 대표님이 알려 주신 번호만 적습니다.
 */
export const COMPANY_PHONES: Array<{ match: string[]; phone: string; label: string }> = [
  { match: ["도프", "dof", "DOF"], phone: "031-683-2444", label: "도프" },
];

export function companyPhoneByName(name: string | null | undefined): string | null {
  if (!name) return null;
  const n = name.toLowerCase();
  for (const c of COMPANY_PHONES) {
    if (c.match.some((m) => n.includes(m.toLowerCase()))) return c.phone.replace(/[^\d+]/g, "");
  }
  return null;
}

/** 제품명·설명에 기업 이름이 들어 있을 때 (예: "도프 싹쓰리충") */
export function companyPhoneByText(...texts: Array<string | null | undefined>): string | null {
  for (const t of texts) {
    const p = companyPhoneByName(t);
    if (p) return p;
  }
  return null;
}
