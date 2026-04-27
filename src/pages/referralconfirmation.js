'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getRequest, postRequest } from 'src/services/apiService'

export default function ReferralConfirmation() {
  const router = useRouter()
  const { id, type, action } = router.query
  const [studentName, setStudentName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [enquiryId, setEnquiryId] = useState('')
  const [schoolLocation, setSchoolLocation] = useState('')
  const [grade, setGrade] = useState('')
  const [stream, setStream] = useState('')
  const [referredParentName, setReferredParentName] = useState('')   // parent who got admitted
  const [referringSourceName, setReferringSourceName] = useState('') // who referred
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [wrongSubmitted, setWrongSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('') // 🆕 new state for showing attempt errors

  useEffect(() => {
    if (!router.isReady) return

    if (!id) {
      router.replace('/404')

      return
    }

    const fetchReferralDetails = async () => {
      try {
        const params = { url: `marketing/enquiry/referrals/${id}` }
        const response = await getRequest(params)

        if (response.status !== 200) throw new Error('Failed to fetch referral')
        const { data } = response
        if (!data?.length) throw new Error('No referral found')

        const enquiry = data[0]
        if (
          (action === 'referrer' && enquiry.other_details?.referrer?.verified == true) ||
          (action === 'referral' && enquiry.other_details?.referral?.verified == true)
        ) {
          setAlreadySubmitted(true)

          return
        }

        if (
          (action === 'referrer' && enquiry.other_details?.referrer?.failedAttempts >= 3) ||
          (action === 'referral' && enquiry.other_details?.referral?.failedAttempts >= 3)
        ) {
          setWrongSubmitted(true)

          return
        }

        // ✅ Set all display data from unified structure
        const { student_details = {}, academic_year, school_location, board, enquiry_number } = enquiry
        const { first_name, last_name, grade } = student_details

        setEnquiryId(enquiry_number ?? '')
        setStudentName(`${first_name || ''} ${last_name || ''}`.trim())
        setAcademicYear(academic_year?.value ?? '')
        setSchoolLocation(school_location?.value ?? '')
        setGrade(grade?.value ?? '')
        setStream(board?.value ?? '')

        // ✅ Unified - just two names needed
        setReferredParentName(enquiry.referred_parent_name ?? '')
        setReferringSourceName(enquiry.referring_source_name ?? '')

      } catch (error) {
        console.error('Error fetching referral details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReferralDetails()
  }, [id, router.isReady])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const params = {
        url: `marketing/enquiry/referrals/${id}`,
        data: {
          phoneNumber,
          type: type ?? 'NA',
          action: action ?? 'NA'
        }
      }

      const response = await postRequest(params)

      if (response.status === 200) {
        setSubmitted(true)
        setErrorMessage('')
      } else {
        const message = JSON.stringify(response.error.errorMessage).slice(1, -1) || 'Error! Contact Your SPOC'
        if (message.includes('locked')) {
          location.reload()
        }
        setErrorMessage(message)
      }
    } catch (error) {
      setErrorMessage('Unexpected Error Occurred! Contact Your SPOC')
    }
  }

  const handleCancel = () => router.push('/')

  if (loading) return <p style={{ textAlign: 'center' }}>Loading...</p>

  // 🟢 Show already submitted message
  if (alreadySubmitted) {
    return (
      <div style={styles.alreadySubmittedBox}>
        <h2>Referral Details Already Submitted Successfully!</h2>
        <p>In case of any query, raise a concern with your assigned SPOC.</p>
      </div>
    )
  }

  if (wrongSubmitted) {
    return (
      <div style={styles.wrongSubmittedBox}>
        <h2>Incorrect Referral Details Submitted!</h2>
        <p>Please reach out to your assigned SPOC for assistance.</p>
      </div>
    )
  }

  // ✅ Simplified label logic using unified structure
  // action = 'referral' → parent is verifying → show referrer's name, ask for referrer's phone
  // action = 'referrer' → referrer is verifying → show parent's name, ask for parent's phone
  const displayName = action === 'referral' ? referringSourceName : referredParentName
  const nameLabel = action === 'referral' ? "Referrer's Name:" : "Parent's Name:"
  const phoneLabel = action === 'referral'
    ? "Please confirm by entering the referrer's phone number."
    : "Please confirm by entering the parent's phone number."

  return (
    <div style={styles.container}>
      {!submitted ? (
        <>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 0, padding: 0, backgroundColor: '#e0e2f4ff' }}>
            <h2 style={{ margin: 0 }}>Verification Message</h2>
            <h3 style={{ marginTop: 0, color: '#9a9595ff' }}>Confirm The Details You've Provided.</h3>
          </div>

          {/* Student Info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ maxWidth: '95%', marginInline: '4%', display: 'flex', alignItems: 'baseline', gap: '0px', backgroundColor: '#f0f4f8', borderRadius: '6px', padding: '0px 5%' }}>
              <input
                type='text'
                disabled
                value={studentName}
                style={{ fontSize: '20px', border: 0, color: '#000', padding: '4px 0', borderRadius: '5px', backgroundColor: '#f0f4f8', width: 'auto' }}
              />
              <div style={{ fontSize: '16px', color: 'black' }}>
                <sup>(AY {academicYear})</sup>
              </div>
            </div>

            <textarea
              disabled
              value={`${enquiryId} | ${schoolLocation} | ${grade} | ${stream}`}
              style={{
                color: 'black',
                width: '70%',
                border: 0,
                padding: '0px',
                borderRadius: '5px',
                backgroundColor: '#f0f4f8',
                resize: 'none',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                textAlign: 'center'
              }}
            />
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Referrer Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
                padding: '10px 15px',
                backgroundColor: '#f0f4f8',
                borderRadius: '6px'
              }}
            >
              <label
                htmlFor='referrerName'
                style={{
                  ...styles.label,
                  marginBottom: 0,
                  minWidth: '120px',
                  fontWeight: 500
                }}
              >
                {type === 'employee'
                  ? 'Parent Name:'
                  : type === 'parent'
                  ? "Referrer's Name:"
                  : type === 'referringparent'
                  ? 'Referred Parent Name:'
                  : type === 'referringcorporate'
                  ? 'Referred Parent Name:'
                  : type === 'referringschool'
                  ? 'Referred Parent Name:'
                  : ' '}
              </label>
              <input
                type='text'
                disabled
                value={displayName || 'Unknown'}
                style={{ fontSize: 'initial', color: 'black', maxWidth: '50%', border: 0, padding: '8px', borderRadius: '5px', flex: 1, backgroundColor: '#f0f4f8' }}
              />
            </div>

            {/* ✅ Simplified phone label */}
            <label style={{ ...styles.label, color: '#8a8787ff' }}>
              {phoneLabel}
            </label>

            <input
              type='tel'
              placeholder='Enter Phone Number'
              value={phoneNumber}
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '')
                if (value.length <= 10) setPhoneNumber(value)
              }}
              style={styles.input}
              minLength={10}
              maxLength={10}
              required
            />

            {errorMessage && (
              <div style={{ backgroundColor: '#ffe6e6', color: '#b00000', borderRadius: '6px', padding: '10px', marginTop: '-10px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                {errorMessage}
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '20px 0', width: '100%' }} />

            <div style={styles.buttonGroup}>
              <button type='button' onClick={handleCancel} style={styles.cancelButton}>Cancel</button>
              <button type='submit' style={styles.submitButton}>Submit</button>
            </div>
          </form>
        </>
      ) : (
        // ✅ Success message
        <div style={styles.successBox}>
          <h2>Thank You!</h2>
          <p>Thanks for taking out time to confirm the referral details.</p>
          <p>Your response has been recorded successfully.</p>
        </div>
      )}
    </div>
  )
}

const styles = {
  successBox: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#f0f4f8',
    borderRadius: '12px',
    margin: '50px auto',
    color: '#333',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
  },
  container: {
    maxWidth: '500px',
    margin: '50px auto',
    padding: '0',
    border: '1px solid #1c1b1bff',
    fontFamily: 'Arial, sans-serif'
  },
  form: { display: 'flex', flexDirection: 'column', padding: '20px' },
  label: { marginBottom: '8px' },
  input: {
    padding: '10px',
    marginBottom: '20px',
    borderRadius: '5px',
    border: '1px solid #ccc'
  },
  buttonGroup: { display: 'flex', justifyContent: 'space-between' },
  cancelButton: {
    backgroundColor: 'white',
    color: 'black',
    border: '1px solid black',
    padding: '10px 20px',
    width: '48%',
    borderRadius: '25px',
    cursor: 'pointer'
  },
  submitButton: {
    backgroundColor: 'blue',
    color: 'white',
    border: '1px solid black',
    padding: '10px 20px',
    width: '48%',
    borderRadius: '25px',
    cursor: 'pointer'
  },
  alreadySubmittedBox: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#b0f89cff',
    borderRadius: '12px',
    margin: '50px auto',
    color: '#1e8003ff',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
  },
  wrongSubmittedBox: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#ffe6e6',
    borderRadius: '12px',
    margin: '50px auto',
    color: '#f55353ff',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
  }
}
