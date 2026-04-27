'use client'

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import TermsAndConditionsPopup from 'src/components/FormBuilder/TermsConditions'

export default function TErmsAndConditions() {
  const router = useRouter()
  const { ids } = router?.query
  const [enquiryId, setEnquiryId] = useState<any>(null)
  const [schoolId, setSchoolId] = useState<any>(null)

  useEffect(() => {
    if (ids && ids?.length) {
      setEnquiryId(ids[0])
      setSchoolId(ids[1])
    }
  }, [ids])

  return (
    <div style={{ height: '100vh' }}>
      <TermsAndConditionsPopup open={true} enquiryId={enquiryId} schoolId={schoolId} />
    </div>
  )
}
