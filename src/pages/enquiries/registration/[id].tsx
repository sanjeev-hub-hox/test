'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/router'

import Enquiries from 'src/OwnComponents/Enquiry-Listing/Enquiries'
import { useGlobalContext } from 'src/@core/global/GlobalContext'

function Index() {
  const router: any = useRouter()
  const { setPagePaths } = useGlobalContext()
  const { id, platform, authToken } = router.query

  useEffect(() => {
    setPagePaths([
      {
        title: 'Enquiry Listing',
        path: '/enquiries'
      },
      {
        title: 'Register Student',
        path: '/enquiries/registration'
      }
    ])
  }, [])

  // if (!isReady) {
  //   // Render a loading state or null while waiting for authToken
  //   return <div>Loading...</div>
  // }

  return (
    <>
      <Enquiries
        edit={false}
        setEdit={function (): void {
          throw new Error('Function not implemented.')
        }}
        selectedRowId={id}
        view={false}
        setView={function (): void {
          throw new Error('Function not implemented.')
        }}
        registration={true}
        app={platform}
        authToken={authToken}
      />
    </>
  )
}

export default Index
