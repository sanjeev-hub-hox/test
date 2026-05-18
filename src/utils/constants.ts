export const SSO_TOKEN = process.env.NEXT_PUBLIC_TOKEN
export const ENQUIRY_STATUS = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  ADMITTED: 'Admitted',
  PROVISIONAL: 'Provisional Admission',
  REJECTED: 'Rejected',
  OPEN: 'Open',
  PROGRESS: 'In Progress'
}

export const ENQUIRY_STAGES = {
  ENQUIRY: 'Enquiry',
  SCHOOL_VISIT: 'School visit',
  PARENT_INTERACTION: 'Parent interaction',
  REGISTRATION: 'Registration',
  REGISTRATION_FEES: 'Academic Kit Selling', //'Registration Fees',
  NEW_REGISTRATION_FEES: 'Academic Kit Selling',
  COMPETENCY_TEST: 'Competency test',
  ADMISSION_STATUS: 'Admission Status',
  PAYMENT: 'Payment',
  ADMITTED_PROVISIONAL: 'Admitted or Provisional Approval'
}

export const PERMISSIONS = {
  EDIT_FEE_DETAILS: 'enquiry_listing_edit_fee_details',
  ENQUIRY_REOPEN: 'enquiry_reopen',
  ENQUIRY_DOWNLOAD: 'enquiry_listing_download',
  REGISTRION_TRANSFER: 'registration_details_transfer',
  COMPETENCY_TEST: 'registration_details_competency_test',
  REGISTRATION_PAGE: 'enquiry_listing_registration',
  ENQUIRY_LIST: 'enquiry_listing',
  REGISTRATION_MERGE: 'registration_details_merge',
  ENQUIRY_VIEW: 'enquiry_listing_view',
  FOLLOWUP: 'enquiry_listing_follow_up',
  REGISTRATION_LIST: 'registration_listing',
  SCHOOL_VISIT: 'enquiry_listing_school_visit',
  REGISTRATION_SCHOOL_VISIT: 'registration_details_school_tour',
  ENQUIRY_ACTION: 'enquiry_listing_button_action',
  REGISTRATION_LIST_FOLOWUP: 'registration_listing_follow_up',
  REGISTRATION_FOLOWUP: 'registration_details_follow_up',
  REGISTRATION_VIEW: 'registration_listing_view',
  CREATE_ENQUIRY: 'enquiry_listing_create',
  TIMELINE_FILTER: 'timeline_filters',
  REGISTRATION_DETAIL: 'registration_details',
  REGISTRATION_LIST_SCHOOL_VISIT: 'registration_listing_school_visit',
  REGISTRATION_REASSIGN: 'registration_details_reassign',
  TIMELINE: 'timeline',
  SOURCE_WISE_CONVERSION_REPORT: 'source_wise_conversion_report',
  OUTSIDE_TAT_FOLLOWUP: 'outside_tat_followup',
  STUDENT_PROFILE_REPORT: 'student_profile_report',
  STUDENT_PROFILE_SUMMARY_REPORT: 'student_profile_summary_report',
  SOURCE_INQUIRY_STATUS_REPORT: 'source_inquiry_status_report',
  REQUEST_LISTING_PAGE: 'request_listing',
  EDIT_BUTTON: 'edit_button',
  PROCESS_BUTTON: 'process_button',
  CANCEL_BUTTON: 'cancel_button',
  RAISE_EXCEPTION_BUTTON: 'raise_exception_button',
  DOWNLOAD_BUTTON: 'download_button',
  NEW_REQUEST_BUTTON: 'new_request_button',
  GR_REPORT: 'gr_report',
  DELETE_ENQUIRY_APPLY_ACTION: 'delete_enqiry_apply_action'
}
export const FEETYPES = {
  admissionFees: 1,
  cafeteriaFees: 2,
  kidsClubFees: 8,
  postSchoolActivityFees: 11,
  registrationFees: 12,
  summerCampFees: 13,
  transportFees: 15
}

export const googlAlgo =
  '?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=folder-access-sa%40ampersand-group-418009.iam.gserviceaccount.com%2F20241213%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20241213T171703Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D"marketing%2F1734110214914.png"&X-Goog-Signature=69e85b9753aca0bd3ab607f82d1d2fc16df77fabd6ec420f433ce4869adc88a05b4675143cea1843ed8b9a61a45e516ec337ac17cac2ac2591ab505175d70e7d9e502bc6d37b006bc0bbfb5b56deaf54be4267f144d1aaf556d87b12e59508ab78ed2259a33408981dc28de30af1f2b6bcefe24a13b159d13680b91fb8ad41f92ca5f05332921906ca014ecb30695d9a3533e47a08655ed551a56f4d81730fc2f658456d401b434e8e75299492a7de25881903b4f4e15c79415b2b10e8fc769d04dcc8d648134da736ce94505284bd2597c311caa15113ed1fd953d6d8fb7b14e6dabefd4db99907ae88b863c8ad0a718f495db347de4b29f14a46580fde9ef5'

export const NOTIFICATION_LIST_TYPE = {
  all: 'all',
  read: 'read',
  unread: 'unread',
  today: 'today',
  this_week: 'this_week'
}

export const academicYearApiUrl =
  '/api/ac-academic-years?fields[1]=name&fields[2]=short_name&fields[3]=short_name_two_digit&fields[4]=is_visible&filters[is_visible][$eq]=1&sort[0]=id:asc'

export const FEETYPES_SLUGS = {
  CAFETERIA: 'cafeteria',
  KIDS_CLUB: 'kids_club',
  PSA: 'psa',
  SUMMER_CAMP: 'summer_camp',
  TRANSPORT: 'transport'
}

export const schoolApiUrl = '/api/ac-schools/search-school'
