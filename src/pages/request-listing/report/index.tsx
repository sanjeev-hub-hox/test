import React from 'react'
import { Can } from 'src/components/Can'
import RequestReports from 'src/OwnComponents/RequestManagement/RequestReports'

const index = () => {
  return (
    <Can action='HIDE' pagePermission={['request_listing_report']}>
      <RequestReports />
    </Can>
  )
}

export default index
