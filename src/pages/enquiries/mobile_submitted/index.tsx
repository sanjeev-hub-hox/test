'use client'

import SuccessDialog from 'src/@core/CustomComponent/SuccessDialogBox/SuccessDialog'

function Index() {
  const handleCompetencySuccessClose = () => {
    window?.location?.reload()
  }

  return (
    <SuccessDialog
      openDialog={true}
      title='Details Submitted Successfully'
      handleClose={handleCompetencySuccessClose}
    />
  )
}

export default Index
