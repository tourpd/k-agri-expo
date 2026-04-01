type BizVerifyInput = {
  bizNo: string;
  ceoName: string;
  openDate?: string;
};

type BizVerifyResult = {
  ok: boolean;
  source: "official-nts";
  status?: string;
  taxType?: string;
  validMatch?: boolean;
  raw: any;
  reason?: string;
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function normalizeOpenDate(v?: string) {
  return onlyDigits(v || "");
}

// 사업자 상태조회
async function fetchStatus(serviceKey: string, bizNo: string) {
  const url =
    "https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=" +
    encodeURIComponent(serviceKey);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      b_no: [onlyDigits(bizNo)],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`status API failed: ${res.status}`);
  }

  return await res.json();
}

// 사업자 진위확인
async function fetchTruth(
  serviceKey: string,
  bizNo: string,
  ceoName: string,
  openDate?: string
) {
  const url =
    "https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=" +
    encodeURIComponent(serviceKey);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      businesses: [
        {
          b_no: onlyDigits(bizNo),
          start_dt: normalizeOpenDate(openDate),
          p_nm: ceoName?.trim() || "",
        },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`validate API failed: ${res.status}`);
  }

  return await res.json();
}

export async function verifyBusinessOfficial(
  input: BizVerifyInput
): Promise<BizVerifyResult> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

  if (!serviceKey) {
    return {
      ok: false,
      source: "official-nts",
      raw: null,
      reason: "DATA_GO_KR_SERVICE_KEY missing",
    };
  }

  const bizNo = onlyDigits(input.bizNo);
  const ceoName = input.ceoName?.trim() || "";
  const openDate = input.openDate?.trim() || "";

  if (!bizNo || bizNo.length !== 10) {
    return {
      ok: false,
      source: "official-nts",
      raw: null,
      reason: "invalid biz number",
    };
  }

  try {
    const [statusRaw, truthRaw] = await Promise.all([
      fetchStatus(serviceKey, bizNo),
      fetchTruth(serviceKey, bizNo, ceoName, openDate),
    ]);

    const statusItem = statusRaw?.data?.[0] ?? null;
    const truthItem = truthRaw?.data?.[0] ?? null;

    // 응답 필드명은 서비스 버전에 따라 조금 달라질 수 있어서 안전하게 읽음
    const statusText =
      statusItem?.b_stt ??
      statusItem?.b_stt_cd ??
      statusItem?.status ??
      "";

    const taxType =
      statusItem?.tax_type ??
      statusItem?.b_tax_type ??
      "";

    const validMatch =
      truthItem?.valid === "01" ||
      truthItem?.valid === 1 ||
      truthItem?.valid === true ||
      truthItem?.status === "01" ||
      truthItem?.truth_yn === "Y" ||
      truthItem?.match === true;

    const isInactive =
      String(statusText).includes("폐업") ||
      String(statusText).includes("휴업");

    const ok = Boolean(validMatch) && !isInactive;

    return {
      ok,
      source: "official-nts",
      status: String(statusText || ""),
      taxType: String(taxType || ""),
      validMatch: Boolean(validMatch),
      raw: {
        statusRaw,
        truthRaw,
      },
      reason: ok ? undefined : "official verification failed or inactive business",
    };
  } catch (e: any) {
    return {
      ok: false,
      source: "official-nts",
      raw: {
        error: e?.message || "unknown",
      },
      reason: e?.message || "official verification error",
    };
  }
}