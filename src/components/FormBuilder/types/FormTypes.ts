export interface Validation {
  validation: boolean
  type: string
  error_message: string
  min?: number
  max?: number
  maxLength?: number
  regexFormat?: RegExp
}

export interface InputField {
  input_field_name: string
  input_label: string
  input_type: string
  input_id: string
  input_placeholder?: string
  input_note?: string
  input_default_value?: any
  input_order: number
  input_is_multiple?: boolean
  input_type_dropdown_options?: any[]
  input_type_radio_options?: any[]
  input_type_checkbox_options?: any[]
  input_dependent_field?: string
  input_dependent_value?: any
  section: string
  validations: Validation[]
}

export interface FormData {
  [key: string]: any
  error?: Record<string, string>
}

export const BASE_VALIDATION_ARRAY: Validation[] = [
  { type: 'is_required', validation: true, error_message: 'Field is required' },
  { type: 'numeric', validation: false, error_message: '' }, 
  { type: 'alphanumeric', validation: false, error_message: '' }, 
  { type: 'email', validation: false, error_message: '' }, 
  { type: 'mobile_no', validation: false, error_message: '' },
  { type: 'range', validation: false, error_message: '', min: 0, max: 0 },
  { type: 'is_repeatable', validation: false, error_message: '' },
  { type: 'is_group_repeatable', validation: false, error_message: '' },
  { type: 'is_hidden', validation: false, error_message: '' },
  { type: 'regexFormat', validation: false, error_message: '', regexFormat: undefined },
  { type: 'is_read_only', validation: false, error_message: '' }, 
  { type: 'is_current_date', validation: false, error_message: '' }, 
  { type: 'max_length', validation: false, error_message: '', maxLength: 200 } 
]

export const OPTIONAL_VALIDATION_ARRAY = (isRequired: boolean): Validation[] => [
  { type: 'is_required', validation: isRequired, error_message: 'Field is required' },
  { type: 'numeric', validation: false, error_message: '' },
  { type: 'alphanumeric', validation: false, error_message: '' },
  { type: 'email', validation: false, error_message: '' },
  { type: 'mobile_no', validation: false, error_message: '' },
  { type: 'range', validation: false, error_message: '', min: 0, max: 0 },
  { type: 'is_repeatable', validation: false, error_message: '' },
  { type: 'is_group_repeatable', validation: false, error_message: '' },
  { type: 'is_hidden', validation: false, error_message: '' },
  { type: 'regexFormat', validation: false, error_message: '', regexFormat: undefined },
  { type: 'is_read_only', validation: false, error_message: '' },
  { type: 'is_current_date', validation: false, error_message: '' },
  { type: 'max_length', validation: false, error_message: '', maxLength: 200 }
]
