import Link from "next/link";

export default function ExpoFooter() {
  return (
    <footer style={S.wrap}>
      <div>© 2026 K-Agri Expo</div>

      <Link href="/admin-login" style={S.admin}>
        운영자 로그인
      </Link>
    </footer>
  );
}

const S: any = {
  wrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "30px 20px",
    display: "flex",
    justifyContent: "space-between",
  },
  admin: {
    fontSize: 13,
    color: "#64748b",
  },
};