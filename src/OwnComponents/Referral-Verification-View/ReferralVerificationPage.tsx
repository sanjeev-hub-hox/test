"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGlobalContext } from "src/@core/global/GlobalContext";
import ReferralCard from "./ReferralCard";
import { getRequest, postRequest } from 'src/services/apiService';

const ReferralVerificationPage = () => {
  const { setPagePaths } = useGlobalContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract URL parameters
  const id = searchParams.get("id");
  const type = searchParams.get("type");
  const action = searchParams.get("action");
  
  // State management
  const [studentName, setStudentName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [enquiryId, setEnquiryId] = useState('');
  const [schoolLocation, setSchoolLocation] = useState('');
  const [grade, setGrade] = useState('');
  const [stream, setBoard] = useState('');
  const [referred_parent_name, setReferredParentName] = useState('');
  const [referring_parent_name, setReferrerParentName] = useState('');
  const [referring_employee_name, setReferrerEmployeeName] = useState('');
  const [referring_school_name, setReferrerSchoolName] = useState('');
  const [referring_corporate_name, setReferrerCorporateName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [wrongSubmitted, setWrongSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [parentName, setParentName] = useState('');

  useEffect(() => {
    setPagePaths([
      { title: "Referral Verification", path: "/referral-view" },
    ]);

    if(id) fetchReferralDetails();
  }, [id]);

  const fetchReferralDetails = async () => {
      try {
        const params = { url: `marketing/enquiry/referrals/${id}` };
        const response = await getRequest(params);

        if (response.status !== 200) throw new Error('Failed to fetch referral');
        const { data } = response;
        if (!data?.length) throw new Error('No referral found');

        const enquiry = data[0];
        const getReferredParentName = (enquiry: any): string => {
          if (!enquiry){ return 'Unknown'}
 
          const parentType = enquiry?.other_details?.parent_type;
          const parentDetails = enquiry?.parent_details;
 
          if (!parentType || !parentDetails){ return 'Unknown'}
 
          switch (parentType.toLowerCase()) {
            case 'father':
              return parentDetails.father_details
                ? `${parentDetails.father_details.first_name} ${parentDetails.father_details.last_name}`
                : 'Unknown';
 
            case 'mother':
              return parentDetails.mother_details
                ? `${parentDetails.mother_details.first_name} ${parentDetails.mother_details.last_name}`
                : 'Unknown';
 
            case 'guardian':
              return parentDetails.guardian_details
                ? `${parentDetails.guardian_details.first_name ?? ''} ${parentDetails.guardian_details.last_name ?? ''}`.trim()
                : 'Unknown';
 
            default:
              return 'Unknown';
          }
        };
        const result = getReferredParentName(enquiry)
        setReferredParentName(result);
 
        // Check if already verified
        if (
          (action === 'referrer' && enquiry.other_details?.referrer?.verified == true) ||
          (action === 'referral' && enquiry.other_details?.referral?.verified == true)
        ) {
          setAlreadySubmitted(true);
          setSuccessMessage('Phone Number Verified Successfully! In case of any query, raise a concern with your assigned SPOC.');
        }
        // Check if max attempts reached
        else if (
          (action === 'referrer' && enquiry.other_details?.referrer?.failedAttempts == 3) ||
          (action === 'referral' && enquiry.other_details?.referral?.failedAttempts == 3)
        ) {
          setWrongSubmitted(true);
          setErrorMessage('Incorrect Phone Number Submitted! Please reach out to your assigned SPOC for assistance.');
        }

        // Extract and set data
        const {
          _id,
          student_details = {},
          academic_year,
          school_location,
          board,
          referring_employee_name,
          referring_parent_name,
          referring_corporate_name,
          referring_school_name,
          enquiry_number,
        } = enquiry;

        const { first_name, last_name, grade } = student_details;

        setEnquiryId(enquiry_number ?? '');
        setEnrollmentId(enquiry.student_details.enrollment_number || '');
        setStudentName(first_name + ' ' + last_name);
        setAcademicYear(academic_year.value ?? '');
        setSchoolLocation(school_location.value ?? '');
        setGrade(grade?.value ?? '');
        setBoard(board?.value ?? '');
        setReferrerParentName(referring_parent_name ?? '');
        setReferrerEmployeeName(referring_employee_name ?? '');
        setReferrerCorporateName(referring_corporate_name ?? '');
        setReferrerSchoolName(referring_school_name ?? '');
      } catch (error) {
        console.error('error_msg___', error);
        setErrorMessage('Error fetching referral details.');
      } finally {
        setLoading(false);
      }
    };

  const handleSubmit = async () => {
    if (!phoneNumber.trim() || phoneNumber.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number');

      return;
    }

    try {
      const params = {
        url: `marketing/enquiry/referrals/${id}`,
        data: {
          phoneNumber: phoneNumber,
          type: type ?? 'NA',
          action: action ?? 'NA',
        },
      };

      const response = await postRequest(params);

      if (response.status === 200) {
        setSubmitted(true);
        setSuccessMessage('Thank You! Thanks for taking out time to confirm the referral details. Your response has been recorded successfully.');
        setErrorMessage('');
      } else {
        const message = JSON.stringify(response.error.errorMessage).slice(1, -1) || 'Error! Contact Your SPOC';
        if (message.includes('locked')) {
          location.reload();
        }
        setErrorMessage(message);
      }
    } catch (error) {
      console.error(error);
      const errMsg = 'Unexpected Error Occurred! Contact Your SPOC';
      setErrorMessage(errMsg);
    }
  };

  const handleCancel = () => router.push('/'); 

  // Get referrer name based on action and type
  const getReferrerName = () => {
    if (action === 'referral') {
      return referring_employee_name ||
        referring_parent_name ||
        referring_school_name ||
        referring_corporate_name ||
        'Unknown';
    } else if (action === 'referrer') {
      return referred_parent_name;
    }

    return 'Unknown';
  };

  // Get input label based on type
  const getInputLabel = () => {
    if (type === 'employee') return "Parent Name:";
    if (type === 'referrer') return "Referred Parent Name:";
    if (type === 'parent') return "Referrer's Name:";
    if (type === 'referringparent') return "Referred Parent Name:";
    if (type === 'referringcorporate') return "Referred Parent Name:";
    if (type === 'referringschool') return "Referred Parent Name:";

    return '';
  };

  // Get phone number helper text
  const getPhoneNumberHelperText = () => {
    if (type === 'employee') return "parent's";
    if (type === 'parent') return "referrer's";
    if (type === 'referrer') return "referred parent's";
    if (type === 'referringparent') return "referred parent's";
    if (type === 'referringschool') return "referred parent's";
    if (type === 'referringcorporate') return "referred parent's";

    return '';
  };

  if (loading){ return <p style={{ textAlign: "center", marginTop: 50 }}>Loading...</p>}

  // Determine if submit button should be disabled
  const isSubmitDisabled = alreadySubmitted || wrongSubmitted || submitted;

  return (
    <ReferralCard
      studentName={studentName}
      academicYear={academicYear}
      enrollmentId={enrollmentId || ''}
      enquiryId={enquiryId}
      schoolLocation={schoolLocation}
      grade={grade}
      stream={stream}
      referrerName={getReferrerName()}
      inputLabel={getInputLabel() || 'Name'}
      phoneNumberHelperText={getPhoneNumberHelperText()}
      phoneNumber={phoneNumber}
      onPhoneChange={(value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 10) setPhoneNumber(cleaned);
      }}
      errorMessage={errorMessage}
      successMessage={successMessage}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitDisabled={isSubmitDisabled}
      actionType={action || ''}
    />
  );
};

export default ReferralVerificationPage;