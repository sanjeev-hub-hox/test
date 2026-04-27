import React from 'react'
import Enquiries from '../../../OwnComponents/Enquiry-Listing/Enquiries'

function index() {
  return (
    <Enquiries
      edit={false}
      setEdit={function (): void {
        throw new Error('Function not implemented.')
      }}
      selectedRowId={null}
      view={true}
      setView={function (): void {
        throw new Error('Function not implemented.')
      }}
    />
  )
}

export default index
