'use client'
import {
  Button,
  FormControl,
  Box,
  ListItem,
  IconButton,
  Grid,
  Divider,
  TextareaAutosize,
  FormLabel
} from '@mui/material'
import Typography from '@mui/material/Typography'
import { useFormValidation } from './hooks/useFormValidation'
import { useFormActions } from './hooks/useFormActions'
import { Fragment, useEffect, useState, useCallback, useRef } from 'react'
import { getRequest } from '../../services/apiService'
import moment from 'moment'
import { BASE_VALIDATION_ARRAY as validationArray } from './types/FormTypes'
import Icon from '../../@core/components/icon'
import { useDropzone } from 'react-dropzone'
import { convertDate, getCurrentYearObject, getNestedProperty, getObjectByKeyVal } from 'src/utils/helper'

import dayjs from 'dayjs'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import EnquirySourceType from './ExternalFields/EnquirySourceType'
import EnquirySource from './ExternalFields/EnquirySource'
import EnquirySubSource from './ExternalFields/EnquirySubSource'
import EnquiryEmployeeSource from './ExternalFields/EnquiryEmployeeSource'
import EnrollmentParentSource from './ExternalFields/EnrollmentParentSource'
import EnquiryCorporateSource from './ExternalFields/EnquiryCorporateSource'
import EnquirySchoolSource from './ExternalFields/EnquirySchoolSource'
import EnquiryMode from './ExternalFields/EnquiryMode'
import InfoIcon from '@mui/icons-material/Info'
import KidsClubFields from './ExternalFields/KidsClubFields'
import PSAFields from './ExternalFields/PSAFields'
import EnquiryDetails from './ExternalFields/EnquiryDetails'
import { academicYearApiUrl, ENQUIRY_STAGES, ENQUIRY_STATUS } from 'src/utils/constants'
import ParentsDetails from './ExternalFields/ParentsDetails'
import { parentFields } from './types/parentFields'
import ResidentislDetails from './ExternalFields/ResidentialDetails'
import KidsClubEnquiryDetails from './ExternalFields/KidsClubEnquiryDetails'
// import PhoneNumberField from '../PhoneNumberField'
import { Toaster } from 'react-hot-toast'
import FieldRenderer from './components/FieldRenderer'
import FormSection from './components/FormSection'
import FormDialogs from './components/FormDialogs'
import StudentExists from '../EnquiryForms/Dialog/StudentExists'
// import PhoneNumberInput from 'src/@core/CustomComponent/PhoneNumberInput/PhoneNumberInput'

interface CreateProps {
  auto: boolean
  url: string | null
  slug: string
  appendRequest: {} // Additional Params
  submitProp?: any // Trigers form submittion from outside.
  submitPropsFunction?: any // Callback after form  is submitted
  dataId?: any
  requestParams?: any
  dynamicFormData?: any // Pre Loaded form data
  attachExternalFields?: any
  externalPSAFields?: any
  externalKidsClubFields?: any
  setDynamicFormData?: any
  enquiryTypeData?: any
  activeStageName?: any
  queryTesxtBox?: any
  setSubmitProp?: any
  authToken?: any
}

interface FileProp {
  name: string
  type: string
  size: number
}
export default function CreateForm({
  url,
  slug,
  appendRequest,
  submitProp,
  submitPropsFunction,
  requestParams,
  dynamicFormData,
  attachExternalFields,
  externalPSAFields,
  externalKidsClubFields,
  enquiryTypeData,
  activeStageName,
  queryTesxtBox,
  setSubmitProp,
  authToken
}: CreateProps) {
  const skipReopenCheckRef = useRef(false)
  const [formfields, setFormfields] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [dependentField, setDependentField] = useState<any>(null)
  const [files, setFiles] = useState<File[]>([])
  const [sectionFields, setSectionFields] = useState<any>({})
  const [masterDropDownOptions, setMasterDropDownOptions] = useState<any>([])
  const { setGlobalState } = useGlobalContext()
  const [infoDialog, setInfoDialog] = useState(false)
  const [openReopenDialog, setOpenReopenDialog] = useState(false)
  const [openDupliacteByEmailPhone, setOpenDupliacteByEmailPhone] = useState(false)
  const [openDupliacteByEmailPhoneData, setOpenDupliacteByEmailPhoneData] = useState([])
  const [open10ENRdialog, setOpen10ENRdialog] = useState(false)
  const [handleLeadReopnData, setHandleLeadReopnData] = useState()
  const [openDublicateIVTenquiry, setOpenDublicateIVTenquiry] = useState(false)
  const [dublicateEnquiry, setDublicateEnquiry] = useState('')
  const [openDuplicateRegisteredStudent, setOpenDuplicateRegisteredStudent] = useState(false)
  const [duplicateRegisteredStudentEnr, setDuplicateRegisteredStudentEnr] = useState('')
  const [registeredStudentInfo, setRegisteredStudentInfo] = useState<any>(null)
  const [isDuplicateRegisteredStudent, setIsDuplicateRegisteredStudent] = useState(false)

  //const DownArrow = () => <span style={{ color: '#666666' }} className='icon-arrow-down-1'></span>

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

  useEffect(() => {
    formfields?.[0]?.inputs.forEach(async (item: any) => {
      if (item.input_type == 'masterDropdown') {
        let options: any = []
        if (Array.isArray(item.input_default_value)) {
          options = item.input_default_value.map((val: any) => ({
            id: val,
            attributes: { name: val }
          }))
        } else {
          let endpoint = item.input_default_value
          if (endpoint && endpoint.includes('api/gender?')) {
            endpoint = endpoint.replace('api/gender?', 'api/genders?')
          }
          options = await selectOptions(endpoint)
        }
        setMasterDropDownOptions((prevState: any) => {
          return {
            ...prevState,
            [item.input_field_name]: options
          }
        })
      }
    })
  }, [formfields])

  const handleParentFieldChange = (name: string, value: any, validations: any) => {
    handleChange(name, value, validations, false)
  }

  const checkDuplicateRegisteredStudent = async (firstName: string, lastName: string, dob: string) => {
    if (!firstName || !lastName || !dob) {
      setIsDuplicateRegisteredStudent(false)
      setRegisteredStudentInfo(null)
      setDuplicateRegisteredStudentEnr('')
      setOpenDuplicateRegisteredStudent(false)
      return
    }

    setGlobalState({ isLoading: true })
    const params = {
      url: `/api/ac-students?filters[first_name][$eqi]=${encodeURIComponent(
        firstName
      )}&filters[last_name][$eqi]=${encodeURIComponent(lastName)}&filters[dob][$eq]=${encodeURIComponent(dob)}`,
      serviceURL: 'mdm'
    }

    try {
      const response = await getRequest(params)
      const student = response?.data?.[0]
      const isAlreadyRegistered = Boolean(student?.attributes?.crt_enr_on)

      if (response?.data?.length > 0 && isAlreadyRegistered) {
        setIsDuplicateRegisteredStudent(true)
        setRegisteredStudentInfo(student)
        setDuplicateRegisteredStudentEnr(student.attributes?.crt_enr_on || '')
        setOpenDuplicateRegisteredStudent(true)
      } else {
        setIsDuplicateRegisteredStudent(false)
        setRegisteredStudentInfo(null)
        setDuplicateRegisteredStudentEnr('')
        setOpenDuplicateRegisteredStudent(false)
      }
    } catch (error) {
      setIsDuplicateRegisteredStudent(false)
      setRegisteredStudentInfo(null)
      setDuplicateRegisteredStudentEnr('')
      setOpenDuplicateRegisteredStudent(false)
    } finally {
      setGlobalState({ isLoading: false })
    }
  }

  useEffect(() => {
    if (slug === 'enquiryStudentDetailRegistrationForm' || slug === 'registrationProcessStudentParentDetails') {
      const hasProvisionalAdmission = dynamicFormData?.enquiry_stages?.some(
        (stage: any) =>
          stage.stage_name === 'Admitted or Provisional Approval' &&
          (stage.status === ENQUIRY_STATUS.PROGRESS || stage.status === ENQUIRY_STATUS.PROVISIONAL)
      )

      const isReadmission =
        dynamicFormData?.enquiry_type === 'ReAdmission' ||
        dynamicFormData?.enquiry_type === 'IVT' ||
        dynamicFormData?.enquiry_type === 'readmission_10_11'

      if (hasProvisionalAdmission || isReadmission) {
        setIsDuplicateRegisteredStudent(false)
        setRegisteredStudentInfo(null)
        setDuplicateRegisteredStudentEnr('')
        setOpenDuplicateRegisteredStudent(false)
        return
      }

      const firstName = formData['student_details.first_name']
      const lastName = formData['student_details.last_name']
      const dob = formData['student_details.dob']

      if (firstName && lastName && dob) {
        const timer = setTimeout(() => {
          checkDuplicateRegisteredStudent(firstName, lastName, dob)
        }, 1000)

        return () => clearTimeout(timer)
      }

      setIsDuplicateRegisteredStudent(false)
      setRegisteredStudentInfo(null)
      setDuplicateRegisteredStudentEnr('')
      setOpenDuplicateRegisteredStudent(false)
    }
  }, [
    formData['student_details.first_name'],
    formData['student_details.last_name'],
    formData['student_details.dob'],
    slug,
    dynamicFormData
  ])

  const {
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
    getFieldCondition
  } = useFormValidation({
    formData,
    formfields,
    dependentField,
    slug,
    enquiryTypeData,
    activeStageName,
    attachExternalFields
  })

  const {
    handleChange,
    handleAddMore,
    handleRemove,
    handleCheckbox,
    handleMultiDropdown,
    handleRadioChange,
    checkDependentValue,
    saveFormData,
    handleDuplicateByEmailPhone,
    handleformValidation
  } = useFormActions({
    formData,
    setFormData,
    dependentField,
    setDependentField,
    checkValidations,
    slug,
    authToken,
    masterDropDownOptions,
    setMasterDropDownOptions,
    sectionFields,
    setSectionFields,
    setGlobalState,
    activeStageName,
    submitPropsFunction,
    appendRequest,
    enquiryTypeData,
    skipReopenCheckRef,
    validationFunctions: {
      validateAllFields,
      validateExternalFields,
      validateExternalEnquiryFields,
      validateExternalKIdsClubEnquiryFields,
      validateResidentialFields,
      validateExternalParentFields,
      validateGuestStudent,
      validateStudentEnrollment,
      validatePincodeFormat
    },
    dialogHandlers: {
      setOpenReopenDialog,
      setHandleLeadReopnData,
      setOpenDupliacteByEmailPhone,
      setOpenDupliacteByEmailPhoneData,
      setOpenDublicateIVTenquiry,
      setDublicateEnquiry,
      setOpen10ENRdialog
    },
    url,
    requestParams,
    formfields
  })

  useEffect(() => {
    setGlobalState({ isLoading: true })

    const params = {
      url: `/form-builder/form/` + slug,
      serviceURL: 'admin'
    }
    getRequest(params).then((data: any) => {
      if (data?.data) {
        const sortedInputs = data?.data?.[0]?.inputs
          .sort((a: any, b: any) => a?.['input_order'] - b?.['input_order'])
          ?.map((item: any) => ({
            ...item,
            ['input_dependent_value']: item?.['input_dependent_value']
              ? JSON.parse(item?.['input_dependent_value'])
              : null
          }))
          ?.sort((a: any, b: any) => {
            if (slug === 'enquiryMedicalDetails') {
              const nameA = a['input_field_name']
              const nameB = b['input_field_name']
              if (nameA === 'medical_details.blood_group' || nameA === 'blood_group') return 1
              if (nameB === 'medical_details.blood_group' || nameB === 'blood_group') return -1
            }
            return 0
          })

        setFormfields([
          {
            form: data?.data?.[0]?.form,
            inputs: sortedInputs,
            dependent_field: data?.data?.[0]?.dependent_field
          }
        ])
        getDependentArr(data?.data?.[0]?.dependent_field)

        const groupedData = sortedInputs.reduce((acc: any, item: any) => {
          const section = item.section
          if (!acc[section]) {
            acc[section] = []
          }
          acc[section].push(item)

          return acc
        }, {})

        setSectionFields(groupedData)
      } else {
      }
      setGlobalState({ isLoading: false })
    })
  }, [slug])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const inputElement = document.querySelector('input[name]')
    const inputName: any = inputElement?.getAttribute('name')

    // Process the accepted files
    setFiles(acceptedFiles.map(file => Object.assign(file)))

    const convertedFiles = acceptedFiles.map(file => ({
      name: file.name,
      type: file.type,
      link: URL.createObjectURL(file)
    }))
    setFormData((item: any) => ({
      ...item,
      [inputName]: convertedFiles
    }))
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop
  })

  const renderFilePreview = (file: FileProp) => {
    if (file.type.startsWith('image')) {
      return <img width={38} height={38} alt={file.name} src={URL.createObjectURL(file as any)} />
    } else {
      return <Icon icon='mdi:file-document-outline' />
    }
  }

  const handleRemoveFile = (file: FileProp) => {
    const uploadedFiles = files
    const filtered = uploadedFiles.filter((i: FileProp) => i.name !== file.name)
    setFiles([...filtered])

    // let arr = formData?.[name]?.filter((item: any) => item?.name !== e.name);
    // setFormData((item: any) => ({
    //   ...item,
    //   [name]: arr,
    // }));
  }

  const fileList = files.map((file: FileProp) => (
    <ListItem key={file.name}>
      <div className='file-details'>
        <div className='file-preview'>{renderFilePreview(file)}</div>
        <div>
          <Typography className='file-name'>{file.name}</Typography>
          <Typography className='file-size' variant='body2'>
            {Math.round(file.size / 100) / 10 > 1000
              ? `${(Math.round(file.size / 100) / 10000).toFixed(1)} mb`
              : `${(Math.round(file.size / 100) / 10).toFixed(1)} kb`}
          </Typography>
        </div>
      </div>
      <IconButton onClick={() => handleRemoveFile(file)}>
        <Icon icon='mdi:close' fontSize={20} />
      </IconButton>
    </ListItem>
  ))

  const handleRemoveAllFiles = () => {
    setFiles([])
  }

  const getDependentArr = (data: Array<[]>) => {
    const convertedObject: any = {}
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        convertedObject[key] = data[key].map((obj: any) => ({
          ...obj,
          display: false
        }))
      }
    }
    setDependentField(convertedObject)
  }
  const getDefaultValue = (data: any) => {
    if (data?.['input_type'] === 'date') {
      const date = data?.['input_default_value'] ? new Date(data?.['input_default_value']?.split('T')[0]) : null

      return date
    } else if (data?.['input_type'] === 'time') {
      const date = new Date()
      const _time = moment(data?.['input_default_value'], 'hh:mm:ss A').format('HH:mm:ss')
      const __time = _time.split(':')
      date.setHours(parseInt(__time[0]))
      date.setMinutes(parseInt(__time[1]))
      date.setSeconds(parseInt(__time[2]))

      return date
    } else if (data?.['input_type'] === 'dateRange') {
      const date = new Date(data?.['input_default_value'].split('T')[0])

      return date
    } else if (data?.['input_type'] === 'timeRange') {
      const date = new Date()
      const _time = moment(data?.['input_default_value'].split(','), 'hh:mm:ss A').format('HH:mm:ss')
      const __time = _time.split(':')
      date.setHours(parseInt(__time[0]))
      date.setMinutes(parseInt(__time[1]))
      date.setSeconds(parseInt(__time[2]))

      return date
    } else if (data?.['input_type'] === 'checkbox') {
      return data?.['input_default_value'].split(',')
    } else {
      return data?.['input_default_value']
    }
  }
  useEffect(() => {
    let _formData: any = {}
    formfields?.[0]?.inputs?.map((item: any) => {
      if (item?.['input_type'] !== 'timeRange' && item?.['input_type'] !== 'dateRange') {
        if (item?.validations?.[6]?.validation) {
          _formData = {
            ..._formData,
            [item?.['input_field_name']]: [
              {
                id: Date.now(),
                value: item?.['input_is-multiple'] ? item?.['input_default_value'].split(',') : getDefaultValue(item)

                // item?.['input_default_value']
              }
            ]
          }
        } else {
          _formData = {
            ..._formData,
            [item?.['input_field_name']]: item?.['input_is-multiple']
              ? item?.['input_default_value'].split(',')
              : getDefaultValue(item)

            //  item?.['input_default_value'],
          }
        }
      }
      if (item?.['input_type'] === 'timeRange' || item?.['input_type'] === 'dateRange') {
        _formData = {
          ..._formData,
          [`${item?.['input_field_name']}_start`]: getDefaultValue(item),
          [`${item?.['input_field_name']}_end`]: getDefaultValue(item)
        }
      }
      if (item?.validations?.[11]?.validation) {
        _formData = {
          ..._formData,
          [`${item?.['input_field_name']}`]: convertDate(dayjs())
        }
      }
      if (item?.validations?.[4]?.validation) {
        _formData = {
          ..._formData,
          [`${item['input_field_name']?.replace(/\.[^.]+$/, '.country_code')}`]: 1
        }
      }
    })

    if (
      (enquiryTypeData &&
        (enquiryTypeData?.slug == 'newAdmissionEnquiry' ||
          enquiryTypeData?.slug == 'externalUserNewAdmissionWebsite' ||
          enquiryTypeData?.slug == 'ivtEnquiry' ||
          enquiryTypeData?.slug == 'reAdmission' ||
          enquiryTypeData?.slug == 'readmission_10_11')) ||
      slug == 'enquiryStudentDetailRegistrationForm'
    ) {
      _formData.enquiry_date = dayjs()
      const params = {
        url: academicYearApiUrl,
        serviceURL: 'mdm'
      }
      getRequest(params).then((response: any) => {
        const formattedData = response.data.map((item: any) => ({
          id: item.id,
          name: item.attributes.name,
          value: item.id,
          short_name_two_digit: item.attributes?.short_name_two_digit
        }))
        const currentYear = getCurrentYearObject(response?.data)

        if (currentYear && currentYear?.length) {
          const yearName = getObjectByKeyVal(formattedData, 'id', currentYear[0]?.id)?.name
          _formData['academic_year.id'] = currentYear[0]?.id
          _formData['academic_year.value'] = yearName
        }
      })
    }

    if (activeStageName == ENQUIRY_STAGES?.ENQUIRY) {
      _formData['residential_details.is_permanent_address'] = 'yes'
    }

    // setRequiredFields(_formData); test
    setFormData(_formData)
  }, [formfields])

  useEffect(() => {
    if (dynamicFormData) {
      const _formData: any = { ...formData }
      formfields?.[0]?.inputs?.map((item: any) => {
        if (item['input_field_name'] == 'enquiry_form' || item['input_field_name'] == 'registration_form') {
          _formData[item.input_field_name] = getDefaultValue(item)
        } else {
          if (item?.['input_type'] == 'masterDropdown') {
            checkDependentValue(getNestedProperty(dynamicFormData, item['input_field_name'] + '.id'), item)
            _formData[item.input_field_name] = getNestedProperty(dynamicFormData, item['input_field_name'] + '.id')
            _formData[item.input_field_name + '.id'] = getNestedProperty(
              dynamicFormData,
              item['input_field_name'] + '.id'
            )
            _formData[item.input_field_name + '.value'] = getNestedProperty(
              dynamicFormData,
              item['input_field_name'] + '.value'
            )
          } else {
            if (item['input_field_name'] == 'student_details.enrolment_number') {
              _formData['enquiry_date'] = dayjs()
              _formData[item.input_field_name] = dynamicFormData?.student_details?.enrolment_number
            } else {
              checkDependentValue(getNestedProperty(dynamicFormData, item.input_field_name), item)
              _formData[item.input_field_name] =
                getNestedProperty(dynamicFormData, item.input_field_name) || item.input_default_value
            }
          }
        }
        if (item['input_field_name']?.includes('mobile')) {
          _formData[`${item['input_field_name']?.replace(/\.[^.]+$/, '.country_code')}`] =
            getNestedProperty(dynamicFormData, item['input_field_name']?.replace(/\.[^.]+$/, '.country_code')) || 1
        }
      })

      // const eligibleGrade = getEligibleGrade(_formData).then((resp: any) => {
      //   console.log('_formData>>>eligibleGrade', resp)

      //   _formData['student_details.eligible_grade'] = resp
      //   //setFormData(_formData)

      // })

      setFormData(_formData) ///

      const objNew: any = {}
      if (attachExternalFields || slug == 'enquiryStudentDetailRegistrationForm') {
        // Nikhil
        const external_fields = [
          'enquiry_mode',
          'enquiry_source_type',
          'enquiry_source',
          'enquiry_sub_source',
          'enquiry_employee_source',
          'enquiry_parent_source',
          'enquiry_school_source',
          'enquiry_corporate_source'
        ]
        external_fields?.map((val: any) => {
          objNew[val] = getNestedProperty(dynamicFormData, val + '.id')
          objNew[val + '.id'] = getNestedProperty(dynamicFormData, val + '.id')
          objNew[val + '.value'] = getNestedProperty(dynamicFormData, val + '.value')
        })
      }

      if (externalPSAFields) {
        const external_fields = ['psa_sub_type', 'psa_category', 'psa_sub_category', 'psa_batch', 'period_of_service']
        external_fields?.map((val: any) => {
          objNew[val] = getNestedProperty(dynamicFormData, val + '.id')
          objNew[val + '.id'] = getNestedProperty(dynamicFormData, val + '.id')
          objNew[val + '.value'] = getNestedProperty(dynamicFormData, val + '.value')
        })
      }

      if (externalKidsClubFields) {
        const external_fields = [
          'kids_club_type',
          'kids_club_batch',
          'kids_club_period_of_service',
          'kids_club_month',
          'kids_club_from_cafeteria_opt_for'
        ]
        external_fields?.map((val: any) => {
          objNew[val] = getNestedProperty(dynamicFormData, val + '.id')
          objNew[val + '.id'] = getNestedProperty(dynamicFormData, val + '.id')
          objNew[val + '.value'] = getNestedProperty(dynamicFormData, val + '.value')
        })
      }

      if (
        (enquiryTypeData && enquiryTypeData?.slug == 'newAdmissionEnquiry') ||
        slug == 'enquiryStudentDetailRegistrationForm' ||
        enquiryTypeData?.slug == 'externalUserNewAdmissionWebsite' ||
        enquiryTypeData?.slug == 'ivtEnquiry' ||
        enquiryTypeData?.slug == 'reAdmission' ||
        enquiryTypeData?.slug == 'readmission_10_11'
      ) {
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
        external_fields?.map((val: any) => {
          objNew[val] = getNestedProperty(dynamicFormData, val + '.id')
          objNew[val + '.id'] = getNestedProperty(dynamicFormData, val + '.id')
          objNew[val + '.value'] = getNestedProperty(dynamicFormData, val + '.value')
        })
        objNew['enquiry_date'] = dynamicFormData?.enquiry_date || dayjs()

        switch (enquiryTypeData?.slug) {
          case 'ivtEnquiry':
            objNew['ivt_date'] = dynamicFormData?.ivt_date || dayjs()
            objNew['ivt_reason' + '.id'] = getNestedProperty(dynamicFormData, 'ivt_reason' + '.id')
            objNew['ivt_reason' + '.value'] = getNestedProperty(dynamicFormData, 'ivt_reason' + '.value')
            break
          case 'reAdmission':
            objNew['ivt_date'] = dynamicFormData?.ivt_date || dayjs()
            objNew['ivt_reason' + '.id'] = getNestedProperty(dynamicFormData, 'ivt_reason' + '.id')
            objNew['ivt_reason' + '.value'] = getNestedProperty(dynamicFormData, 'ivt_reason' + '.value')
            break
          case 'readmission_10_11':
            objNew['ivt_date'] = dynamicFormData?.ivt_date || dayjs()
            objNew['ivt_reason' + '.id'] = getNestedProperty(dynamicFormData, 'ivt_reason' + '.id')
            objNew['ivt_reason' + '.value'] = getNestedProperty(dynamicFormData, 'ivt_reason' + '.value')
            break
          default:
            break
        }

        // if(enquiryTypeData?.slug == 'ivtEnquiry' || enquiryTypeData?.slug == 'reAdmission'){
        //   objNew['ivt_date'] = dynamicFormData?.ivt_date || dayjs()
        //   objNew['ivt_reason' + '.id'] = getNestedProperty(dynamicFormData, 'ivt_reason' + '.id')
        //   objNew['ivt_reason' + '.value'] = getNestedProperty(dynamicFormData, 'ivt_reason' + '.value')
        // }
        if (slug == 'enquiryStudentDetailRegistrationForm') {
          objNew['enquiry_number'] = dynamicFormData?.enquiry_number
          objNew['enquiry_type'] = dynamicFormData?.enquiry_type
        }
        objNew['student_details.enrolment_number'] = getNestedProperty(
          dynamicFormData,
          'student_details.enrolment_number'
        )
        objNew['is_guest_student'] = getNestedProperty(dynamicFormData, 'is_guest_student')
        objNew['guest_student_details.location.id'] = getNestedProperty(
          dynamicFormData,
          'guest_student_details.location.id'
        )
        objNew['guest_student_details.location.value'] = getNestedProperty(
          dynamicFormData,
          'guest_student_details.location.value'
        )
      }

      if (enquiryTypeData && enquiryTypeData?.slug == 'externalUserKidsClub') {
        const external_fields = ['academic_year', 'school_location']
        external_fields?.map((val: any) => {
          objNew[val] = getNestedProperty(dynamicFormData, val + '.id')
          objNew[val + '.id'] = getNestedProperty(dynamicFormData, val + '.id')
          objNew[val + '.value'] = getNestedProperty(dynamicFormData, val + '.value')
        })
        objNew['enquiry_date'] = dynamicFormData?.enquiry_date || dayjs()
        if (slug == 'enquiryStudentDetailRegistrationForm') {
          objNew['enquiry_number'] = dynamicFormData?.enquiry_number
          objNew['enquiry_type'] = dynamicFormData?.enquiry_type
        }
      }

      if (slug == 'registrationProcessStudentParentDetails') {
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
        const dataa = updatedParentFields
        const external_fields = [...dataa?.father, ...dataa?.mother, ...dataa?.guardian]
        external_fields?.map((val: any) => {
          objNew[val?.input_field_name] = getNestedProperty(dynamicFormData, val?.input_field_name)
          objNew[val?.input_field_name + '.id'] = getNestedProperty(dynamicFormData, val?.input_field_name + '.id')
          objNew[val?.input_field_name + '.value'] = getNestedProperty(
            dynamicFormData,
            val?.input_field_name + '.value'
          )
          if (val['input_field_name']?.includes('mobile')) {
            objNew[`${val['input_field_name']?.replace(/\.[^.]+$/, '.country_code')}`] =
              getNestedProperty(dynamicFormData, val['input_field_name']?.replace(/\.[^.]+$/, '.country_code')) || 1
          }
        })
        objNew['parent_details.is_parent_single'] =
          getNestedProperty(dynamicFormData, 'parent_details.is_parent_single') || 'no'
        objNew['parent_details.single_parent_type'] =
          getNestedProperty(dynamicFormData, 'parent_details.single_parent_type') || 'father'
      }

      if (slug == 'createContactDetails' || activeStageName == ENQUIRY_STAGES?.ENQUIRY) {
        const external_fields = [
          'residential_details.current_address.house',
          'residential_details.current_address.street',
          'residential_details.current_address.landmark',
          'residential_details.current_address.pin_code',
          'residential_details.current_address.country',
          'residential_details.current_address.state',
          'residential_details.current_address.city',
          'residential_details.is_permanent_address'
        ]
        const isPermanentAddress = getNestedProperty(dynamicFormData, 'residential_details.is_permanent_address')
        if (isPermanentAddress == 'no') {
          const additional_fields = [
            'residential_details.permanent_address.house',
            'residential_details.permanent_address.street',
            'residential_details.permanent_address.landmark',
            'residential_details.permanent_address.pin_code',
            'residential_details.permanent_address.country',
            'residential_details.permanent_address.state',
            'residential_details.permanent_address.city'
          ]

          external_fields.push(...additional_fields)
        }
        external_fields?.map((val: any) => {
          if (val?.includes('country') || val?.includes('city') || val?.includes('state')) {
            objNew[val + '.id'] = getNestedProperty(dynamicFormData, val + '.id')
            objNew[val + '.value'] = getNestedProperty(dynamicFormData, val + '.value')
          } else {
            objNew[val] = getNestedProperty(dynamicFormData, val)
          }
        })
        objNew['residential_details.is_permanent_address'] =
          getNestedProperty(dynamicFormData, 'residential_details.is_permanent_address') === false ? 'no' : 'yes'
      }

      objNew['query'] = getNestedProperty(dynamicFormData, 'query')

      setFormData((prevState: any) => ({
        ...prevState,
        ...objNew
      }))
    }
  }, [dynamicFormData, formfields])

  const renderExternalFields = () => {
    return (
      <>
        <Grid item xs={12} sx={{ mb: '30px' }}>
          <Divider />
        </Grid>
        <Grid item container xs={12} spacing={5}>
          <Grid item xs={4} md={4}>
            <EnquiryMode
              handleChange={handleChange}
              val={formData['enquiry_mode.id']}
              setFormData={setFormData}
              formData={formData}
              validation={validationArray}
              infoDialog={infoDialog}
              enquiryType={enquiryTypeData?.slug}
            />
          </Grid>
          <Grid item xs={4} md={4}>
            <EnquirySourceType
              handleChange={handleChange}
              val={formData['enquiry_source_type.id']}
              setFormData={setFormData}
              formData={formData}
              validation={validationArray}
              infoDialog={infoDialog}
              enquiryType={enquiryTypeData?.slug}
            />
          </Grid>
          <Grid item xs={4} md={4}>
            <EnquirySource
              handleChange={handleChange}
              val={formData['enquiry_source.id']}
              enquirySource={formData['enquiry_source_type.id']}
              setFormData={setFormData}
              formData={formData}
              validation={validationArray}
              infoDialog={infoDialog}
              enquiryType={enquiryTypeData?.slug}
            />
          </Grid>
          <Grid item xs={4} md={4}>
            <EnquirySubSource
              handleChange={handleChange}
              val={formData['enquiry_sub_source.id']}
              enquirySubSource={formData['enquiry_source.id']}
              validation={validationArray}
              formData={formData}
              setFormData={setFormData}
              infoDialog={infoDialog}
              enquiryType={enquiryTypeData?.slug}
            />
          </Grid>
          {String(formData['enquiry_sub_source.value'] || '').includes('Employee') && (
            <Grid item xs={4} md={4}>
              <EnquiryEmployeeSource
                handleChange={handleChange}
                val={formData['enquiry_employee_source.id']}
                enquiryEmployeeSource={formData['enquiry_sub_source.id']}
                validation={validationArray}
                formData={formData}
                setFormData={setFormData}
                infoDialog={infoDialog}
              />
            </Grid>
          )}
          {String(formData['enquiry_sub_source.value'] || '').includes('Parent') && (
            <Grid item xs={4} md={4}>
              <EnrollmentParentSource
                handleChange={handleChange}
                val={formData['enquiry_parent_source.id']}
                EnrollmentParentSource={formData['enquiry_sub_source.id']}
                validation={validationArray}
                formData={formData}
                setFormData={setFormData}
                infoDialog={infoDialog}
              />
            </Grid>
          )}
          {String(formData['enquiry_sub_source.value'] || '').includes('Corporate') && (
            <Grid item xs={4} md={4}>
              <EnquiryCorporateSource
                handleChange={handleChange}
                val={formData['enquiry_corporate_source.id']}
                enquiryCorporateSource={formData['enquiry_sub_source.id']}
                validation={validationArray}
                formData={formData}
                setFormData={setFormData}
                infoDialog={infoDialog}
              />
            </Grid>
          )}
          {String(formData['enquiry_sub_source.value'] || '').includes('Pre School') && (
            <Grid item xs={4} md={4}>
              <EnquirySchoolSource
                handleChange={handleChange}
                val={formData['enquiry_school_source.id']}
                enquirySchoolSource={formData['enquiry_sub_source.id']}
                validation={validationArray}
                formData={formData}
                setFormData={setFormData}
                infoDialog={infoDialog}
              />
            </Grid>
          )}
        </Grid>
      </>
    )
  }

  const renderExternalPSAFields = () => {
    return (
      <Grid item container xs={12} spacing={5} sx={{ mt: '15px', mb: '105px' }}>
        <PSAFields
          school={formData['school_location.id']}
          board={formData['board.id']}
          grade={formData['student_details.grade.id']}
          stream={formData['stream.id']}
          course={formData['course.id']}
          academic_year={
            getObjectByKeyVal(masterDropDownOptions['academic_year'], 'id', formData['academic_year.id'])?.attributes
              ?.short_name_two_digit
          }
          handleChange={handleChange}
          setFormData={setFormData}
          formData={formData}
          validation={validationArray}
          psaSubType={formData['psa_sub_type.id']}
          psaCategory={formData['psa_category.id']}
          psaSubCategory={formData['psa_sub_category.id']}
          psaPeriodOfService={formData['period_of_service.id']}
          psaBatch={formData['psa_batch.id']}
        />
      </Grid>
    )
  }

  const renderExternalKidsClubFields = () => {
    return (
      <Grid item container xs={12} spacing={5} sx={{ mt: '15px', mb: '105px' }}>
        <Grid item xs={12}>
          <Divider />
        </Grid>

        <KidsClubFields
          kidsClubType={formData['kids_club_type.id']}
          kidsClubBatch={formData['kids_club_batch.id']}
          kidsClubPeriodOfService={formData['kids_club_period_of_service.id']}
          kidsClubMonth={formData['kids_club_month.id']}
          kidsclubCafeteriaOptFor={formData['kids_club_from_cafeteria_opt_for.id']}
          setFormData={setFormData}
          formData={formData}
          validation={validationArray}
          handleChange={handleChange}
          school={formData['school_location.id']}
          board={formData['board.id']}
          grade={formData['student_details.grade.id']}
          stream={formData['stream.id']}
          course={formData['course.id']}
          academic_year={
            getObjectByKeyVal(masterDropDownOptions['academic_year'], 'id', formData['academic_year.id'])?.attributes
              ?.short_name_two_digit
          }
        />
      </Grid>
    )
  }

  const renderEnquiryDetailsFields = () => {
    return (
      <>
        <Grid item xs={12} sx={{ mb: '30px' }}>
          <Typography variant='h6' color={'text.primary'} sx={{ lineHeight: '22px' }}>
            Enquiry Details
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ mb: '30px' }}>
          <Divider />
        </Grid>
        <Grid item container xs={12} spacing={5} sx={{ mt: '15px' }}>
          <EnquiryDetails
            isIVT={
              enquiryTypeData?.slug == 'ivtEnquiry' ||
              enquiryTypeData?.slug == 'reAdmission' ||
              enquiryTypeData?.slug == 'readmission_10_11'
                ? true
                : false
            }
            ivtType={enquiryTypeData?.slug}
            activeStageName={activeStageName}
            validationArray={validationArray}
            handleChange={handleChange}
            formData={formData}
            infoDialog={infoDialog}
            academicYear={formData['academic_year.id']}
            schoolLocation={formData['school_location.id']}
            brand={formData['brand.id']}
            board={formData['board.id']}
            grade={formData['student_details.grade.id']}
            shift={formData['shift.id']}
            course={formData['course.id']}
            stream={formData['stream.id']}
            setFormData={setFormData}
            isRegistration={slug == 'enquiryStudentDetailRegistrationForm'}
          />
        </Grid>
      </>
    )
  }

  const renderKidsClubEnquiryDetailsFields = () => {
    return (
      <>
        <Grid item xs={12} sx={{ mb: '30px' }}>
          <Typography variant='h6' color={'text.primary'} sx={{ lineHeight: '22px' }}>
            Enquiry Details
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ mb: '30px' }}>
          <Divider />
        </Grid>
        <Grid item container xs={12} spacing={5}>
          <KidsClubEnquiryDetails
            activeStageName={activeStageName}
            validationArray={validationArray}
            handleChange={handleChange}
            formData={formData}
            infoDialog={infoDialog}
            academicYear={formData['academic_year.id']}
            schoolLocation={formData['school_location.id']}
          />
        </Grid>
      </>
    )
  }

  const renderParentDetails = () => {
    return (
      <ParentsDetails
        formData={formData}
        handleChange={handleChange}
        validationArray={validationArray}
        handleParentFieldChange={handleParentFieldChange}
        setFormData={setFormData}
        slug={slug}
        enquiryTypeData={enquiryTypeData}
      />
    )
  }

  useEffect(() => {
    if (submitProp) {
      if (isDuplicateRegisteredStudent) {
        return
      }

      saveFormData()
      if (setSubmitProp) setSubmitProp(false)
    }
  }, [submitProp, isDuplicateRegisteredStudent])

  return (
    <>
      <Toaster position='top-right' />
      <Grid container xs={12} spacing={7} style={{ marginTop: '5px' }}>
        <Grid item xs={12}>
          <Box sx={{ width: '5%', mt: 1, float: 'right' }}>
            <IconButton
              disableFocusRipple
              disableTouchRipple
              color='secondary'
              onClick={() => setInfoDialog(prev => !prev)}
            >
              <InfoIcon style={{ color: '#FA5A7D' }} />
            </IconButton>
          </Box>
          {slug === 'enquiryMedicalDetails' && (
            <Grid item xs={12} sx={{ mb:2 }}>
              <Typography variant='h6' sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '0.25px' }}>
                Medical Information
              </Typography>
            </Grid>
          )}
          {slug == 'registrationProcessStudentParentDetails' ? renderParentDetails() : null}
          {slug == 'enquiryStudentDetailRegistrationForm' ||
          slug == 'createEnquiryNewAdmissionTestForm' ||
          enquiryTypeData?.slug == 'externalUserNewAdmissionWebsite' ||
          slug == 'ivtEnquiryForm' ||
          slug == 'readmissionEnquiryForm' ||
          slug == 'X_XI_reAdmissionForm' ||
          slug == 'enquiryStudentDetailRegistrationForm'
            ? renderEnquiryDetailsFields()
            : null}
          {enquiryTypeData && enquiryTypeData?.slug == 'externalUserKidsClub'
            ? renderKidsClubEnquiryDetailsFields()
            : null}
        </Grid>
        {Object.keys(sectionFields).map((mainSection, index) => (
          <FormSection key={index} title={mainSection}>
            {sectionFields[mainSection] &&
              sectionFields[mainSection].map((item: any, dataIndex: number) => {
                const isMedicalYesNo = slug === 'enquiryMedicalDetails' && (
                  [
                    'medical_details.was_hopitalised',
                    'medical_details.has_physical_disability',
                    'medical_details.has_medical_history',
                    'medical_details.has_allergy',
                    'medical_details.has_learning_needs'
                  ].includes(item?.['input_field_name']) || 
                  (item?.['input_field_name'] || '').toLowerCase().includes('has_') ||
                  (item?.['input_field_name'] || '').toLowerCase().includes('was_') ||
                  (item?.['input_label'] || '').toLowerCase().startsWith('has ')
                );

                const isBloodGroup = slug === 'enquiryMedicalDetails' && (
                  ['medical_details.blood_group', 'blood_group'].includes(item?.['input_field_name']) ||
                  (item?.['input_label'] || '').toLowerCase().includes('blood group')
                );

                const hasDependentVisible = isMedicalYesNo && sectionFields[mainSection].some((depItem: any) => 
                  depItem?.['input_dependent_field'] === item?.['input_name'] && isFieldVisible(depItem)
                );

                return (
                <Fragment key={dataIndex}>
                  {isBloodGroup && isFieldVisible(item) && (
                    <Grid item xs={12} md={12} sx={{ p: '0 !important' }} />
                  )}
                  {isFieldVisible(item) ? (
                    <Grid
                      item
                      xs={12}
                      md={
                        (item?.['input_type'] === 'radio' && !isMedicalYesNo) ||
                        item?.['input_field_name'] === 'residential_details.is_permanent_address'
                          ? 12
                          : isBloodGroup
                          ? 4
                          : (slug === 'enquiryMedicalDetails' &&
                              ['medical_details.physical_disability_description',
                               'medical_details.medical_history_description',
                               'medical_details.allergy_description',
                               'medical_details.personalised_learning_needs',
                               'medical_details.personalized_learning_needs'].includes(item?.['input_field_name']))
                          ? 8
                          : 4
                      }
                    >
                      <FieldRenderer
                        item={isMedicalYesNo ? { ...item, input_type: 'radio' } : item}
                        formData={formData}
                        setFormData={setFormData}
                        handleChange={handleChange}
                        handleCheckbox={handleCheckbox}
                        handleMultiDropdown={handleMultiDropdown}
                        handleRadioChange={handleRadioChange}
                        handleAddMore={handleAddMore}
                        handleRemove={handleRemove}
                        isFieldVisible={isFieldVisible}
                        masterDropDownOptions={masterDropDownOptions}
                        setMasterDropDownOptions={setMasterDropDownOptions}
                        infoDialog={infoDialog}
                        files={files}
                        getRootProps={getRootProps}
                        getInputProps={getInputProps}
                        fileList={fileList}
                        handleRemoveAllFiles={handleRemoveAllFiles}
                        formfields={formfields}
                      />
                    </Grid>
                  ) : null}
                  {(isMedicalYesNo && !hasDependentVisible && isFieldVisible(item)) || 
                    (isBloodGroup && isFieldVisible(item)) ? (
                    <Grid item xs={12} md={8} />
                  ) : null}

                </Fragment>
                );
              })}

          </FormSection>
        ))}
        <Grid item xs={12} container justifyContent='flex-end'>
          {(slug == 'createContactDetails' || activeStageName == ENQUIRY_STAGES?.ENQUIRY) && slug !== 'createEnquiryKidsClubForm' ? (
            <ResidentislDetails
              activeStageName={activeStageName}
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              handleParentFieldChange={handleParentFieldChange}
            />
          ) : null}
          {externalPSAFields ? renderExternalPSAFields() : null}
          {(externalKidsClubFields && slug !== 'createEnquiryKidsClubForm') ? renderExternalKidsClubFields() : null}
          {(attachExternalFields || slug == 'enquiryStudentDetailRegistrationForm') && slug !== 'createEnquiryKidsClubForm' ? (
            <Grid key={enquiryTypeData?.slug || 'default'} item xs={12} sx={{ mb: '30px' }}>
              {renderExternalFields()}
            </Grid>
          ) : null}
          {(activeStageName == ENQUIRY_STAGES?.ENQUIRY || queryTesxtBox) && slug !== 'createEnquiryKidsClubForm' ? (
            <Grid item container xs={12} spacing={5}>
              <Grid item xs={4} md={8}>
                <FormControl fullWidth variant='outlined' sx={{ position: 'relative', marginTop: '20px' }}>
                  <FormLabel
                    sx={{
                      position: 'absolute',
                      top: '-8px',
                      left: '12px',
                      background: 'white',
                      padding: '0 4px',
                      fontSize: '14px',
                      color: '#666666'
                    }}
                  >
                    Query
                  </FormLabel>
                  <TextareaAutosize
                    value={formData?.query}
                    onChange={(e: any) => {
                      setFormData((prevState: any) => {
                        return {
                          ...prevState,
                          query: e.target.value
                        }
                      })
                    }}
                    minRows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      color: '#666666'
                    }}
                  />
                </FormControl>
              </Grid>
            </Grid>
          ) : null}
          <Button
            variant='contained'
            color='secondary'
            onClick={saveFormData}
            disableFocusRipple
            disableTouchRipple
            disabled={handleformValidation()}
            sx={{ display: 'none' }}
          >
            Save
          </Button>
        </Grid>
      </Grid>
      <StudentExists
        openModal={openDuplicateRegisteredStudent}
        header={'Student already registered'}
        message={`This student is already registered with the enrollment number ${duplicateRegisteredStudentEnr}.`}
        closeModal={() => {
          setOpenDuplicateRegisteredStudent(false)
          const academicsUrl = process.env.NEXT_PUBLIC_FRONT_ACADEMICS_URL || ''
          const studentId = registeredStudentInfo?.id
          if (studentId) {
            window.location.href = `${academicsUrl}student-listing/student-detail-view/${studentId}/`
          }
        }}
      />
      <FormDialogs
        openReopenDialog={openReopenDialog}
        setOpenReopenDialog={setOpenReopenDialog}
        handleLeadReopnData={handleLeadReopnData}
        skipReopenCheckRef={skipReopenCheckRef}
        saveFormData={saveFormData}
        openDupliacteByEmailPhone={openDupliacteByEmailPhone}
        setOpenDupliacteByEmailPhone={setOpenDupliacteByEmailPhone}
        openDupliacteByEmailPhoneData={openDupliacteByEmailPhoneData}
        handleDuplicateByEmailPhone={handleDuplicateByEmailPhone}
        open10ENRdialog={open10ENRdialog}
        setOpen10ENRdialog={setOpen10ENRdialog}
        openDublicateIVTenquiry={openDublicateIVTenquiry}
        setOpenDublicateIVTenquiry={setOpenDublicateIVTenquiry}
        dublicateEnquiry={dublicateEnquiry}
      />
    </>
  )
}
