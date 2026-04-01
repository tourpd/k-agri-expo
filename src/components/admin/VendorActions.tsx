'use client'

import { useState } from 'react'

export default function VendorActions({ vendorUserId }: { vendorUserId: string }) {

  const [loading, setLoading] = useState(false)

  const run = async (action: string) => {
    const confirmText = {
      approve: '승인하시겠습니까?',
      reject: '반려하시겠습니까?',
      deactivate: '비활성화 하시겠습니까?',
      hard_delete: '⚠️ 완전 삭제합니다. 복구 불가. 진행하시겠습니까?'
    }[action]

    if (!confirm(confirmText)) return

    setLoading(true)

    await fetch('/api/admin/vendors/manage', {
      method: 'POST',
      body: JSON.stringify({
        action,
        vendorUserId
      })
    })

    alert('완료')
    location.reload()
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>

      <button onClick={() => run('approve')} disabled={loading}>
        승인
      </button>

      <button onClick={() => run('reject')} disabled={loading}>
        반려
      </button>

      <button onClick={() => run('deactivate')} disabled={loading}>
        비활성화
      </button>

      <button
        onClick={() => run('hard_delete')}
        style={{ color: 'red' }}
        disabled={loading}
      >
        완전삭제
      </button>

    </div>
  )
}