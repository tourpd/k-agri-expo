import { makeEntityRef, makeSourceRef } from "../identity";
import type { KagriAdapterRecord } from "../types";
import type { KagriProvenance } from "../provenance";

export type KagriFarmer = {
  farmerId: string;
  userId: string | null;
  mainCrop: string | null;
  province: string | null;
  city: string | null;
  region: string | null;
  source: string | null;
  status: string | null;
  verified: boolean | null;
};

export type KagriPhotoDoctorProblem = {
  problemId: string;
  diagnosisId: string;
  crop: string | null;
  province: string | null;
  city: string | null;

  diagnosis: string | null;
  finalJudgement: string | null;
  confidence: number | null;

  symptoms: unknown[];
  possibleCauses: unknown[];
  doNow: unknown[];
  doNot: unknown[];
  mustCheck: unknown[];

  createdAt: string | null;
  provenance: KagriProvenance;
};

export type KagriPhotoDoctorConsultLink = {
  consultId: string;
  diagnosisId: string | null;
  crop: string | null;
  issue: string | null;
  status: string | null;
  priority: string | null;
};

export type KagriPhotoDoctorOrderLink = {
  orderId: string;
  diagnosisId: string | null;
  productId: string | null;
  crop: string | null;
  diagnosis: string | null;
  issue: string | null;
  issueType: string | null;
  sourceType: string | null;
  orderStatus: string | null;
  paymentStatus: string | null;
};

type FarmerRow = {
  farmer_id: string;
  user_id?: string | null;
  main_crop?: string | null;
  province?: string | null;
  city?: string | null;
  region?: string | null;
  source?: string | null;
  status?: string | null;
  verified?: boolean | null;
};

type PhotoDoctorRawRow = {
  id: string;
  diagnosis_id?: string | null;
  crop?: string | null;
  province?: string | null;
  city?: string | null;
  diagnosis?: string | null;
  final_judgement?: string | null;
  confidence?: number | null;
  symptoms?: unknown[] | null;
  possible_causes?: unknown[] | null;
  do_now?: unknown[] | null;
  do_not?: unknown[] | null;
  must_check?: unknown[] | null;
  created_at?: string | null;
};

type PhotoDoctorConsultRow = {
  id: string;
  diagnosis_id?: string | null;
  crop?: string | null;
  issue?: string | null;
  status?: string | null;
  priority?: string | null;
};

type PhotoDoctorOrderRow = {
  id: string;
  diagnosis_id?: string | null;
  product_id?: string | null;
  crop?: string | null;
  crop_name?: string | null;
  diagnosis?: string | null;
  issue?: string | null;
  issue_type?: string | null;
  source_type?: string | null;
  order_status?: string | null;
  payment_status?: string | null;
};

function cleanId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
}

export function adaptFarmer(
  row: FarmerRow,
): KagriAdapterRecord<KagriFarmer> {
  const farmerId = cleanId(row.farmer_id);

  if (!farmerId) {
    throw new Error(
      "K-AGRI farmer adapter: farmer_id가 없습니다.",
    );
  }

  const source = makeSourceRef(
    "farmer",
    "farmers",
    farmerId,
  );

  return {
    entity: makeEntityRef(
      "FARMER",
      source,
      farmerId,
    ),
    data: {
      farmerId,
      userId: cleanId(row.user_id),
      mainCrop: row.main_crop ?? null,
      province: row.province ?? null,
      city: row.city ?? null,
      region: row.region ?? null,
      source: row.source ?? null,
      status: row.status ?? null,
      verified: row.verified ?? null,
    },
  };
}

export function adaptPhotoDoctorProblem(
  row: PhotoDoctorRawRow,
): KagriAdapterRecord<KagriPhotoDoctorProblem> {
  const diagnosisId = cleanId(row.diagnosis_id);

  if (!diagnosisId) {
    throw new Error(
      "K-AGRI PhotoDoctor adapter: diagnosis_id가 없습니다.",
    );
  }

  const source = makeSourceRef(
    "photodoctor",
    "photodoctor_raw_logs",
    diagnosisId,
  );

  return {
    entity: makeEntityRef(
      "PROBLEM",
      source,
      diagnosisId,
    ),
    data: {
      problemId: diagnosisId,
      diagnosisId,
      crop: row.crop ?? null,
      province: row.province ?? null,
      city: row.city ?? null,

      diagnosis: row.diagnosis ?? null,
      finalJudgement: row.final_judgement ?? null,
      confidence: row.confidence ?? null,

      symptoms: row.symptoms ?? [],
      possibleCauses: row.possible_causes ?? [],
      doNow: row.do_now ?? [],
      doNot: row.do_not ?? [],
      mustCheck: row.must_check ?? [],

      createdAt: row.created_at ?? null,

      provenance: {
        type: "AI_INFERENCE",
        source,
        verificationStatus: "CANDIDATE",
        createdAt: row.created_at ?? undefined,
      },
    },
  };
}

export function adaptPhotoDoctorConsultLink(
  row: PhotoDoctorConsultRow,
): KagriPhotoDoctorConsultLink {
  return {
    consultId: row.id,
    diagnosisId: cleanId(row.diagnosis_id),
    crop: row.crop ?? null,
    issue: row.issue ?? null,
    status: row.status ?? null,
    priority: row.priority ?? null,
  };
}

export function adaptPhotoDoctorOrderLink(
  row: PhotoDoctorOrderRow,
): KagriPhotoDoctorOrderLink {
  return {
    orderId: row.id,
    diagnosisId: cleanId(row.diagnosis_id),
    productId: cleanId(row.product_id),
    crop: row.crop ?? row.crop_name ?? null,
    diagnosis: row.diagnosis ?? null,
    issue: row.issue ?? null,
    issueType: row.issue_type ?? null,
    sourceType: row.source_type ?? null,
    orderStatus: row.order_status ?? null,
    paymentStatus: row.payment_status ?? null,
  };
}

export function canLinkPhotoDoctorByDiagnosisId(
  diagnosisId: unknown,
): diagnosisId is string {
  return cleanId(diagnosisId) !== null;
}
