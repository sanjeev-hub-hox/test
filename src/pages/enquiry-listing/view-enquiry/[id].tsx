import React from 'react'
import { useRouter } from 'next/router'

import Enquiries from 'src/OwnComponents/Enquiry-Listing/Enquiries'

function Index() {
  const router: any = useRouter()
  const { id } = router.query

  return (
    <Enquiries
      edit={false}
      setEdit={function (): void {
        throw new Error('Function not implemented.')
      }}
      selectedRowId={id}
      view={true}
      setView={function (): void {
        throw new Error('Function not implemented.')
      }}
    />
  )
}

export default Index
