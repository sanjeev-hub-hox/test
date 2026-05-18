'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import ReferralCard from './ReferralCard'
import { getRequest, postRequest } from 'src/services/apiService'

const ReferralVerificationPage = () => {
  const { setPagePaths } = useGlobalContext()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Extract URL parameters
  const id = searchParams.get('id')
  const type = searchParams.get('type')
  const action = searchParams.get('action')
  const errorParam = searchParams.get('error')

  // State management
  const [studentName, setStudentName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [enrollmentId, setEnrollmentId] = useState('')
  const [enquiryId, setEnquiryId] = useState('')
  const [schoolLocation, setSchoolLocation] = useState('')
  const [grade, setGrade] = useState('')
  const [stream, setStream] = useState('')

  // ✅ unified fields
  const [referredParentName, setReferredParentName] = useState('')
  const [referringSourceName, setReferringSourceName] = useState('')

  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [wrongSubmitted, setWrongSubmitted] = useState(false)
  const [linkExpired, setLinkExpired] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setPagePaths([{ title: 'Referral Verification', path: '/referral-view' }])

    // Check for error parameter from middleware
    if (errorParam) {
      setLinkExpired(true)
      setLoading(false)

      const errorMap: any = {
        expired: 'This verification link has expired. Please contact your SPOC.',
        invalid: 'Invalid verification link.',
        server: 'Server error. Try again later.'
      }

      setErrorMessage(errorMap[errorParam] || 'Invalid link')
      return
    }

    if (id) fetchReferralDetails()
  }, [id, errorParam])

  const fetchReferralDetails = async () => {
    try {
      const params = {
        url: `marketing/enquiry/referrals`,
        params: { id, type, action }
      }

      const response = await getRequest(params)

      if (response.status !== 200 || !response.data?.length) {
        throw new Error('expired')
      }

      const enquiry = response.data[0]

      // ✅ status checks
      if (
        (action === 'referrer' && enquiry.other_details?.referrer?.verified) ||
        (action === 'referral' && enquiry.other_details?.referral?.verified)
      ) {
        setAlreadySubmitted(true)
        setSuccessMessage('Phone Number Verified Successfully!')
      }

      if (
        (action === 'referrer' && enquiry.other_details?.referrer?.failedAttempts >= 3) ||
        (action === 'referral' && enquiry.other_details?.referral?.failedAttempts >= 3)
      ) {
        setWrongSubmitted(true)
        setErrorMessage('Too many incorrect attempts. Contact SPOC.')
      }

      // Extract and set data
      const {
        student_details = {},
        academic_year,
        school_location,
        board,
        enquiry_number
      } = enquiry

      const { first_name, last_name, grade } = student_details

      setStudentName(`${first_name || ''} ${last_name || ''}`.trim())
      setAcademicYear(academic_year?.value ?? '')
      setSchoolLocation(school_location?.value ?? '')
      setGrade(grade?.value ?? '')
      setStream(board?.value ?? '')
      setEnquiryId(enquiry_number ?? '')
      setEnrollmentId(student_details.enrollment_number ?? '')

      // ✅ NEW CLEAN DATA
      setReferredParentName(enquiry.referred_parent_name ?? '')
      setReferringSourceName(enquiry.referring_source_name ?? '')

    } catch (err) {
      setLinkExpired(true)
      setErrorMessage('This link has expired.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (phoneNumber.length !== 10) {
      setErrorMessage('Enter valid 10-digit phone number')
      return
    }

    setIsSubmitting(true)

    try {
      const params = {
        url: `marketing/enquiry/referrals/${id}`,
        data: { phoneNumber, type, action }
      }

      const response = await postRequest(params)

      if (response.status === 200) {
        setSubmitted(true)
        setSuccessMessage('Verification successful!')
      } else {
        throw new Error(response?.error?.errorMessage)
      }
    } catch (err: any) {
      if (err.message?.includes('expired')) {
        setLinkExpired(true)
      } else {
        setErrorMessage(err.message || 'Something went wrong')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => router.push('/')

  // ✅ unified logic (clean AF)
  const displayName =
    action === 'referral'
      ? referringSourceName
      : referredParentName

  const nameLabel =
    action === 'referral'
      ? "Referrer's Name:"
      : "Parent's Name:"

  const phoneHelper =
    action === 'referral'
      ? "referrer's"
      : "parent's"

  if (loading) return <p style={{ textAlign: 'center' }}>Loading...</p>

  if (linkExpired) {
    return <div style={{ textAlign: 'center' }}>{errorMessage}</div>
  }

  return (
    <ReferralCard
      studentName={studentName}
      academicYear={academicYear}
      enrollmentId={enrollmentId}
      enquiryId={enquiryId}
      schoolLocation={schoolLocation}
      grade={grade}
      stream={stream}
      referrerName={displayName}
      inputLabel={nameLabel}
      phoneNumberHelperText={phoneHelper}
      phoneNumber={phoneNumber}
      onPhoneChange={(val: string) => {
        const cleaned = val.replace(/\D/g, '')
        if (cleaned.length <= 10) setPhoneNumber(cleaned)
      }}
      errorMessage={errorMessage}
      successMessage={successMessage}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitDisabled={alreadySubmitted || wrongSubmitted || submitted || isSubmitting}
      actionType={action || ''}
      isSubmitting={isSubmitting}
    />
  )
}

export default ReferralVerificationPage