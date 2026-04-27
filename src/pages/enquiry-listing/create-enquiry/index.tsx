import React from 'react'
import CreateEnquiry from 'src/OwnComponents/Enquiry-Listing/CreateEnquiry'

function index() {
  return (
    <>
      <CreateEnquiry
        handleRoleDialog={function (): void {
          throw new Error('Function not implemented.')
        }}
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
    </>
  )
}

export default index
