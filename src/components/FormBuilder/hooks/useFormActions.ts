import { useCallback, useState } from 'react'
import moment from 'moment'
import { getRequest, patchRequest, postRequest } from '../../../services/apiService'
import { Validation } from '../types/FormTypes'
import toast from 'react-hot-toast'
import { ENQUIRY_STAGES } from 'src/utils/constants'
import { getObjectByKeyVal, removeObjectNullAndEmptyKeys, searchObjectsByAttribute } from 'src/utils/helper'

interface UseFormActionsProps {
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  dependentField: any
  setDependentField: React.Dispatch<React.SetStateAction<any>>
  checkValidations: (validations: Validation[], value: any, fieldName?: string) => string
  slug: string
  authToken?: string
  masterDropDownOptions: any
  setMasterDropDownOptions: React.Dispatch<React.SetStateAction<any>>
  sectionFields: any
  setSectionFields: React.Dispatch<React.SetStateAction<any>>
  setApiResponseType?: (type: any) => void
  setGlobalState: (state: any) => void
  activeStageName?: string
  submitPropsFunction?: any
  appendRequest?: any
  enquiryTypeData?: any
  skipReopenCheckRef: React.MutableRefObject<boolean>
  validationFunctions: {
    validateAllFields: () => Promise<any>
    validateExternalFields: () => any
    validateExternalEnquiryFields: () => any
    validateExternalKIdsClubEnquiryFields: () => any
    validateResidentialFields: () => any
    validateExternalParentFields: () => any
    validateGuestStudent: () => any
    validateStudentEnrollment: () => any
    validatePincodeFormat: () => any
    validateDateRange: () => any
  }
  dialogHandlers: {
    setOpenReopenDialog: (open: boolean) => void
    setHandleLeadReopnData: (data: any) => void
    setOpenDupliacteByEmailPhone: (open: boolean) => void
    setOpenDupliacteByEmailPhoneData: (data: any) => void
    setOpenDublicateIVTenquiry: (open: boolean) => void
    setDublicateEnquiry: (enquiry: string) => void
    setOpen10ENRdialog: (open: boolean) => void
  }
  url: string | null
  requestParams: any
  formfields: any
}

export const useFormActions = ({
  formData,
  setFormData,
  dependentField,
  setDependentField,
  checkValidations,
  masterDropDownOptions,
  setMasterDropDownOptions,
  sectionFields,
  setApiResponseType,
  setGlobalState,
  slug,
  authToken,
  activeStageName,
  submitPropsFunction,
  appendRequest,
  enquiryTypeData,
  skipReopenCheckRef,
  validationFunctions,
  dialogHandlers,
  url,
  requestParams,
  formfields
}: UseFormActionsProps) => {
  const {
    validateAllFields,
    validateExternalFields,
    validateExternalEnquiryFields,
    validateExternalKIdsClubEnquiryFields,
    validateResidentialFields,
    validateExternalParentFields,
    validateGuestStudent,
    validateStudentEnrollment,
    validatePincodeFormat,
    validateDateRange
  } = validationFunctions

  const {
    setOpenReopenDialog,
    setHandleLeadReopnData,
    setOpenDupliacteByEmailPhone,
    setOpenDupliacteByEmailPhoneData,
    setOpenDublicateIVTenquiry,
    setDublicateEnquiry
  } = dialogHandlers

  const [formTouched, setFormTouched] = useState(false)


  const findObjectById = (array: any[], id: any) => {
    return array?.find((obj: any) => obj.id == id)
  }

  const selectOptions = async (endpoint = 'products') => {
    setGlobalState({ isLoading: true })
    const params = {
      url: '/' + endpoint,
      serviceURL: 'mdm',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
      }
    }
    try {
      const data = await getRequest(params)
      setGlobalState({ isLoading: false })
      return data?.data || []
    } catch (error) {
      setGlobalState({ isLoading: false })
      return []
    }
  }

  const UpdateDependentDropDownInputs = useCallback(
    async (name: string) => {
      const updates = Object.keys(sectionFields).map(async key => {
        const elements = sectionFields[key]
        for (const element of elements) {
          if (element.input_dependent_field === name) {
            if (element.input_default_value?.includes('mdm/schools')) {
              continue
            }
            const options = await selectOptions(element.input_default_value)
            setMasterDropDownOptions((prevState: any) => ({
              ...prevState,
              [element.input_field_name]: options
            }))

            setDependentField((val: any) => {
              const updated = { ...val }
              if (updated[element.input_dependent_field]) {
                updated[element.input_dependent_field] = updated[element.input_dependent_field].map((obj: any) => ({
                  ...obj,
                  display: true
                }))
              }
              return updated
            })
          }
        }
      })
      await Promise.all(updates)
    },
    [sectionFields, setMasterDropDownOptions, setDependentField]
  )

  const checkDependentValue = useCallback(
    (value: any, item: any) => {
      const fieldName = item?.['input_name'] || item?.['input_field_name']
      if (!fieldName) return

      const _dependentFields = dependentField?.[fieldName] ?? null
      if (!_dependentFields) return

      const updatedDependentFields = _dependentFields.map((obj: any) => {
        const newObj = { ...obj }
        for (const key in newObj) {
          if (key !== 'display') {
            if (newObj[key] === null) {
              newObj.display = value !== '' && value !== null && value !== undefined
            } else {
              let parsedVal
              try {
                parsedVal = typeof newObj[key] === 'string' ? JSON.parse(newObj[key]) : newObj[key]
              } catch {
                parsedVal = newObj[key]
              }

              if (parsedVal === value) {
                newObj.display = true
              } else if (
                parsedVal?.['type'] === 'date' &&
                moment(parsedVal?.['start']).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') ===
                  moment(value).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
              ) {
                newObj.display = true
              } else if (
                parsedVal?.['type'] === 'time' &&
                moment(parsedVal?.['start']).format('HH:mm:ss') === moment(value).format('HH:mm:ss')
              ) {
                newObj.display = true
              } else {
                newObj.display = false
              }
            }
          }
        }
        return newObj
      })

      setDependentField((prev: any) => ({
        ...prev,
        [fieldName]: updatedDependentFields
      }))
    },
    [dependentField, setDependentField]
  )

  const getEligibleGrade = useCallback(async (formValues: any) => {
    const schoolId = formValues['school_location.id'] || formValues['kidsclub_location.id']
    if (!formValues['academic_year.id'] || !schoolId || !formValues['student_details.dob'])
      return null
    const params = {
      url: `marketing/enquiry/eligible-grade?academicYearId=${formValues['academic_year.id']}&schoolId=${schoolId}&dob=${formValues['student_details.dob']}`,
      serviceURL: 'marketing'
    }
    try {
      const data: any = await getRequest(params)
      return data?.data?.eligibleGrade
    } catch (error) {
      return null
    }
  }, [])

  const handleChange = useCallback(
    async (
      name: string,
      value: any,
      validations: Validation[],
      isRepeatable: boolean,
      id: any = '',
      item: any = null
    ) => {
      setFormTouched(true)
      const error = checkValidations(validations, value, item?.['input_label'])

      if (isRepeatable) {
        setFormData((prev: any) => {
          const updatedRepeatableFields = (prev[name] || []).map((f: any) => {
            if (f.id === id) return { ...f, value: value }
            return f
          })
          return {
            ...prev,
            [name]: updatedRepeatableFields,
            error: { ...prev.error, [name]: error }
          }
        })
      } else {
        if (item?.input_type === 'masterDropdown') {
          const newObj = findObjectById(masterDropDownOptions[item.input_field_name], value)
          if (item.input_field_name in dependentField) {
            UpdateDependentDropDownInputs(name)
          }

          const extractedValue =
            newObj?.attributes?.name ||
            newObj?.name ||
            newObj?.attributes?.description ||
            newObj?.description ||
            (newObj?.attributes ? Object.values(newObj.attributes)[0] : null) ||
            value

          setFormData((prev: any) => ({
            ...prev,
            [name + '.id']: value,
            [name + '.value']: String(extractedValue ?? ''),
            error: { ...prev.error, [name]: error }
          }))
        } else if (item?.input_type === 'masterDropdownExternal') {
          const newObj = item.keyMap
            ? searchObjectsByAttribute(item.msterOptions, item.keyMap, value)[0]
            : findObjectById(item.msterOptions, value)
          let resolvedValue: any
          switch (name) {
            case 'enquiry_mode':
              resolvedValue = newObj?.attributes?.mode || newObj?.mode || newObj?.name
              break
            case 'enquiry_source_type':
              resolvedValue = newObj?.attributes?.type || newObj?.type || newObj?.name
              break
            case 'enquiry_source':
              resolvedValue = newObj?.attributes?.enquiry_source?.data?.attributes?.source || newObj?.source || newObj?.name
              break
            case 'enquiry_sub_source':
              resolvedValue =
                newObj?.attributes?.enquiry_sub_source?.data?.attributes?.source || newObj?.source || newObj?.name
              break
            case 'brand':
              resolvedValue = newObj?.attributes?.name || newObj?.name
              break
            case 'school_location':
              resolvedValue = newObj?.attributes?.name || newObj?.name
              break
            case 'academic_year':
              resolvedValue = newObj?.attributes?.name || newObj?.attributes?.year || newObj?.name || newObj?.year
              break
            default:
              resolvedValue = newObj?.attributes?.name || newObj?.name || value
          }
          setFormData((prev: any) => ({
            ...prev,
            [name + '.id']: value,
            [name + '.value']: String(resolvedValue ?? value),
            error: { ...prev.error, [name]: error }
          }))
        } else {
          setFormData((prev: any) => ({
            ...prev,
            [name]: value,
            error: { ...prev.error, [name]: error }
          }))
        }
      }

      if (
        item?.['input_type'] === 'dropdown' ||
        item?.['input_type'] === 'radio' ||
        item?.['input_type'] === 'masterDropdown' ||
        item?.['input_type'] === 'masterDropdownExternal' ||
        item?.['input_type'] === 'checkbox'
      ) {
        checkDependentValue(value, item)
      }

      // SIDE EFFECTS
      if (name === 'academic_year') {
        setFormData((prev: any) => ({
          ...prev,
          ['school_location.id']: null,
          ['school_location.value']: null,
          ['kidsclub_location.id']: null,
          ['kidsclub_location.value']: null
        }))

        const isKidsClub =
          enquiryTypeData?.slug === 'externalUserKidsClub' ||
          formData.enquiry_type === 'KidsClub' ||
          slug === 'createEnquiryKidsClubForm' ||
          enquiryTypeData?.name?.toLowerCase()?.includes('kids club')

        if (isKidsClub && value) {
          const fetchSchools = async () => {
            try {
              const academicYearObj = masterDropDownOptions['academic_year']?.find((opt: any) => opt.id === value)
              const yearShort = academicYearObj?.attributes?.short_name_two_digit || academicYearObj?.short_name_two_digit
              
              if (yearShort) {
                const params = {
                  url: '/api/ac-schools/search-school',
                  serviceURL: 'mdm',
                  data: { operator: `academic_year_id = ${yearShort}` }
                }
                const response: any = await postRequest(params)
                if (response?.success && response?.data?.schools) {
                  const uniqueSchools = response.data.schools.reduce((acc: any[], current: any) => {
                    if (!acc.find(item => item.school_id === current.school_id)) {
                      acc.push(current)
                    }
                    return acc
                  }, [])

                  const formattedSchools = uniqueSchools.map((s: any) => ({
                    ...s,
                    id: s.school_id,
                    name: s.name,
                    value: s.school_id,
                    attributes: { ...s, name: s.name }
                  }))
                  
                  setMasterDropDownOptions((prev: any) => ({
                    ...prev,
                    school_location: formattedSchools,
                    kidsclub_location: formattedSchools
                  }))
                }
              }
            } catch (error) {
            }
          }
          fetchSchools()
        }
      }

      if ((name === 'school_location' || name === 'kidsclub_location') && value) {
        const isKidsClubForGrade =
          enquiryTypeData?.slug === 'externalUserKidsClub' ||
          formData.enquiry_type === 'KidsClub' ||
          slug === 'createEnquiryKidsClubForm' ||
          enquiryTypeData?.name?.toLowerCase()?.includes('kids club')

        if (isKidsClubForGrade) {
          const fetchGradesBySchool = async () => {
            try {
              const academicYearObj = masterDropDownOptions['academic_year']?.find(
                (opt: any) => opt.id === formData['academic_year.id']
              )
              const yearShort =
                academicYearObj?.attributes?.short_name_two_digit ||
                academicYearObj?.short_name_two_digit

              if (yearShort && value) {
                const params = {
                  url: '/api/ac-schools/search-school',
                  serviceURL: 'mdm',
                  data: { operator: `academic_year_id = ${yearShort} and school_id = ${value}` }
                }
                const response: any = await postRequest(params)
                if (response?.success && response?.data?.schools) {
                  const uniqueGrades = response.data.schools
                    .reduce((acc: any[], current: any) => {
                      if (!acc.find((g: any) => g.grade_id === current.grade_id)) acc.push(current)
                      return acc
                    }, [])
                    .sort((a: any, b: any) => (a.grade_id || 0) - (b.grade_id || 0))

                  const formattedGrades = uniqueGrades.map((g: any) => ({
                    ...g,
                    id: g.grade_id,
                    name: g.grade_name,
                    value: g.grade_id,
                    attributes: { ...g, name: g.grade_name }
                  }))

                  setMasterDropDownOptions((prev: any) => ({
                    ...prev,
                    grade: formattedGrades,
                    'student_details.grade': formattedGrades
                  }))

                  setFormData((prev: any) => ({
                    ...prev,
                    grade: null,
                    'grade.id': null,
                    'grade.value': null,
                    'student_details.grade': null,
                    'student_details.grade.id': null,
                    'student_details.grade.value': null
                  }))
                }
              }
            } catch (error) {}
          }
          fetchGradesBySchool()
        }
      }

      if (
        (name === 'student_details.dob' || name === 'school_location' || name === 'kidsclub_location' || name === 'academic_year') &&
        formData['academic_year.id'] &&
        (formData['school_location.id'] || formData['kidsclub_location.id'] || ( (name === 'school_location' || name === 'kidsclub_location') && value))
      ) {
        const eligibleGrade = await getEligibleGrade({
          ...formData,
          [name + ( (name === 'school_location' || name === 'kidsclub_location') ? '.id' : '')]: value
        })
        
        const isKidsClub =
          enquiryTypeData?.slug === 'externalUserKidsClub' ||
          formData.enquiry_type === 'KidsClub' ||
          slug === 'createEnquiryKidsClubForm' ||
          enquiryTypeData?.name?.toLowerCase()?.includes('kids club')

        if (isKidsClub) {
          setFormData((prev: any) => ({
            ...prev,
            ['student_details.eligible_grade']: eligibleGrade,
            ['student_details.eligible_grade.value']: eligibleGrade
          }))
        } else {
          setFormData((prev: any) => ({
            ...prev,
            ['student_details.eligible_grade']: eligibleGrade
          }))
        }
      }

      if (name === 'employee_id') {
        if (!value) {
          setFormData((prev: any) => ({
            ...prev,
            employee_details: null,
            error: { ...prev.error, employee_id: '' }
          }))
          return
        }

        const fetchEmployeeDetails = async () => {
          try {
            setGlobalState({ isLoading: true })
            const params = {
              url: `/api/hr-employee-masters?filters[Group_Employee_Code][$eq]=${value}&populate=*`,
              serviceURL: 'mdm',
              headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
              }
            }
            const response: any = await getRequest(params)
            if (response?.data?.length > 0) {
              const emp = response.data[0]
              const employmentStatus = emp?.attributes?.Employment_Status?.data?.attributes?.Employment_Status
              const dateSeparation = emp?.attributes?.Date_of_Sepearation

              const isActive = employmentStatus === 'Active'
              const hasNotResigned = !dateSeparation

              if (isActive && hasNotResigned) {
                setFormData((prev: any) => ({
                  ...prev,
                  employee_details: emp,
                  error: { ...prev.error, employee_id: '' }
                }))
              } else {
                const reason = !isActive ? 'Employee is not active' : 'Employee has resigned'
                setFormData((prev: any) => ({
                  ...prev,
                  employee_details: null,
                  error: { ...prev.error, employee_id: reason }
                }))
              }
            } else {
              setFormData((prev: any) => ({
                ...prev,
                employee_details: null,
                error: { ...prev.error, employee_id: 'Invalid Employee ID' }
              }))
            }
          } catch (error) {
            setFormData((prev: any) => ({
              ...prev,
              employee_details: null,
              error: { ...prev.error, employee_id: 'Error verifying Employee ID' }
            }))
          } finally {
            setGlobalState({ isLoading: false })
          }
        }

        const timer = setTimeout(() => {
          fetchEmployeeDetails()
        }, 1000)

        return () => clearTimeout(timer)
      }

      if (name === 'is_staff_child' && value === 'no') {
        setFormData((prev: any) => ({
          ...prev,
          employee_id: '',
          employee_details: null,
          error: { ...prev.error, employee_id: '' }
        }))
      }

      if (
        (name === 'parent_type' || name === 'parent_type.id') &&
        (
          enquiryTypeData?.slug === 'externalUserKidsClub' ||
          slug?.toLowerCase().includes('kidsclub') ||
          formData?.enquiry_type === 'KidsClub' ||
          enquiryTypeData?.name?.toLowerCase()?.includes('kids club')
        )
      ) {
        const pTypeLower = String(value || '').toLowerCase()
        let prefix = ''
        if (pTypeLower === 'father') prefix = 'parent_details.father_details'
        else if (pTypeLower === 'mother') prefix = 'parent_details.mother_details'
        else if (pTypeLower === 'guardian') prefix = 'parent_details.guardian_details'

        if (prefix) {
          setFormData((prev: any) => ({
            ...prev,
            parent_first_name: prev[`${prefix}.first_name`] || '',
            parent_last_name: prev[`${prefix}.last_name`] || '',
            parent_email_id: prev[`${prefix}.email`] || '',
            parent_mobile_number: prev[`${prefix}.mobile`] || '',
          }))
        }
      }

      const fetchAndPopulateStudent = async (enr: string, fieldName: string) => {
        try {
          setGlobalState({ isLoading: true })
          const data: any = await getRequest({ url: `marketing/admission/${enr}/student-details` })
          if (data?.status) {
            const sd = data?.data?.student_details
            const pd = data?.data?.parent_details
            const rd = data?.data?.residential_details

            // Grade 10 check for readmission_10_11
            if (enquiryTypeData?.slug === 'readmission_10_11' && sd?.grade?.id !== 10) {
              dialogHandlers?.setOpen10ENRdialog?.(true)
              setFormData({})
              setGlobalState({ isLoading: false })
              return
            }

            setFormData((prev: any) => ({
              ...prev,
              ['student_details.first_name']: sd?.first_name,
              ['student_details.last_name']: sd?.last_name,
              ['student_details.grade.id']: sd?.grade?.id,
              ['student_details.grade.value']: String(sd?.grade?.value || ''),
              ['student_details.gender.id']: sd?.gender?.id,
              ['student_details.gender.value']: String(sd?.gender?.value || ''),
              ['student_details.dob']: sd?.dob,
              // parent_type — set all three variants so every dropdown type binds correctly
              ['parent_type']: data?.data?.parent_type,
              ['parent_type.id']: data?.data?.parent_type,
              ['parent_type.value']: data?.data?.parent_type,
              // Father details
              ['parent_details.father_details.first_name']: pd?.father_details?.first_name,
              ['parent_details.father_details.last_name']: pd?.father_details?.last_name,
              ['parent_details.father_details.mobile']: pd?.father_details?.mobile,
              ['parent_details.father_details.email']: pd?.father_details?.email,
              // Mother details
              ['parent_details.mother_details.first_name']: pd?.mother_details?.first_name,
              ['parent_details.mother_details.last_name']: pd?.mother_details?.last_name,
              ['parent_details.mother_details.mobile']: pd?.mother_details?.mobile,
              ['parent_details.mother_details.email']: pd?.mother_details?.email,
              // Guardian details
              ['parent_details.guardian_details.first_name']: pd?.guardian_details?.first_name,
              ['parent_details.guardian_details.last_name']: pd?.guardian_details?.last_name,
              ['parent_details.guardian_details.mobile']: pd?.guardian_details?.mobile,
              ['parent_details.guardian_details.email']: pd?.guardian_details?.email,
              // Residential
              ['residential_details.current_address.street']: rd?.current_address?.street,
              ['residential_details.current_address.house']: rd?.current_address?.house,
              ['residential_details.current_address.landmark']: rd?.current_address?.landmark,
              ['residential_details.current_address.pin_code']: rd?.current_address?.pin_code,
              ['residential_details.current_address.country.id']: rd?.current_address?.country?.id,
              ['residential_details.current_address.country.value']: rd?.current_address?.country?.value,
              ['residential_details.current_address.state.id']: rd?.current_address?.state?.id,
              ['residential_details.current_address.state.value']: rd?.current_address?.state?.value,
              ['residential_details.current_address.city.id']: rd?.current_address?.city?.id,
              ['residential_details.current_address.city.value']: rd?.current_address?.city?.value,
              error: { ...prev.error, [fieldName]: '' }
            }))

            if (setApiResponseType && data?.data?.type) setApiResponseType(data?.data?.type)
          } else {
            if (setApiResponseType) {
              setApiResponseType({
                status: true,
                message: data?.message || 'Student Details Not Found!'
              })
            }
            setFormData((prev: any) => ({
              ...prev,
              error: { ...prev.error, [fieldName]: data?.message || 'Student Details Not Found!' }
            }))
          }
        } catch (err: any) {
          const errMsg = err?.response?.data?.message || 'Student Details Not Found!'
          if (setApiResponseType) {
            setApiResponseType({
              status: true,
              message: errMsg
            })
          }
          setFormData((prev: any) => ({
            ...prev,
            error: { ...prev.error, [fieldName]: errMsg }
          }))
        } finally {
          setGlobalState({ isLoading: false })
        }
      }

      if (
        (name === 'student_details.enrolment_number' || name === 'enrollment_no' || name === 'enrollment_number') &&
        value?.length >= 13
      ) {
        await fetchAndPopulateStudent(value, name)
      }

      // Sibling / Vibgyor ID side effects
      if ((name.includes('vibgyor_id') || name === 'another_student_details.vibgyor_id') && value?.length >= 13) {
        const fetchVibgyorDetails = async () => {
          try {
            setGlobalState({ isLoading: true })
            const params = {
              url: '/studentProfile/getEnrollmentDetail',
              serviceURL: 'admin',
              data: { crt_enr_on: value }
            }
            const data: any = await postRequest(params)
            if (data?.success) {
              const sp = data?.data?.studentProfile
              const prefix = name.replace('.vibgyor_id', '')

              setFormData((prev: any) => ({
                ...prev,
                [`${prefix}.first_name`]: sp?.first_name,
                [`${prefix}.last_name`]: sp?.last_name,
                [`${prefix}.dob`]: sp?.dob,
                [`${prefix}.gender.id`]: sp?.gender_id,
                [`${prefix}.gender.value`]: sp?.gender,
                [`${prefix}.school`]: sp?.crt_school,
                [`${prefix}.grade.id`]: sp?.crt_grade_id
              }))

              // Trigger eligible grade check
              const acYearObj = getObjectByKeyVal(
                masterDropDownOptions['academic_year'],
                'attributes.short_name_two_digit',
                sp?.academic_year_id?.toString()
              )
              const gradeData = {
                [`academic_year.id`]: acYearObj?.id,
                [`school_location.id`]: sp?.crt_school_id,
                [`student_details.dob`]: sp?.dob
              }
              const resp = await getEligibleGrade(gradeData)
              if (resp) {
                setFormData((prev: any) => ({
                  ...prev,
                  [`${prefix}.eligible_grade`]: resp
                }))
              }
            }
          } catch (err) {
          } finally {
            setGlobalState({ isLoading: false })
          }
        }
        fetchVibgyorDetails()
      }
    },
    [
      formData,
      setFormData,
      checkValidations,
      checkDependentValue,
      dependentField,
      getEligibleGrade,
      masterDropDownOptions,
      UpdateDependentDropDownInputs,
      setMasterDropDownOptions,
      setApiResponseType
    ]
  )

  const handleAddMore = useCallback(
    (name: string, item: any) => {
      const getDefaultValue = (data: any) => {
        if (data?.['input_type'] === 'date') return null
        if (data?.['input_type'] === 'time') return null
        if (data?.['input_type'] === 'checkbox') return []
        return data?.['input_default_value'] || ''
      }

      const currentFields = Array.isArray(formData[name]) ? formData[name] : []
      const newValue = item?.['input_is-multiple']
        ? item?.['input_default_value']?.split(',') ?? []
        : getDefaultValue(item)

      // Check for duplicate child - if the value already exists in repeated field
      const isDuplicate = currentFields.some((field: any) => {
        if (Array.isArray(newValue) && Array.isArray(field.value)) {
          // For multi-select/checkbox arrays, check if arrays are equal
          return JSON.stringify(newValue.sort()) === JSON.stringify(field.value.sort())
        }
        // For simple values, check direct equality
        return field.value === newValue
      })

      if (isDuplicate) {
        toast.error(`This ${item?.['input_label'] || 'field'} value already exists. Please select a different value.`)
        return
      }

      setFormData((prev: any) => {
        const updatedFields = Array.isArray(prev[name]) ? prev[name] : []
        return {
          ...prev,
          [name]: [
            ...updatedFields,
            {
              id: Date.now(),
              value: newValue
            }
          ]
        }
      })
    },
    [setFormData, formData]
  )

  const handleRemove = useCallback(
    (name: string, id: any) => {
      setFormData((prev: any) => ({
        ...prev,
        [name]: (prev[name] || []).filter((f: any) => f.id !== id)
      }))
    },
    [setFormData]
  )

  const handleCheckbox = useCallback(
    (value: any, name: any, isRepeatable: boolean, id: any = '', item: any = null) => {
      setFormData((prev: any) => {
        if (isRepeatable) {
          const currentRepeatedFields = prev[name] || []
          const field = currentRepeatedFields.find((f: any) => f.id === id)
          if (!field) return prev

          const currentValues = Array.isArray(field.value) ? field.value : []
          const updatedValues = currentValues.includes(value)
            ? currentValues.filter((v: any) => v !== value)
            : [...currentValues, value]

          const updatedFields = currentRepeatedFields.map((f: any) =>
            f.id === id ? { ...f, value: updatedValues } : f
          )
          return { ...prev, [name]: updatedFields }
        } else {
          const currentValues = Array.isArray(prev[name]) ? prev[name] : []
          const updatedValues = currentValues.includes(value)
            ? currentValues.filter((v: any) => v !== value)
            : [...currentValues, value]

          const error = checkValidations(item?.validations, updatedValues, item?.['input_label'])

          if (updatedValues.length > 0) {
            checkDependentValue(updatedValues[0], item)
          }

          return {
            ...prev,
            [name]: updatedValues,
            error: { ...prev.error, [name]: error }
          }
        }
      })
    },
    [setFormData, checkValidations, checkDependentValue]
  )

  const handleMultiDropdown = useCallback(
    (id: any, options: any, name: any, isRepeatable: boolean) => {
      setFormData((prev: any) => {
        const values = options.map((opt: any) => opt.value)
        if (isRepeatable) {
          const updated = (prev[name] || []).map((f: any) => (f.id === id ? { ...f, value: values } : f))
          return { ...prev, [name]: updated }
        } else {
          return { ...prev, [name]: values }
        }
      })
    },
    [setFormData]
  )

  const handleRadioChange = useCallback(
    (value: any, name: any) => {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value
      }))
    },
    [setFormData]
  )

  const saveFormData = useCallback(async () => {
    const errors = await validateAllFields()
    const externalErrors = validateExternalFields()
    const externalEnquiryErrors = validateExternalEnquiryFields()
    const guestStudentErrors = validateGuestStudent()
    const studentEnrollmentErrors = validateStudentEnrollment()
    const pincodeErrors = validatePincodeFormat()
    const dateRangeErrors = validateDateRange()

    let externalParentErrors: any = { status: false }
    if (slug === 'registrationProcessStudentParentDetails') {
      externalParentErrors = validateExternalParentFields()
    }

    let externalResidentialDetailsErrors: any = { status: false }
    if (slug === 'createContactDetails' || activeStageName === ENQUIRY_STAGES?.ENQUIRY) {
      externalResidentialDetailsErrors = validateResidentialFields()
    }

    const kidsClubEnquiryFields = validateExternalKIdsClubEnquiryFields()

    if (
      Object.keys(errors).length > 0 ||
      externalErrors?.status ||
      externalEnquiryErrors?.status ||
      externalParentErrors?.status ||
      externalResidentialDetailsErrors?.status ||
      kidsClubEnquiryFields?.status ||
      studentEnrollmentErrors?.status ||
      pincodeErrors?.status ||
      dateRangeErrors?.status ||
      !!(formData?.error?.['enrollment_no'] || formData?.error?.['enrollment_number'] || formData?.error?.['student_details.enrolment_number'])
    ) {
      const allErrors = {
        ...errors,
        ...externalErrors?.errors,
        ...externalEnquiryErrors?.errors,
        ...externalParentErrors?.errors,
        ...externalResidentialDetailsErrors?.errors,
        ...kidsClubEnquiryFields?.errors,
        ...guestStudentErrors?.errors,
        ...studentEnrollmentErrors?.errors,
        ...pincodeErrors?.errors,
        ...dateRangeErrors?.errors
      }
      
      if (formData?.error?.['enrollment_no']) allErrors['enrollment_no'] = formData.error['enrollment_no']
      if (formData?.error?.['enrollment_number']) allErrors['enrollment_number'] = formData.error['enrollment_number']
      if (formData?.error?.['student_details.enrolment_number']) allErrors['student_details.enrolment_number'] = formData.error['student_details.enrolment_number']

      if (pincodeErrors?.status) {
        const pincodeErrorMsg = Object.values(pincodeErrors.errors)[0] as string
        toast.error(pincodeErrorMsg || 'Invalid pincode format')
      } else {
        const errorCount = Object.keys(allErrors).length
        const fieldLabels = Object.keys(allErrors)
          .map(key => {
            let label = key.replace(/\.id$/, '').replace(/\.value$/, '')
            label = label.split('.').pop() || label
            return label.replace(/_/g, ' ')
          })
          .filter((value, index, self) => self.indexOf(value) === index) // Unique labels
          .join(', ')

        toast.error(`Please fill ${errorCount} required field${errorCount > 1 ? 's' : ''}: ${fieldLabels}`)
      }

      setFormData((prevState: any) => ({
        ...prevState,
        error: allErrors
      }))

      if (submitPropsFunction) {
        submitPropsFunction({ action: false, slug: formfields?.[0]?.form?.slug, status: false })

        let errorFieldToScroll = ''
        if (Object.keys(errors).length > 0) errorFieldToScroll = Object.keys(errors)[0]
        else if (pincodeErrors?.status) errorFieldToScroll = Object.keys(pincodeErrors.errors)[0]
        else if (externalErrors?.status) errorFieldToScroll = Object.keys(externalErrors?.errors)[0]
        else if (externalEnquiryErrors?.status) errorFieldToScroll = Object.keys(externalEnquiryErrors?.errors)[0]
        else if (externalParentErrors?.status) errorFieldToScroll = Object.keys(externalParentErrors?.errors)[0]
        else if (externalResidentialDetailsErrors?.status)
          errorFieldToScroll = Object.keys(externalResidentialDetailsErrors?.errors)[0]
        else if (kidsClubEnquiryFields?.status) errorFieldToScroll = Object.keys(kidsClubEnquiryFields?.errors)[0]
        else if (guestStudentErrors?.status) errorFieldToScroll = Object.keys(guestStudentErrors?.errors)[0]
        else if (dateRangeErrors?.status) errorFieldToScroll = Object.keys(dateRangeErrors.errors)[0]

        if (errorFieldToScroll) {
          const errorElement = document.getElementById(errorFieldToScroll)
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }
      setGlobalState({ isLoading: false })
      return
    }

    setGlobalState({ isLoading: true })

    const reqObj = { ...formData }
    delete reqObj.error
    delete reqObj.files

    const pincodeFields = [
      'residential_details.current_address.pin_code',
      'residential_details.permanent_address.pin_code',
      'parent_details.father_details.pin_code',
      'parent_details.mother_details.pin_code',
      'parent_details.guardian_details.pin_code'
    ]
    pincodeFields.forEach(field => {
      if (reqObj[field] != null) reqObj[field] = String(reqObj[field]).trim()
    })

    const fieldsToDelete = [
      'enquiry_mode',
      'enquiry_source_type',
      'enquiry_source',
      'enquiry_sub_source',
      'enquiry_employee_source',
      'psa_sub_type',
      'psa_category',
      'psa_sub_category',
      'psa_batch',
      'period_of_service',
      'kids_club_type',
      'kids_club_batch',
      'kids_club_period_of_service',
      'kids_club_month',
      'kids_club_from_cafeteria_opt_for',
      'academic_year',
      'school_location',
      'board',
      'brand',
      'student_details.grade',
      'shift',
      'course',
      'stream',
      'is_staff_child',
      'employee_details'
    ]

    const isKidsClub =
      enquiryTypeData?.slug === 'externalUserKidsClub' ||
      formData.enquiry_type === 'KidsClub' ||
      slug === 'createEnquiryKidsClubForm' ||
      enquiryTypeData?.name?.toLowerCase()?.includes('kids club')

    Object.keys(reqObj).forEach(key => {
      if (key === 'is_guest_student') {
        reqObj[key] = Array.isArray(reqObj[key]) ? reqObj[key].includes('yes') : !!reqObj[key]
      }
      
      if (isKidsClub) {
        if (typeof reqObj[key] === 'string' && reqObj[key].startsWith('api/')) {
          delete reqObj[key]
          return
        }
        
        if (reqObj[key + '.id'] !== undefined || reqObj[key + '.value'] !== undefined) {
          delete reqObj[key]
          return
        }

        const kidsClubExtraExclusions = [
          'student_details.division',
          'student_details.eligible_grade',
          'division',
          'eligible_grade'
        ]

        if (
          key in masterDropDownOptions || 
          fieldsToDelete.includes(key) || 
          fieldsToDelete.some(f => key.startsWith(f + '.')) ||
          kidsClubExtraExclusions.includes(key) ||
          kidsClubExtraExclusions.some(f => key.startsWith(f + '.'))
        ) {
          delete reqObj[key]
        }
      } else {
        if (key in masterDropDownOptions || fieldsToDelete.includes(key)) {
          delete reqObj[key]
        }
      }
    })

    if (slug === 'registrationProcessStudentParentDetails') {
      reqObj['parent_details.is_parent_single'] = formData['parent_details.is_parent_single']
      reqObj['parent_details.single_parent_type'] = formData['parent_details.single_parent_type']
      const parentSubFields = ['father_details', 'mother_details', 'guardian_details']
      parentSubFields.forEach(p => {
        delete reqObj[`parent_details.${p}.country`]
        delete reqObj[`parent_details.${p}.state`]
        delete reqObj[`parent_details.${p}.city`]
        delete reqObj[`parent_details.${p}.organization_name.id`]
        delete reqObj[`parent_details.${p}.organization_name.value`]
        if (typeof reqObj[`parent_details.${p}.organization_name`] === 'object')
          delete reqObj[`parent_details.${p}.organization_name`]
      })
    }

  

    const isStaffChildValue = formData['is_staff_child'] ?? formData['is_the_student_staff_child'] ?? false
    const actualIsStaffChild = isStaffChildValue === 'yes' || isStaffChildValue === true

    const enquiryId = url?.split('/')?.pop()

    const dataToPass = {
      ...appendRequest,
      is_student_staff_child: isKidsClub ? actualIsStaffChild : appendRequest.is_student_staff_child,
      data: isKidsClub
        ? {
            ...removeObjectNullAndEmptyKeys(reqObj),
            enquiry_type: 'KidsClub',
            student_type: String(formData['student_type.id'] || formData['student_type'] || 'Vibgyor'),
            is_student_staff_child: actualIsStaffChild,
            is_the_student_staff_child: actualIsStaffChild ? 'yes' : 'no',
            ...(actualIsStaffChild && { employee_id: String(formData['employee_id'] || '') }),
            'academic_year.id': Number(formData['academic_year.id']),
            'academic_year.value': String(formData['academic_year.value'] || ''),
            'school_location.id': Number(formData['school_location.id'] || formData['kidsclub_location.id']),
            'school_location.value': String(
              formData['school_location.value'] || formData['kidsclub_location.value'] || ''
            ),
            'grade.id': Number(formData['student_details.grade.id'] || formData['grade.id'] || 0),
            'grade.value': String(
              formData['student_details.grade.value'] || formData['grade.value'] || ''
            ),
            enrollment_number: String(
              formData['student_details.enrolment_number'] ||
                formData['enrollment_number'] ||
                formData['enrollment_no'] ||
                ''
            ),
            start_date: String(formData['start_date'] || formData['enquiry_date'] || new Date().toISOString()),
            end_date: String(formData['end_date'] || formData['enquiry_date'] || new Date().toISOString()),
            enquiry_date: String(formData['enquiry_date'] || new Date().toISOString()),
            'student_details.first_name': String(formData['student_details.first_name'] || ''),
            'student_details.last_name': String(formData['student_details.last_name'] || ''),
            'student_details.dob': String(formData['student_details.dob'] || ''),
            'student_details.eligible_grade': String(
              formData['student_details.eligible_grade.value'] ||
              (formData['student_details.eligible_grade'] && !formData['student_details.eligible_grade'].startsWith('api/') 
                ? formData['student_details.eligible_grade'] 
                : 'N/A')
            ),
            'student_details.gender.id': Number(formData['student_details.gender.id'] || 0),
            'student_details.gender.value': String(formData['student_details.gender.value'] || ''),
            'student_details.division.value': String(
              formData['student_details.division.value'] || formData['student_details.division'] || ''
            ),
            parent_type: String(formData['parent_type'] || 'Father'),
            'parent_details.father_details.country_code': Number(formData['parent_details.father_details.country_code'] || 1),
            'parent_details.mother_details.country_code': Number(formData['parent_details.mother_details.country_code'] || 1),
            'parent_details.guardian_details.country_code': Number(formData['parent_details.guardian_details.country_code'] || 1),
            ...( (formData['parent_type'] === 'Father' || !formData['parent_type']) && {
              'parent_details.father_details.first_name': String(formData['parent_details.father_details.first_name'] || ''),
              'parent_details.father_details.last_name': String(formData['parent_details.father_details.last_name'] || ''),
              'parent_details.father_details.mobile': String(formData['parent_details.father_details.mobile'] || ''),
              'parent_details.father_details.email': String(formData['parent_details.father_details.email'] || '')
            }),
            ...(formData['parent_type'] === 'Mother' && {
              'parent_details.mother_details.first_name': String(formData['parent_details.mother_details.first_name'] || ''),
              'parent_details.mother_details.last_name': String(formData['parent_details.mother_details.last_name'] || ''),
              'parent_details.mother_details.mobile': String(formData['parent_details.mother_details.mobile'] || ''),
              'parent_details.mother_details.email': String(formData['parent_details.mother_details.email'] || '')
            }),
            ...(formData['parent_type'] === 'Guardian' && {
              'parent_details.guardian_details.first_name': String(formData['parent_details.guardian_details.first_name'] || ''),
              'parent_details.guardian_details.last_name': String(formData['parent_details.guardian_details.last_name'] || ''),
              'parent_details.guardian_details.mobile': String(formData['parent_details.guardian_details.mobile'] || ''),
              'parent_details.guardian_details.email': String(formData['parent_details.guardian_details.email'] || '')
            }),
            batch_selection: formData['batch_selection'] || [],
            ...(requestParams?.reqType === 'PATCH' && enquiryId && enquiryId !== 'create' && { enquiryId: enquiryId })
          }
    : {
        ...removeObjectNullAndEmptyKeys(reqObj),
        ...(formData?.enquiry_type && { enquiry_type: formData?.enquiry_type }),
        ...((formData['parent_type'] ||
          formData['enquiry_parent_source.parent_type'] ||
          formData['parent_details.single_parent_type'] ||
          (formData['parent_details.father_details.first_name'] && 'Father') ||
          slug === 'createEnquiryKidsClubForm') &&
          !isKidsClub && {
          parent_type:
            formData['parent_type'] ||
            formData['enquiry_parent_source.parent_type'] ||
            formData['parent_details.single_parent_type'] ||
            (formData['parent_details.father_details.first_name']
              ? 'Father'
              : slug === 'createEnquiryKidsClubForm'
              ? 'Father'
              : undefined)
        }),
          is_guest_student: formData['is_guest_student']
          ? Array.isArray(formData['is_guest_student'])
          ? formData['is_guest_student'].includes('yes')
          : !!formData['is_guest_student']
          : false,
          ...(slug === 'createEnquiryKidsClubForm' &&
          !isKidsClub &&
          formData['kidsclub_location.id'] && {
          school_location: {
          id: formData['kidsclub_location.id'],
          value: String(formData['kidsclub_location.value'] || '')
          }
          }),
        // Referral-related fields
      ...(formData['enquiry_mode.value'] &&
        !isKidsClub && {
          enquiry_mode: { id: formData['enquiry_mode.id'], value: formData['enquiry_mode.value'] }
        }),
      ...(formData['enquiry_source_type.value'] &&
        !isKidsClub && {
          enquiry_source_type: {
            id: formData['enquiry_source_type.id'],
            value: formData['enquiry_source_type.value']
          }
        }),
      ...(formData['enquiry_source.value'] &&
        !isKidsClub && {
          enquiry_source: { id: formData['enquiry_source.id'], value: formData['enquiry_source.value'] }
        }),
      ...(formData['enquiry_sub_source.value'] &&
        !isKidsClub && {
          enquiry_sub_source: { id: formData['enquiry_sub_source.id'], value: formData['enquiry_sub_source.value'] }
        }),
      // Dependent referral source fields
      ...(formData['enquiry_employee_source.id'] &&
        !isKidsClub && {
          enquiry_employee_source: {
            id: formData['enquiry_employee_source.id'],
            value: formData['enquiry_employee_source.value'],
            name: formData['enquiry_employee_source.name'],
            number: formData['enquiry_employee_source.number']
          }
        }),
      ...(formData['enquiry_parent_source.id'] &&
        !isKidsClub && {
          enquiry_parent_source: {
            id: formData['enquiry_parent_source.id'],
            value: formData['enquiry_parent_source.value'],
            name: formData['enquiry_parent_source.name'],
            enquirynumber: formData['enquiry_parent_source.enquirynumber'],
            parent_type: formData['enquiry_parent_source.parent_type']
          }
        }),
      ...(formData['enquiry_corporate_source.id'] &&
        !isKidsClub && {
          enquiry_corporate_source: {
            id: formData['enquiry_corporate_source.id'],
            value: formData['enquiry_corporate_source.value'],
            spoc_mobile_no: formData['enquiry_corporate_source.spoc_mobile_no'],
            spoc_email: formData['enquiry_corporate_source.spoc_email']
          }
        }),
      ...(formData['enquiry_school_source.id'] &&
        !isKidsClub && {
          enquiry_school_source: {
            id: formData['enquiry_school_source.id'],
            value: formData['enquiry_school_source.value'],
            spoc_mobile_no: formData['enquiry_school_source.spoc_mobile_no'],
            spoc_email: formData['enquiry_school_source.spoc_email']
          }
        })
    }
}



    const shouldCheckDuplicate = 
      activeStageName === ENQUIRY_STAGES?.ENQUIRY || 
      (isKidsClub && slug === 'enquiryKidsClubStudentDetailRegistrationForm');

    if (shouldCheckDuplicate && !skipReopenCheckRef.current) {
      const reopenParams = {
        url: `marketing/enquiry/handleReopn`,
        authToken,
        data: {
          'student_details.first_name': formData['student_details.first_name'],
          'student_details.last_name': formData['student_details.last_name'],
          'student_details.dob': formData['student_details.dob'],
          'academic_year.id': formData['academic_year.id'],
          enquiry_type: isKidsClub ? 'KidsClub' : formData['enquiry_type'],  
          ...(enquiryId && enquiryId !== 'create' && { enquiry_id: enquiryId })
        }
      }
      const reopenResp = await postRequest(reopenParams)
      if (reopenResp?.data?.data?.length > 0) {
        setHandleLeadReopnData(reopenResp?.data)
        setOpenReopenDialog(true)
        setGlobalState({ isLoading: false })
        return
      }

      // if (slug !== 'createEnquiryKidsClubForm') {
      //   const dupParams = {
      //     url: `marketing/enquiry/handleDuplicate/findByEmailPhone`,
      //     authToken,
      //     data: {
      //       email:
      //         formData['parent_details.father_details.email'] ||
      //         formData['parent_details.mother_details.email'] ||
      //         formData['parent_details.guardian_details.email'] || '',
      //       phone:
      //         formData['parent_details.father_details.mobile'] ||
      //         formData['parent_details.mother_details.mobile'] ||
      //         formData['parent_details.guardian_details.mobile'] || '',
      //       enquiryType: formData?.enquiry_type ,
      //       ...(enquiryId && enquiryId !== 'create' && { enquiry_id: enquiryId })
      //     }
      //   }
      //   const dupResp = await postRequest(dupParams)
      //   if (dupResp?.data?.length > 0) {
      //     setOpenDupliacteByEmailPhone(true)
      //     setOpenDupliacteByEmailPhoneData(dupResp?.data)
      //     setGlobalState({ isLoading: false })
      //     return
      //   }
      // }
    }

    const Url = url
    let resp
    if (requestParams?.reqType === 'PATCH') resp = await patchRequest({ url: Url, data: dataToPass })
    else {
      if (
        activeStageName === ENQUIRY_STAGES?.ENQUIRY &&
        enquiryTypeData?.slug === 'readmission_10_11' &&
        formData['student_details.enrolment_number']
      ) {
        const enrParams = {
          url: `marketing/enquiry/getDublicateEnquiry/enr`,
          authToken,
          data: { enrollment: formData['student_details.enrolment_number'], enquiryType: formData?.enquiry_type }
        }
        const enrResp = await patchRequest(enrParams)
        if (enrResp?.data?.length > 0) {
          setOpenDublicateIVTenquiry(true)
          setDublicateEnquiry(enrResp?.data[0].enquiry_number)
          setGlobalState({ isLoading: false })
          return
        }
      }
      resp = await postRequest({ url: Url, data: dataToPass })
    }

    if (submitPropsFunction) {
      submitPropsFunction({ action: false, slug: formfields?.[0]?.form?.slug, status: resp.status, data: resp?.data })
    }
  }, [
    formData,
    appendRequest,
    url,
    activeStageName,
    authToken,
    enquiryTypeData,
    slug,
    formfields,
    masterDropDownOptions,
    requestParams,
    skipReopenCheckRef,
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
    setHandleLeadReopnData,
    setOpenReopenDialog,
    setOpenDupliacteByEmailPhone,
    setOpenDupliacteByEmailPhoneData,
    setOpenDublicateIVTenquiry,
    setDublicateEnquiry,
    setGlobalState,
    setFormData,
    submitPropsFunction
  ])

  const handleDuplicateByEmailPhone = useCallback(() => {
    skipReopenCheckRef.current = true
    setGlobalState({ isLoading: true })
    saveFormData()
    setOpenDupliacteByEmailPhone(false)
  }, [saveFormData, setOpenDupliacteByEmailPhone, skipReopenCheckRef, setGlobalState])

  const checkerrorMessage = useCallback(() => {
    const obj = formData?.error || {}
    return Object.values(obj).some(v => v !== '')
  }, [formData?.error])

  const handleformValidation = useCallback(() => {
    return formTouched ? !checkerrorMessage() : true
  }, [formTouched, checkerrorMessage])

  const isEmployeeVerified = !!formData?.employee_details

  return {
    handleChange,
    handleAddMore,
    handleRemove,
    handleCheckbox,
    handleMultiDropdown,
    handleRadioChange,
    checkDependentValue,
    getEligibleGrade,
    saveFormData,
    handleDuplicateByEmailPhone,
    checkerrorMessage,
    handleformValidation,
    formTouched,
    isEmployeeVerified 

  }
}
