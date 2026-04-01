import { createClient } from '@supabase/supabase-js'
import VendorActions from '@/components/admin/VendorActions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminVendorsPage() {

  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: 40 }}>
      <h1>업체 관리</h1>

      <table border={1} cellPadding={10} style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>회사명</th>
            <th>이메일</th>
            <th>상태</th>
            <th>검증</th>
            <th>액션</th>
          </tr>
        </thead>

        <tbody>
          {vendors?.map((v) => (
            <tr key={v.id}>
              <td>{v.company_name}</td>
              <td>{v.email}</td>
              <td>{v.status}</td>
              <td>{v.verify_status}</td>

              <td>
                <VendorActions vendorUserId={v.user_id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}