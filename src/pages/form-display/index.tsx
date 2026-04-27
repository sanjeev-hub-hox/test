'use client'
import React, { useState } from 'react'
import CreateForm from '../../components/FormBuilder/CreateForm'

export function CreateField() {
  const [auto] = useState(true)
  const [url] = useState(null)

  const requestSet = {
    key: 'Dummy'
  }

  return (
    <div>
      <CreateForm auto={auto} url={url} slug='registrationProcessStudentParentDetails' appendRequest={requestSet} />
    </div>
  )
}
export default CreateField
