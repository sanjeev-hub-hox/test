'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/router'

import Enquiries from 'src/OwnComponents/Enquiry-Listing/Enquiries'
import { useGlobalContext } from 'src/@core/global/GlobalContext'

function Index() {
  const router = useRouter()
  const { setPagePaths } = useGlobalContext()
  const { id, platform, authToken } = router.query

  useEffect(() => {
    // Setting up page paths for breadcrumb or navigation
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
  }, [setPagePaths])

  // if (!isReady) {
  // Render a loading state or fallback UI until authToken and id are available
  // return (
  //   <>
  //   {authToken}
  //   >>>>>>>if
  //   {id},
  //   {platform}
  //   </>
  // )
  // }

  return (
    <>
      {authToken && id && platform && (
        <>
          <Enquiries
            edit={false}
            setEdit={() => undefined}
            selectedRowId={id}
            view={false}
            setView={() => undefined}
            registration={true}
            app={platform}
            authToken={authToken}
          />
        </>
      )}
    </>
  )
}

export default Index
