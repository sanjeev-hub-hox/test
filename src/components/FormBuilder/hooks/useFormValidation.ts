import { useCallback } from 'react'
import { generateFormSchema, checkValidationsZod } from '../../../utils/formValidations'
import { Validation, BASE_VALIDATION_ARRAY, OPTIONAL_VALIDATION_ARRAY } from '../types/FormTypes'
import { ENQUIRY_STAGES } from 'src/utils/constants'
import { parentFields } from '../types/parentFields'
import dayjs from 'dayjs'

interface UseFormValidationProps {
  formData: any
  formfields: any
  dependentField: any
  slug: string
  enquiryTypeData: any
  activeStageName: string
  attachExternalFields: boolean
}

export const useFormValidation = ({
  formData,
  formfields,
  dependentField,
  slug,
  enquiryTypeData,
  activeStageName,
  attachExternalFields
}: UseFormValidationProps) => {
  const isKidsClub =
    (enquiryTypeData &&
      (enquiryTypeData?.slug === 'externalUserKidsClub' ||
        enquiryTypeData?.name?.toLowerCase()?.includes('kids club'))) ||
    slug?.toLowerCase()?.includes('kidsclub') ||
    formData?.enquiry_type === 'KidsClub'

  const isFieldVisible = useCallback(
    (data: any) => {
      if (isKidsClub) {
        if (
          data?.['input_name'] === 'enrollment no' ||
          data?.['input_field_name'] === 'enrollment_no' ||
          data?.['input_field_name'] === 'enrollment_number'
        ) {
          const studentType = formData['student_type.id'] || formData['student_type']
          return studentType === 'Vibgyor Student' || studentType === 'Vibgyor'
        }
        if (
          data?.['input_name'] === 'employee id' ||
          data?.['input_field_name'] === 'employee_id' ||
          data?.['input_name'] === 'employeeid'
        ) {
          return formData['is_staff_child'] === 'yes' || formData['is_the_student_staff_child'] === 'yes'
        }

        if (data?.['input_dependent_field'] === 'parent_type' || data?.['input_dependent_field'] === 'parenttype') {
          let selectedParentType = formData['parent_type'] || formData['parent_type.id'] || ''
          
          if (typeof selectedParentType === 'object' && selectedParentType?.value) {
            selectedParentType = selectedParentType.value
          }
          
          selectedParentType = String(selectedParentType).toLowerCase()
          
          if (!selectedParentType) return false

          const fieldName = (data?.['input_field_name'] || data?.['input_name'] || '').toLowerCase()

          if (fieldName.includes('father')) return selectedParentType === 'father'
          if (fieldName.includes('mother')) return selectedParentType === 'mother'
          if (fieldName.includes('guardian')) return selectedParentType === 'guardian'

          // Generic parent field — show whenever any type is selected
          return true
        }
      }

      if (data?.['input_dependent_field'] === null || data?.['input_dependent_field'] === 'null') {
        return true
      } else {
        const arr = dependentField?.[data?.['input_dependent_field']]
        if (!arr) return false
        const found = arr.find((obj: any) => obj.hasOwnProperty(data?.['input_name']))

        return found?.display
      }
    },
    [dependentField, slug, formData, isKidsClub]
  )

  const checkValidations = useCallback((validations: Validation[], value: any, fieldName?: string) => {
    return checkValidationsZod(validations, value, fieldName)
  }, [])

  const getRequiredErrorMessage = useCallback((fieldName: string, error: string) => {
    const fieldLabels: Record<string, string> = {
      enquiry_mode: 'Enquiry mode',
      enquiry_source_type: 'Enquiry source type',
      enquiry_source: 'Enquiry source',
      enquiry_sub_source: 'Enquiry sub source',
      enquiry_employee_source: 'Employee source',
      enquiry_parent_source: 'Parent source',
      enquiry_corporate_source: 'Corporate source',
      enquiry_school_source: 'School source',
      academic_year: 'Academic year',
      school_location: 'School location',
      board: 'Board',
      brand: 'Brand',
      'student_details.grade': 'Grade',
      shift: 'Shift',
      course: 'Course',
      stream: 'Stream',
      ivt_reason: 'IVT reason'
    }

    const defaultLabel = fieldName
      .split('.')
      .pop()
      ?.replace(/_/g, ' ')
      .replace(/\b\w/g, chr => chr.toUpperCase())

    const label = fieldLabels[fieldName] || defaultLabel || 'Field'
    if (/field is required/i.test(error) || /this field is required/i.test(error)) {
      return `${label} is required`
    }
    return error
  }, [])

  const validateAllFields = useCallback(async () => {
    const errors: any = {}

    if (formfields && formfields?.length) {
      const fields = formfields[0]?.inputs
      const formSchema = generateFormSchema(fields, isFieldVisible)
      const dataToValidate: any = {}

      fields.forEach((field: any) => {
        if (isFieldVisible(field)) {
          const rawValue = formData[field.input_field_name]
          const idValue = formData[field.input_field_name + '.id']

          const value =
            field.input_type === 'masterDropdown'
              ? idValue
                ? idValue
                : typeof rawValue === 'string' && rawValue.includes('api')
                ? null
                : rawValue
              : rawValue
          dataToValidate[field.input_field_name] = value
        }
      })

      const parsed = formSchema.safeParse(dataToValidate)
      if (!parsed.success) {
        parsed.error.issues.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message
          }
        })
      }
    }

    return errors
  }, [formfields, formData, isFieldVisible])

  const validateExternalFields = useCallback(() => {
    const errors: any = {}
    const external_fields = ['enquiry_mode', 'enquiry_source_type', 'enquiry_source', 'enquiry_sub_source']

    external_fields.forEach(val => {
      const error = checkValidations(BASE_VALIDATION_ARRAY, formData[`${val}.id`], val)
      if (error) errors[val] = getRequiredErrorMessage(val, error)
    })

    const selectedSubSource = String(formData['enquiry_sub_source.value'] || '')
    let requiredField = ''

    if (selectedSubSource.includes('Employee')) requiredField = 'enquiry_employee_source'
    else if (selectedSubSource.includes('Parent')) requiredField = 'enquiry_parent_source'
    else if (selectedSubSource.includes('Corporate')) requiredField = 'enquiry_corporate_source'
    else if (selectedSubSource.includes('Pre School')) requiredField = 'enquiry_school_source'


    if (requiredField) {
      // ✅ Also check other_details.referral_source as fallback
      // because some enquiries store employee source there instead of root level
      const fieldValue = formData[`${requiredField}.id`] ||
      formData[`${requiredField}.value`] ||
      (requiredField === 'enquiry_employee_source'
      ? (formData['referral_source']?.id || formData['referral_source']?.email)
      : null) || null

      const error = checkValidations(BASE_VALIDATION_ARRAY, fieldValue, requiredField)
      if (error) errors[requiredField] = error
    }

    if (
      Object.keys(errors).length > 0 &&
      (attachExternalFields || slug === 'enquiryStudentDetailRegistrationForm') &&
      !isKidsClub
    ) {
      return { errors, status: true }
    } else {
      return { status: false }
    }
  }, [formData, attachExternalFields, slug, checkValidations])

  const validateExternalEnquiryFields = useCallback(() => {
    const errors: any = {}
    const external_fields = [
      'academic_year',
      'school_location',
      'board',
      'brand',
      'student_details.grade',
      'shift',
      'course',
      'stream'
    ]

    switch (enquiryTypeData?.slug) {
      case 'ivtEnquiry':
      case 'readmission_10_11':
        external_fields.push('ivt_reason')
        break
      default:
        break
    }

    external_fields.forEach((val: any) => {
      const error = checkValidations(BASE_VALIDATION_ARRAY, formData[`${val}.id`], val)
      if (error) errors[val] = getRequiredErrorMessage(val, error)
    })

    const isEnquiryFlow =
      (enquiryTypeData && enquiryTypeData?.slug === 'newAdmissionEnquiry') ||
      slug === 'enquiryStudentDetailRegistrationForm' ||
      enquiryTypeData?.slug === 'externalUserNewAdmissionWebsite' ||
      enquiryTypeData?.slug === 'ivtEnquiry' ||
      enquiryTypeData?.slug === 'reAdmission' ||
      enquiryTypeData?.slug === 'readmission_10_11'

    if (Object.keys(errors).length > 0 && isEnquiryFlow) {
      return { errors, status: true }
    } else {
      return { status: false }
    }
  }, [formData, enquiryTypeData, slug, checkValidations])

  const validateExternalKIdsClubEnquiryFields = useCallback(() => {
    const errors: any = {}
    const external_fields = ['academic_year']
    
    // Some dynamic Kids Club forms use kidsclub_location instead of school_location
    if (formData['kidsclub_location.id'] && !formData['school_location.id']) {
      external_fields.push('kidsclub_location')
    } else {
      external_fields.push('school_location')
    }

    external_fields.forEach((val: any) => {
      const error = checkValidations(BASE_VALIDATION_ARRAY, formData[`${val}.id`], val)
      if (error) errors[val] = getRequiredErrorMessage(val, error)
    })

    const isKidsClubFlow = isKidsClub
    
    if (isKidsClubFlow) {
      const isStaffChild = formData['is_staff_child'] === 'yes' || formData['is_the_student_staff_child'] === 'yes'
      if (isStaffChild) {
        if (!formData['employee_id']) {
          errors['employee_id'] = 'Employee ID is required for staff child'
        } else if (!formData['employee_details']) {
          errors['employee_id'] = formData?.error?.['employee_id'] || 'Please enter a valid Employee ID'
        }
      }

      const currentStudentType = formData['student_type.id'] || formData['student_type']
      const validStudentTypes = ['Vibgyor Student', 'Non-Vibgyor Student', 'Vibgyor', 'Non-Vibgyor']

      if (!currentStudentType || !validStudentTypes.includes(currentStudentType)) {
         errors['student_type'] = 'Student Type is required'
      }

    if (activeStageName === ENQUIRY_STAGES.ENQUIRY || activeStageName === ENQUIRY_STAGES.REGISTRATION) {
      if (formData['is_batch_available'] === false) {
        errors['batch_selection'] = 'No batches found for the selected criteria'
      } else if (!formData['batch_selection'] || formData['batch_selection'].length === 0) {
        errors['batch_selection'] = 'Please select at least one batch'
      }
    }
  }

    if (Object.keys(errors).length > 0 && isKidsClubFlow) {
      return { errors, status: true }
    } else {
      return { status: false }
    }
  }, [formData, enquiryTypeData, slug, checkValidations, activeStageName])

  const validateResidentialFields = useCallback(() => {
    const errors: any = {}
    const validationArrayOptional = OPTIONAL_VALIDATION_ARRAY(activeStageName !== ENQUIRY_STAGES?.ENQUIRY)

    const current_address_fields = [
      'residential_details.current_address.house',
      'residential_details.current_address.street',
      'residential_details.current_address.landmark',
      'residential_details.current_address.pin_code'
    ]

    current_address_fields.forEach(field => {
      const error = checkValidations(validationArrayOptional, formData[field], field)
      if (error) errors[field] = error
    })

    if (
      formData['residential_details.is_permanent_address'] === 'no' ||
      formData['residential_details.is_permanent_address'] === false
    ) {
      const permanent_address_fields = [
        'residential_details.permanent_address.house',
        'residential_details.permanent_address.street',
        'residential_details.permanent_address.landmark',
        'residential_details.permanent_address.pin_code'
      ]

      permanent_address_fields.forEach(field => {
        const error = checkValidations(validationArrayOptional, formData[field], field)
        if (error) errors[field] = error
      })
    }

    if (
      Object.keys(errors).length > 0 &&
      (slug === 'createContactDetails' || activeStageName === ENQUIRY_STAGES?.ENQUIRY) &&
      !isKidsClub
    ) {
      return { errors, status: true }
    } else {
      return { status: false }
    }
  }, [formData, slug, activeStageName, checkValidations])

  const getFieldCondition = useCallback(
    (fieldName: string) => {
      const isIVT =
        enquiryTypeData?.slug === 'ivtEnquiry' ||
        enquiryTypeData?.slug === 'ivt' ||
        slug === 'ivtEnquiryForm' ||
        slug === 'ivt'

      switch (fieldName) {
        case 'father':
          return (
            formData['parent_details.is_parent_single'] === 'no' ||
            (formData['parent_details.is_parent_single'] === 'yes' &&
              formData['parent_details.single_parent_type'] === 'father') ||
            isIVT
          )
        case 'mother':
          return (
            formData['parent_details.is_parent_single'] === 'no' ||
            (formData['parent_details.is_parent_single'] === 'yes' &&
              formData['parent_details.single_parent_type'] === 'mother') ||
            isIVT
          )
        case 'guardian':
          return (
            (formData['parent_details.is_parent_single'] === 'yes' &&
              formData['parent_details.single_parent_type'] === 'guardian') ||
            isIVT
          )
        default:
          return false
      }
    },
    [formData, enquiryTypeData, slug]
  )

  const validateExternalParentFields = useCallback(() => {
    const errors: any = {}

    // Copy parentFields and update is_required based on conditions
    const updatedParentFields = JSON.parse(JSON.stringify(parentFields))
    for (const key in updatedParentFields) {
      if (Array.isArray(updatedParentFields[key])) {
        updatedParentFields[key].forEach((field: any) => {
          if (Array.isArray(field.validations)) {
            field.validations.forEach((validation: any) => {
              if (validation.type === 'is_required') {
                validation.validation = getFieldCondition(key)
              }
            })
          }
        })
      }
    }

    const external_fields = [
      ...updatedParentFields.father,
      ...updatedParentFields.mother,
      ...updatedParentFields.guardian
    ]

    external_fields.forEach((val: any) => {
      if (!val?.is_optional) {
        if (
          !val?.input_field_name.includes('country') &&
          !val?.input_field_name.includes('city') &&
          !val?.input_field_name.includes('state')
        ) {
          const value =
            val?.type === 'masterdropdown'
              ? formData[`${val?.input_field_name}.id`]
              : formData[`${val?.input_field_name}`]
          const fieldKey = val?.type === 'masterdropdown' ? val?.input_field_name + '.id' : val?.input_field_name
          const error = checkValidations(val.validations, value, val?.input_field_name)

          if (error) errors[fieldKey] = error
        }
      }
    })

    if (Object.keys(errors).length > 0 && slug === 'registrationProcessStudentParentDetails') {
      return { errors, status: true }
    } else {
      return { status: false }
    }
  }, [formData, slug, getFieldCondition, checkValidations])

  const validateGuestStudent = useCallback(() => {
    const errors: any = {}
    if (formData?.is_guest_student === true) {
      if (!formData['guest_student_details.location.id']) {
        errors['guest_student_details.location'] = 'Host School Location is required for guest students'
      }
      if (formData['guest_student_details.location.id'] === formData['school_location.id']) {
        errors['guest_student_details.location'] = 'Host School Location must be different from School Location'
      }
    }
    return Object.keys(errors).length > 0 ? { errors, status: true } : { status: false }
  }, [formData])

  const validateStudentEnrollment = useCallback(() => {
    const errors: any = {}
    if (
      enquiryTypeData?.slug === 'ivtEnquiry' ||
      enquiryTypeData?.slug === 'reAdmission' ||
      enquiryTypeData?.slug === 'readmission_10_11'
    ) {
      if (!formData['student_details.enrolment_number']?.trim()) {
        errors['student_details.enrolment_number'] = 'Enrollment Number is required'
      }
    }
    return Object.keys(errors).length > 0 ? { errors, status: true } : { status: false }
  }, [formData, enquiryTypeData])

  const validatePincodeFormat = useCallback(() => {
    const errors: any = {}
    const pincodeFields = [
      'residential_details.current_address.pin_code',
      'residential_details.permanent_address.pin_code',
      'parent_details.father_details.pin_code',
      'parent_details.mother_details.pin_code',
      'parent_details.guardian_details.pin_code'
    ]
    pincodeFields.forEach(field => {
      const rawValue = formData[field]
      const pincodeValue = rawValue != null ? String(rawValue).trim() : undefined
      if (pincodeValue && !/^\d{6}$/.test(pincodeValue)) {
        errors[field] = 'Pincode must be exactly 6 digits'
      }
    })
    return Object.keys(errors).length > 0 ? { errors, status: true } : { status: false }
  }, [formData])

  const validateDateRange = useCallback(() => {
    const errors: any = {}
    const startDate = formData['start_date']
    const endDate = formData['end_date']
    const ayValue = formData['academic_year.value']
    const today = dayjs().startOf('day')

    let ayStartDate: any = null
    let ayEndDate: any = null

    if (ayValue && typeof ayValue === 'string') {
      const years = ayValue.split(' - ').map(num => num.trim())
      if (years.length === 2) {
        ayStartDate = dayjs(`${years[0]}-04-01`).startOf('day')
        ayEndDate = dayjs(`${years[1]}-03-31`).endOf('day')
      }
    }

    if (startDate) {
      const startDay = dayjs(startDate)
      if (startDay.isBefore(today)) {
        errors['start_date'] = 'Start Date cannot be in the past'
      } else if (ayStartDate && ayEndDate && (startDay.isBefore(ayStartDate) || startDay.isAfter(ayEndDate))) {
        errors['start_date'] = `Start Date must be within the Academic Year (${ayValue})`
      }
    }

    if (endDate) {
      const endDay = dayjs(endDate)
      if (endDay.isBefore(today)) {
        errors['end_date'] = 'End Date cannot be in the past'
      } else if (ayStartDate && ayEndDate && (endDay.isBefore(ayStartDate) || endDay.isAfter(ayEndDate))) {
        errors['end_date'] = `End Date must be within the Academic Year (${ayValue})`
      }

      if (startDate && endDay.isBefore(dayjs(startDate))) {
        errors['end_date'] = 'End Date cannot be before Start Date'
      }
    }
    return Object.keys(errors).length > 0 ? { errors, status: true } : { status: false }
  }, [formData])

  return {
    isFieldVisible,
    checkValidations,
    validateAllFields,
    validateExternalFields,
    validateExternalEnquiryFields,
    validateExternalKIdsClubEnquiryFields,
    validateResidentialFields,
    validateExternalParentFields,
    validateGuestStudent,
    validateStudentEnrollment,
    validatePincodeFormat,
    validateDateRange,
    getFieldCondition
  }
}
