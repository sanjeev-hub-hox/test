import React, { useEffect } from 'react'

import Box from '@mui/material/Box'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import { getLocalStorageVal } from 'src/utils/helper'
import DasboardUI from 'src/OwnComponents/Dashboard/DasboardUI'

const Page: React.FC = () => {
  const { setPagePaths } = useGlobalContext()

  useEffect(() => {
    setPagePaths([
      {
        title: 'Dashboard',
        path: '/dashboard'
      }
    ])
  }, [])

  const userInfoJson = getLocalStorageVal('userInfo')
  const userInfoDetails = userInfoJson ? JSON.parse(userInfoJson) : {}

  return (
    <>
      {userInfoDetails ? <div>Welcome, {userInfoDetails?.userInfo?.name}</div> : null}

      {/* <button
        onClick={() => {
          handleSignout()
        }}
      >
        Logout
      </button> */}
      <DasboardUI />
      <Box sx={{ flexGrow: 1 }}></Box>
    </>
  )
}

export default Page
