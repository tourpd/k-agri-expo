import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireVendorUser } from "@/lib/vendor-auth";
import FileUploadBox from "./FileUploadBox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expo-assets";

type PageProps = {
  searchParams?: Promise<{
    product_id?: string;
    saved?: string;
  }>;
};

function s(v: any, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function n(v: FormDataEntryValue | null) {
  const raw = String(v ?? "").replace(/[^\d.]/g, "");
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function isImageUrl(url?: string) {
  if (!url) return false;
  return /\.(png|jpg|jpeg|webp|gif|avif)(\?.*)?$/i.test(url);
}

function safeFileName(name: string) {
  return name
    .replace(/[^\w.\-가-힣]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

async function uploadFile({
  admin,
  file,
  productId,
  kind,
}: {
  admin: any;
  file: FormDataEntryValue | null;
  productId: string;
  kind: string;
}) {
  if (!(file instanceof File)) return null;
  if (!file.size) return null;

  const path = `expo-products/${productId}/${kind}-${Date.now()}-${safeFileName(
    file.name || "file"
  )}`;

  const bytes = await file.arrayBuffer();

  const upload = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (upload.error) throw new Error(upload.error.message);

  const pub = admin.storage.from(BUCKET).getPublicUrl(path);

  return {
    url: pub.data.publicUrl,
    name: file.name,
  };
}

async function getVendorContext() {
  const session: any = await requireVendorUser();

  const userId =
    session?.user?.id ||
    session?.user_id ||
    session?.userId ||
    session?.id ||
    "";

  const admin = createSupabaseAdminClient();

  const vendorRes = await admin
    .from("vendors")
    .select("vendor_id, company_name, user_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const vendor = vendorRes.data ?? null;

  if (!vendor?.vendor_id) {
    return {
      admin,
      vendor: null,
      boothIds: [] as string[],
      products: [] as any[],
    };
  }

  const boothsRes = await admin
    .from("booths")
    .select("booth_id, name")
    .eq("vendor_id", vendor.vendor_id);

  const booths = boothsRes.data ?? [];
  const boothIds = booths.map((b: any) => String(b.booth_id || "")).filter(Boolean);

  let products: any[] = [];

  if (boothIds.length > 0) {
    const productRes = await admin
      .from("expo_products")
      .select("*")
      .in("booth_id", boothIds)
      .order("created_at", { ascending: false });

    products = productRes.data ?? [];
  }

  return { admin, vendor, boothIds, products };
}

async function saveProduct(formData: FormData) {
  "use server";

  const { admin, boothIds } = await getVendorContext();

  const productId = String(formData.get("product_id") || "");
  const boothId = String(formData.get("booth_id") || "");

  if (!productId) throw new Error("product_id가 없습니다.");
  if (!boothIds.includes(boothId)) throw new Error("이 상품을 수정할 권한이 없습니다.");

  const currentImage = s(formData.get("current_image"));
  const currentLabel = s(formData.get("current_label"));
  const currentManual = s(formData.get("current_manual"));
  const currentManualName = s(formData.get("current_manual_name"));

  const mainImage = await uploadFile({
    admin,
    file: formData.get("main_image_file"),
    productId,
    kind: "main-image",
  });

  const labelImage = await uploadFile({
    admin,
    file: formData.get("label_image_file"),
    productId,
    kind: "label-image",
  });

  const manualFile = await uploadFile({
    admin,
    file: formData.get("manual_file"),
    productId,
    kind: "manual",
  });

  const payload = {
    name: s(formData.get("name")),
    title: s(formData.get("name")),
    headline_text: s(formData.get("headline_text")),
    price_krw: n(formData.get("price_krw")),
    sale_price_krw: n(formData.get("sale_price_krw")),
    usage_summary: s(formData.get("usage_summary")),

    image_url: mainImage?.url || currentImage,
    image_file_url: mainImage?.url || currentImage,
    thumbnail_url: mainImage?.url || currentImage,

    label_image_url: labelImage?.url || currentLabel,

    manual_file_url: manualFile?.url || currentManual,
    manual_file_name: manualFile?.name || currentManualName,

    cta_text: "신청하기",
    purchase_url: "",

    updated_at: new Date().toISOString(),
  };

  const update = await admin
    .from("expo_products")
    .update(payload)
    .eq("product_id", productId)
    .eq("booth_id", boothId);

  if (update.error) throw new Error(update.error.message);

  revalidatePath(`/expo/product/${productId}`);
  revalidatePath("/expo/vendor/product-editor");

  redirect(`/expo/vendor/product-editor?product_id=${productId}&saved=1`);
}

export default async function VendorProductEditorPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const selectedProductId = sp?.product_id || "";
  const saved = sp?.saved === "1";

  const { vendor, products } = await getVendorContext();

  if (!vendor) {
    return (
      <main style={S.page}>
        <div style={S.errorBox}>
          업체 계정을 찾을 수 없습니다.
          <br />
          업체 로그인 상태와 vendors.user_id 연결을 확인해 주세요.
        </div>
      </main>
    );
  }

  const selected =
    products.find((p) => String(p.product_id) === selectedProductId) ||
    products[0] ||
    null;

  return (
    <main style={S.page}>
      <section style={S.header}>
        <div style={S.kicker}>K-AGRI EXPO VENDOR</div>
        <h1 style={S.title}>제품 간편 등록</h1>
        <p style={S.desc}>
          업체는 복잡한 설명을 쓰지 않아도 됩니다. 제품명, 가격, 대표 이미지,
          제품 라벨 또는 사용설명서만 올리면 농민 상품페이지에 바로 반영됩니다.
        </p>
      </section>

      {saved ? <div style={S.successBox}>저장되었습니다. 상품페이지에 반영됐습니다.</div> : null}

      <section style={S.layout}>
        <aside style={S.side}>
          <h2 style={S.sideTitle}>내 상품</h2>

          {products.length === 0 ? (
            <div style={S.empty}>등록된 상품이 없습니다.</div>
          ) : (
            <div style={S.productList}>
              {products.map((p: any) => {
                const active = String(p.product_id) === String(selected?.product_id);

                return (
                  <a
                    key={String(p.product_id)}
                    href={`/expo/vendor/product-editor?product_id=${p.product_id}`}
                    style={active ? S.productItemActive : S.productItem}
                  >
                    <b>{s(p.name || p.title, "상품명 없음")}</b>
                    <span>{String(p.product_id)}</span>
                  </a>
                );
              })}
            </div>
          )}
        </aside>

        <section style={S.editor}>
          {!selected ? (
            <div style={S.emptyBig}>수정할 상품이 없습니다.</div>
          ) : (
            <form action={saveProduct} encType="multipart/form-data" style={S.form}>
              <input type="hidden" name="product_id" value={selected.product_id || ""} />
              <input type="hidden" name="booth_id" value={selected.booth_id || ""} />

              <input
                type="hidden"
                name="current_image"
                value={selected.image_file_url || selected.image_url || ""}
              />
              <input
                type="hidden"
                name="current_label"
                value={selected.label_image_url || ""}
              />
              <input
                type="hidden"
                name="current_manual"
                value={selected.manual_file_url || ""}
              />
              <input
                type="hidden"
                name="current_manual_name"
                value={selected.manual_file_name || ""}
              />

              <section style={S.card}>
                <h2 style={S.cardTitle}>1. 기본 정보</h2>

                <Field
                  label="제품명"
                  name="name"
                  defaultValue={selected.name}
                  placeholder="예: 멸규니 500ml"
                />

                <Field
                  label="농민에게 보일 한 줄 문구"
                  name="headline_text"
                  defaultValue={selected.headline_text}
                  placeholder="예: 해충 피해가 걱정되는 농가를 위한 친환경 관리제"
                />

                <div style={S.grid2}>
                  <Field
                    label="정가"
                    name="price_krw"
                    defaultValue={selected.price_krw}
                    placeholder="예: 50000"
                  />
                  <Field
                    label="EXPO 신청가"
                    name="sale_price_krw"
                    defaultValue={selected.sale_price_krw}
                    placeholder="예: 30000"
                  />
                </div>

                <Field
                  label="간단 사용 기준"
                  name="usage_summary"
                  defaultValue={selected.usage_summary}
                  placeholder="예: 물 500L 기준 500ml"
                />
              </section>

              <section style={S.importantCard}>
                <h2 style={S.cardTitle}>2. 필수 자료 업로드</h2>

                <FileField
                  label="대표 제품 이미지"
                  name="main_image_file"
                  currentUrl={selected.image_file_url || selected.image_url}
                  help="농민 상품페이지 상단에 보이는 제품 사진입니다."
                />

                <FileField
                  label="제품 라벨 / 사용법 이미지"
                  name="label_image_file"
                  currentUrl={selected.label_image_url}
                  help="제품에 붙어 있는 라벨, 사용방법, 희석배수 이미지입니다. 이 자료가 가장 중요합니다."
                />

                <FileField
                  label="사용설명서 또는 카탈로그"
                  name="manual_file"
                  currentUrl={selected.manual_file_url}
                  currentName={selected.manual_file_name}
                  help="PDF 또는 이미지 모두 가능합니다. 있으면 올리고, 없으면 비워도 됩니다."
                />
              </section>

              <section style={S.infoBox}>
                <h2 style={S.infoTitle}>업체 입력은 여기까지면 충분합니다</h2>
                <p style={S.infoText}>
                  혼용, 약해, 특수처리 같은 세부 정보는 라벨이나 설명서에 있으면
                  농민 상세페이지에 자료로 보여줍니다. 나중에 관리자가 OCR/AI로
                  자동 요약할 수 있습니다.
                </p>
              </section>

              <div style={S.stickyBar}>
                <button type="submit" style={S.saveBtn}>
                  저장하기
                </button>

                <a
                  href={`/expo/product/${selected.product_id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={S.previewBtn}
                >
                  상품 보기
                </a>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: any;
  placeholder?: string;
}) {
  return (
    <label style={S.field}>
      <span style={S.label}>{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder || ""}
        style={S.input}
      />
    </label>
  );
}

function FileField({
  label,
  name,
  currentUrl,
  currentName,
  help,
}: {
  label: string;
  name: string;
  currentUrl?: string;
  currentName?: string;
  help?: string;
}) {
  const hasFile = !!currentUrl;

  return (
    <div style={S.fileBox}>
      <div style={S.fileHead}>
        <div>
          <div style={S.fileTitle}>{label}</div>
          {help ? <div style={S.help}>{help}</div> : null}
        </div>

        <div style={hasFile ? S.statusOk : S.statusNo}>
          {hasFile ? "등록됨" : "미등록"}
        </div>
      </div>

      {hasFile ? (
        <div style={S.previewBox}>
          {isImageUrl(currentUrl) ? (
            <img src={currentUrl} alt={label} style={S.previewImage} />
          ) : (
            <div style={S.docBox}>{currentName || "등록된 문서 파일"}</div>
          )}

          <a href={currentUrl} target="_blank" rel="noreferrer" style={S.viewBtn}>
            현재 파일 크게 보기
          </a>
        </div>
      ) : (
        <div style={S.noFile}>아직 등록된 파일이 없습니다.</div>
      )}

      <FileUploadBox name={name} />

      <div style={S.noticeStrong}>
        파일을 고른 뒤 반드시 아래 <b>저장하기</b>를 눌러야 업로드됩니다.
      </div>
    </div>
  );
}

const S: Record<string, any> = {
  page: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: 24,
    background: "#f8fafc",
  },
  header: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  kicker: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: 950,
  },
  title: {
    margin: "8px 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.7,
    color: "#475569",
  },
  successBox: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 18,
    background: "#ecfdf5",
    border: "1px solid #86efac",
    color: "#166534",
    fontSize: 18,
    fontWeight: 950,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: 16,
    alignItems: "start",
  },
  side: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 16,
    position: "sticky",
    top: 16,
  },
  sideTitle: {
    margin: "0 0 12px",
    fontSize: 21,
    fontWeight: 950,
  },
  productList: {
    display: "grid",
    gap: 8,
  },
  productItem: {
    display: "grid",
    gap: 4,
    padding: 12,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#111827",
    textDecoration: "none",
    fontSize: 14,
  },
  productItemActive: {
    display: "grid",
    gap: 4,
    padding: 12,
    borderRadius: 14,
    background: "#ecfdf5",
    border: "2px solid #22c55e",
    color: "#111827",
    textDecoration: "none",
    fontSize: 14,
  },
  editor: {
    minWidth: 0,
  },
  form: {
    display: "grid",
    gap: 16,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 22,
  },
  importantCard: {
    background: "#fff",
    border: "2px solid #bbf7d0",
    borderRadius: 22,
    padding: 22,
  },
  cardTitle: {
    margin: "0 0 18px",
    fontSize: 25,
    fontWeight: 950,
    color: "#111827",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  field: {
    display: "grid",
    gap: 8,
    marginBottom: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: 950,
    color: "#334155",
  },
  input: {
    width: "100%",
    height: 56,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    fontSize: 17,
    boxSizing: "border-box",
  },
  fileBox: {
    display: "grid",
    gap: 14,
    padding: 18,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    marginBottom: 16,
  },
  fileHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  fileTitle: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
  },
  help: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 1.6,
    color: "#64748b",
    fontWeight: 800,
  },
  statusOk: {
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 950,
    flexShrink: 0,
  },
  statusNo: {
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    background: "#ffedd5",
    color: "#9a3412",
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 950,
    flexShrink: 0,
  },
  previewBox: {
    padding: 12,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #cbd5e1",
    display: "grid",
    gap: 10,
  },
  previewImage: {
    width: "100%",
    maxHeight: 320,
    objectFit: "contain",
    borderRadius: 12,
    background: "#fff",
  },
  docBox: {
    minHeight: 120,
    borderRadius: 12,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
    fontSize: 18,
    fontWeight: 950,
  },
  viewBtn: {
    height: 48,
    borderRadius: 12,
    background: "#111827",
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    fontWeight: 950,
  },
  noFile: {
    padding: 18,
    borderRadius: 14,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    fontSize: 18,
    fontWeight: 900,
  },
  uploadBtn: {
    height: 58,
    borderRadius: 14,
    background: "#16a34a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    fontWeight: 950,
    cursor: "pointer",
  },
  hiddenInput: {
    display: "none",
  },
  notice: {
    padding: 12,
    borderRadius: 12,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.6,
  },
  infoBox: {
    padding: 20,
    borderRadius: 20,
    background: "#ecfdf5",
    border: "1px solid #86efac",
  },
  infoTitle: {
    margin: "0 0 8px",
    fontSize: 22,
    fontWeight: 950,
    color: "#166534",
  },
  infoText: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.8,
    color: "#166534",
    fontWeight: 800,
  },
  stickyBar: {
    position: "sticky",
    bottom: 0,
    display: "grid",
    gridTemplateColumns: "1fr 180px",
    gap: 10,
    background: "rgba(248,250,252,0.94)",
    backdropFilter: "blur(8px)",
    padding: 12,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
  },
  saveBtn: {
    height: 60,
    border: "none",
    borderRadius: 14,
    background: "#16a34a",
    color: "#fff",
    fontSize: 20,
    fontWeight: 950,
    cursor: "pointer",
  },
  previewBtn: {
    height: 60,
    borderRadius: 14,
    background: "#111827",
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 950,
  },
  realFileInput: {
  width: "100%",
  padding: 18,
  borderRadius: 14,
  background: "#ffffff",
  border: "2px solid #16a34a",
  fontSize: 18,
  fontWeight: 900,
  boxSizing: "border-box",
},

noticeStrong: {
  padding: 14,
  borderRadius: 12,
  background: "#fef3c7",
  border: "1px solid #f59e0b",
  color: "#92400e",
  fontSize: 16,
  fontWeight: 950,
  lineHeight: 1.6,
},
  empty: {
    padding: 16,
    borderRadius: 14,
    background: "#f8fafc",
    color: "#64748b",
    fontWeight: 800,
    lineHeight: 1.7,
  },
  emptyBig: {
    padding: 32,
    borderRadius: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#64748b",
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.8,
  },
  errorBox: {
    padding: 24,
    borderRadius: 16,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 900,
    lineHeight: 1.8,
  },
};