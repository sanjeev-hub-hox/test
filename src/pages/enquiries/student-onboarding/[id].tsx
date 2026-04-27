import React from 'react'
import StudentSpecificInformation from 'src/OwnComponents/Enquiry-Listing/StudentSpecificInformation'
import { useRouter } from 'next/router'

function Index() {
  const router: any = useRouter()
  const { id } = router.query

  return <StudentSpecificInformation selectedRowId={id} />
}

export default Index
