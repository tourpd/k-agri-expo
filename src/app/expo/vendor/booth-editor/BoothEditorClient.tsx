"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type Vendor = {
  vendor_id: string;
  user_id: string;
  company_name?: string | null;
};

type Booth = {
  booth_id: string;
  vendor_id: string;
  name?: string | null;
  region?: string | null;
  category_primary?: string | null;
  intro?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  hall_id?: string | null;
};

type Product = {
  product_id: string;
  booth_id: string;
  name?: string | null;
  description?: string | null;
  price_text?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  image_url?: string | null;
  youtube_url?: string | null;
  catalog_url?: string | null;
  catalog_filename?: string | null;
};

type StatusType = "success" | "error" | "";

const MANAGE_HREF = "/vendor/manage";

function isBlankProduct(product: Product) {
  return (
    !product.name?.trim() &&
    !product.description?.trim() &&
    !product.price_text?.trim() &&
    !product.image_url?.trim() &&
    !product.youtube_url?.trim() &&
    !product.catalog_url?.trim() &&
    !product.catalog_filename?.trim()
  );
}

function toSafeProduct(product: Product, idx: number, boothId: string): Product {
  return {
    product_id: product.product_id,
    booth_id: product.booth_id || boothId,
    name: product.name ?? "",
    description: product.description ?? "",
    price_text: product.price_text ?? "",
    sort_order:
      typeof product.sort_order === "number" && Number.isFinite(product.sort_order)
        ? product.sort_order
        : idx + 1,
    is_active: product.is_active !== false,
    image_url: product.image_url ?? "",
    youtube_url: product.youtube_url ?? "",
    catalog_url: product.catalog_url ?? "",
    catalog_filename: product.catalog_filename ?? "",
  };
}

export default function BoothEditorClient({
  vendor,
  booth,
  initialProducts,
}: {
  vendor: Vendor;
  booth: Booth;
  initialProducts: Product[];
}) {
  const router = useRouter();

  const [savingBooth, setSavingBooth] = useState(false);
  const [savingAndExit, setSavingAndExit] = useState(false);
  const [savingAllAndExit, setSavingAllAndExit] = useState(false);
  const [savingProduct, setSavingProduct] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("");

  const [isDirty, setIsDirty] = useState(false);

  const [boothForm, setBoothForm] = useState({
    name: booth.name ?? "",
    region: booth.region ?? "",
    category_primary: booth.category_primary ?? "",
    intro: booth.intro ?? "",
    description: booth.description ?? "",
    phone: booth.phone ?? "",
    email: booth.email ?? "",
    hall_id: booth.hall_id ?? "",
  });

  const [products, setProducts] = useState<Product[]>(
    initialProducts.length > 0
      ? initialProducts.map((p, idx) => toSafeProduct(p, idx, booth.booth_id))
      : [
          {
            product_id: `new-${Date.now()}`,
            booth_id: booth.booth_id,
            name: "",
            description: "",
            price_text: "",
            sort_order: 1,
            is_active: true,
            image_url: "",
            youtube_url: "",
            catalog_url: "",
            catalog_filename: "",
          },
        ]
  );

  const activeCount = useMemo(
    () => products.filter((p) => p.is_active !== false).length,
    [products]
  );

  const isBusy =
    savingBooth ||
    savingAndExit ||
    savingAllAndExit ||
    !!savingProduct ||
    !!deletingProduct;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty || isBusy) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isBusy]);

  function showSuccess(message: string) {
    setStatusType("success");
    setStatusMessage(message);
  }

  function showError(message: string) {
    setStatusType("error");
    setStatusMessage(message);
  }

  function clearStatus() {
    setStatusType("");
    setStatusMessage("");
  }

  function updateBoothField(key: keyof typeof boothForm, value: string) {
    setBoothForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  function addProduct() {
    setProducts((prev) => [
      ...prev,
      {
        product_id: `new-${Date.now()}-${prev.length + 1}`,
        booth_id: booth.booth_id,
        name: "",
        description: "",
        price_text: "",
        sort_order: prev.length + 1,
        is_active: true,
        image_url: "",
        youtube_url: "",
        catalog_url: "",
        catalog_filename: "",
      },
    ]);
    setIsDirty(true);
  }

  function updateProduct(idx: number, patch: Partial<Product>) {
    setProducts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
    setIsDirty(true);
  }

  async function saveBoothInternal() {
    const res = await fetch("/api/expo/vendor/my-booth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booth_id: booth.booth_id,
        ...boothForm,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "부스 저장 실패");
    }

    return data;
  }

  async function saveProductInternal(product: Product, idx: number) {
    const payload = toSafeProduct(product, idx, booth.booth_id);

    const res = await fetch("/api/expo/vendor/my-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booth_id: booth.booth_id,
        product_id: payload.product_id.startsWith("new-") ? null : payload.product_id,
        name: payload.name ?? "",
        description: payload.description ?? "",
        price_text: payload.price_text ?? "",
        sort_order: payload.sort_order ?? idx + 1,
        is_active: payload.is_active !== false,
        image_url: payload.image_url ?? "",
        youtube_url: payload.youtube_url ?? "",
        catalog_url: payload.catalog_url ?? "",
        catalog_filename: payload.catalog_filename ?? "",
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "제품 저장 실패");
    }

    return data.product as Product;
  }

  function moveToManagePage() {
    router.push(MANAGE_HREF);
  }

  async function saveBooth() {
    clearStatus();
    setSavingBooth(true);

    try {
      await saveBoothInternal();
      showSuccess("부스 정보가 저장되었습니다.");
      setIsDirty(false);
      router.refresh();
    } catch (e: any) {
      showError(e?.message || "부스 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingBooth(false);
    }
  }

  async function saveBoothAndExit() {
    clearStatus();
    setSavingAndExit(true);

    try {
      await saveBoothInternal();
      setIsDirty(false);
      moveToManagePage();
      return;
    } catch (e: any) {
      showError(e?.message || "부스 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingAndExit(false);
    }
  }

  async function saveProduct(product: Product, idx: number) {
    clearStatus();
    setSavingProduct(product.product_id);

    try {
      if (isBlankProduct(product)) {
        throw new Error("빈 제품은 저장할 수 없습니다. 제품명을 입력하거나 내용을 채워주십시오.");
      }

      const savedProduct = await saveProductInternal(product, idx);

      setProducts((prev) => {
        const next = [...prev];
        next[idx] = toSafeProduct(
          {
            ...savedProduct,
            booth_id: savedProduct.booth_id ?? booth.booth_id,
          },
          idx,
          booth.booth_id
        );
        return next;
      });

      setIsDirty(false);
      showSuccess("제품이 저장되었습니다.");
    } catch (e: any) {
      showError(e?.message || "제품 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingProduct(null);
    }
  }

  async function saveAllAndExit() {
    clearStatus();
    setSavingAllAndExit(true);

    try {
      await saveBoothInternal();

      const nextProducts = [...products];
      let savedCount = 0;

      for (let i = 0; i < nextProducts.length; i += 1) {
        const product = nextProducts[i];

        if (isBlankProduct(product)) {
          continue;
        }

        const saved = await saveProductInternal(product, i);
        nextProducts[i] = toSafeProduct(
          {
            ...saved,
            booth_id: saved.booth_id ?? booth.booth_id,
          },
          i,
          booth.booth_id
        );
        savedCount += 1;
      }

      setProducts(nextProducts);
      setIsDirty(false);
      showSuccess(
        savedCount > 0
          ? `부스와 제품 ${savedCount}개를 저장했습니다.`
          : "부스 정보를 저장했습니다."
      );

      moveToManagePage();
      return;
    } catch (e: any) {
      showError(e?.message || "전체 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingAllAndExit(false);
    }
  }

  async function deleteProduct(productId: string) {
    if (!productId) return;

    clearStatus();

    if (productId.startsWith("new-")) {
      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      setIsDirty(true);
      showSuccess("임시 제품이 목록에서 제거되었습니다.");
      return;
    }

    setDeletingProduct(productId);

    try {
      const res = await fetch("/api/expo/vendor/my-products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booth_id: booth.booth_id,
          product_id: productId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "제품 삭제 실패");
      }

      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      setIsDirty(false);
      showSuccess("제품이 삭제되었습니다.");
    } catch (e: any) {
      showError(e?.message || "제품 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingProduct(null);
    }
  }

  function exitWithoutSave() {
    if (isBusy) return;

    if (isDirty) {
      const ok = window.confirm(
        "저장되지 않은 변경사항이 있습니다. 정말 저장 없이 나가시겠습니까?"
      );
      if (!ok) return;
    }

    router.push(MANAGE_HREF);
  }

  return (
    <main style={pageWrap}>
      <header style={header}>
        <div>
          <div style={eyebrow}>VENDOR BOOTH EDITOR</div>
          <h1 style={title}>내 부스 편집</h1>
          <div style={meta}>
            업체: <b>{vendor.company_name ?? vendor.vendor_id}</b> · 부스:{" "}
            <b>{booth.booth_id}</b> · 활성 제품 {activeCount}개
          </div>
        </div>

        <div style={topActionRow}>
          <button
            type="button"
            onClick={saveAllAndExit}
            style={primaryBtn}
            disabled={isBusy}
          >
            {savingAllAndExit ? "전체 저장 후 이동 중..." : "전체 저장 후 나가기"}
          </button>

          <Link href={MANAGE_HREF} style={secondaryLinkBtn}>
            관리 화면으로
          </Link>

          <Link
            href={`/expo/booths/${encodeURIComponent(booth.booth_id)}`}
            style={secondaryLinkBtn}
          >
            공개 부스 보기
          </Link>
        </div>
      </header>

      {statusMessage ? (
        <div
          style={{
            ...messageBox,
            ...(statusType === "error" ? errorMessageBox : successMessageBox),
          }}
        >
          {statusMessage}
        </div>
      ) : null}

      <section style={section}>
        <div style={sectionTitle}>부스 기본 정보</div>

        <div style={grid2}>
          <Field label="부스명">
            <input
              value={boothForm.name}
              onChange={(e) => updateBoothField("name", e.target.value)}
              style={input}
              placeholder="예: 도프"
              disabled={isBusy}
            />
          </Field>

          <Field label="지역">
            <input
              value={boothForm.region}
              onChange={(e) => updateBoothField("region", e.target.value)}
              style={input}
              placeholder="예: 경기"
              disabled={isBusy}
            />
          </Field>

          <Field label="카테고리">
            <input
              value={boothForm.category_primary}
              onChange={(e) => updateBoothField("category_primary", e.target.value)}
              style={input}
              placeholder="예: 비료 / 농기계 / 종자"
              disabled={isBusy}
            />
          </Field>

          <Field label="전시장 ID">
            <input
              value={boothForm.hall_id}
              onChange={(e) => updateBoothField("hall_id", e.target.value)}
              style={input}
              placeholder="예: agri-inputs / machines"
              disabled={isBusy}
            />
          </Field>

          <Field label="대표 연락처(브릿지용)">
            <input
              value={boothForm.phone}
              onChange={(e) => updateBoothField("phone", e.target.value)}
              style={input}
              placeholder="예: 1522-5284"
              disabled={isBusy}
            />
          </Field>

          <Field label="대표 이메일">
            <input
              value={boothForm.email}
              onChange={(e) => updateBoothField("email", e.target.value)}
              style={input}
              placeholder="예: sales@company.com"
              disabled={isBusy}
            />
          </Field>
        </div>

        <div style={helpText}>
          이 연락처는 공개 화면에서 바로 노출되는 번호가 아니라, 상담/브릿지 연결에
          사용되는 대표 연락처 기준으로 운영하는 것을 권장합니다.
        </div>

        <Field label="한 줄 소개">
          <textarea
            value={boothForm.intro}
            onChange={(e) => updateBoothField("intro", e.target.value)}
            style={textareaShort}
            placeholder="예: 해조추출물·비료·농민 특가 전문"
            disabled={isBusy}
          />
        </Field>

        <Field label="부스 설명">
          <textarea
            value={boothForm.description}
            onChange={(e) => updateBoothField("description", e.target.value)}
            style={textarea}
            placeholder="부스 소개, 장점, 상담 유도 문구를 넣으십시오."
            disabled={isBusy}
          />
        </Field>

        <div style={actions}>
          <button
            type="button"
            onClick={saveBooth}
            style={primaryBtn}
            disabled={isBusy}
          >
            {savingBooth ? "저장 중..." : "부스 저장"}
          </button>

          <button
            type="button"
            onClick={saveBoothAndExit}
            style={secondaryBtn}
            disabled={isBusy}
          >
            {savingAndExit ? "저장 후 이동 중..." : "부스만 저장 후 나가기"}
          </button>

          <button
            type="button"
            onClick={exitWithoutSave}
            style={ghostBtn}
            disabled={isBusy}
          >
            저장 없이 나가기
          </button>
        </div>
      </section>

      <section style={{ ...section, marginTop: 22 }}>
        <div style={sectionHeaderRow}>
          <div style={sectionTitle}>제품 관리</div>
          <button
            type="button"
            onClick={addProduct}
            style={ghostBtn}
            disabled={isBusy}
          >
            + 제품 추가
          </button>
        </div>

        <div style={productList}>
          {products.map((p, idx) => (
            <div key={p.product_id} style={productCard}>
              <div style={productHeader}>
                <div style={productTitle}>제품 #{idx + 1}</div>
                <label style={checkboxWrap}>
                  <input
                    type="checkbox"
                    checked={p.is_active !== false}
                    onChange={(e) => updateProduct(idx, { is_active: e.target.checked })}
                    disabled={isBusy}
                  />
                  사용
                </label>
              </div>

              <div style={grid2}>
                <Field label="제품명">
                  <input
                    value={p.name ?? ""}
                    onChange={(e) => updateProduct(idx, { name: e.target.value })}
                    style={input}
                    placeholder="예: 켈팍 25L"
                    disabled={isBusy}
                  />
                </Field>

                <Field label="가격 문구">
                  <input
                    value={p.price_text ?? ""}
                    onChange={(e) => updateProduct(idx, { price_text: e.target.value })}
                    style={input}
                    placeholder="예: 행사 특가 / 정가 문의 / 25만원"
                    disabled={isBusy}
                  />
                </Field>

                <Field label="정렬 순서">
                  <input
                    type="number"
                    value={p.sort_order ?? idx + 1}
                    onChange={(e) =>
                      updateProduct(idx, {
                        sort_order: Number(e.target.value || idx + 1),
                      })
                    }
                    style={input}
                    disabled={isBusy}
                  />
                </Field>

                <Field label="제품 이미지 URL">
                  <input
                    value={p.image_url ?? ""}
                    onChange={(e) => updateProduct(idx, { image_url: e.target.value })}
                    style={input}
                    placeholder="예: https://..."
                    disabled={isBusy}
                  />
                </Field>

                <Field label="유튜브 링크">
                  <input
                    value={p.youtube_url ?? ""}
                    onChange={(e) => updateProduct(idx, { youtube_url: e.target.value })}
                    style={input}
                    placeholder="예: https://youtube.com/watch?v=..."
                    disabled={isBusy}
                  />
                </Field>

                <Field label="카탈로그 URL">
                  <input
                    value={p.catalog_url ?? ""}
                    onChange={(e) => updateProduct(idx, { catalog_url: e.target.value })}
                    style={input}
                    placeholder="예: https://.../catalog.pdf"
                    disabled={isBusy}
                  />
                </Field>

                <Field label="카탈로그 파일명">
                  <input
                    value={p.catalog_filename ?? ""}
                    onChange={(e) =>
                      updateProduct(idx, { catalog_filename: e.target.value })
                    }
                    style={input}
                    placeholder="예: 도프_제품소개서.pdf"
                    disabled={isBusy}
                  />
                </Field>
              </div>

              <Field label="제품 설명">
                <textarea
                  value={p.description ?? ""}
                  onChange={(e) => updateProduct(idx, { description: e.target.value })}
                  style={textarea}
                  placeholder="제품 설명, 특징, 사용 포인트를 넣으십시오."
                  disabled={isBusy}
                />
              </Field>

              <div style={actions}>
                <button
                  type="button"
                  onClick={() => saveProduct(p, idx)}
                  style={primaryBtn}
                  disabled={isBusy}
                >
                  {savingProduct === p.product_id ? "저장 중..." : "제품 저장"}
                </button>

                <button
                  type="button"
                  onClick={() => deleteProduct(p.product_id)}
                  style={dangerBtn}
                  disabled={isBusy}
                >
                  {deletingProduct === p.product_id ? "삭제 중..." : "제품 삭제"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={bottomExitBox}>
          <div style={bottomExitTitle}>모든 편집을 끝냈다면</div>
          <div style={bottomExitDesc}>
            부스 정보와 제품 정보를 모두 반영한 뒤 관리 화면으로 돌아갑니다.
          </div>

          <div style={actions}>
            <button
              type="button"
              onClick={saveAllAndExit}
              style={primaryBtn}
              disabled={isBusy}
            >
              {savingAllAndExit ? "전체 저장 후 이동 중..." : "전체 저장 후 나가기"}
            </button>

            <button
              type="button"
              onClick={exitWithoutSave}
              style={ghostBtn}
              disabled={isBusy}
            >
              저장 없이 나가기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={fieldWrap}>
      <div style={labelStyle}>{label}</div>
      {children}
    </label>
  );
}

const pageWrap: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "28px 16px 60px",
  background: "#fff",
  minHeight: "100vh",
  color: "#111",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const topActionRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const eyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#16a34a",
  letterSpacing: 0.6,
};

const title: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 950,
  margin: "6px 0 0",
};

const meta: React.CSSProperties = {
  marginTop: 8,
  color: "#666",
  fontSize: 13,
};

const messageBox: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  fontWeight: 700,
};

const successMessageBox: React.CSSProperties = {
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#166534",
};

const errorMessageBox: React.CSSProperties = {
  background: "#fff1f2",
  border: "1px solid #fecdd3",
  color: "#b91c1c",
};

const section: React.CSSProperties = {
  marginTop: 22,
  border: "1px solid #eee",
  borderRadius: 18,
  padding: 18,
  background: "#fafafa",
};

const sectionHeaderRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 950,
  marginBottom: 14,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const fieldWrap: React.CSSProperties = {
  display: "block",
  marginTop: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  marginBottom: 8,
  color: "#111",
};

const input: React.CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: "0 14px",
  background: "#fff",
  color: "#111",
  fontSize: 15,
  boxSizing: "border-box",
};

const textareaShort: React.CSSProperties = {
  width: "100%",
  minHeight: 84,
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: 14,
  background: "#fff",
  color: "#111",
  fontSize: 15,
  resize: "vertical",
  boxSizing: "border-box",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 140,
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: 14,
  background: "#fff",
  color: "#111",
  fontSize: 15,
  resize: "vertical",
  boxSizing: "border-box",
};

const helpText: React.CSSProperties = {
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.7,
};

const actions: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const primaryBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
  textDecoration: "none",
};

const secondaryBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryLinkBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
  textDecoration: "none",
};

const ghostBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 950,
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#b91c1c",
  fontWeight: 950,
  cursor: "pointer",
};

const productList: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const productCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  background: "#fff",
};

const productHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
};

const productTitle: React.CSSProperties = {
  fontWeight: 900,
};

const checkboxWrap: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontSize: 13,
  fontWeight: 800,
};

const bottomExitBox: React.CSSProperties = {
  marginTop: 18,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  background: "#fff",
};

const bottomExitTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  color: "#111",
};

const bottomExitDesc: React.CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  lineHeight: 1.7,
  color: "#475569",
};