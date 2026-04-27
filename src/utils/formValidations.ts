import { z } from 'zod';

export function validateTextField(value: string, label: string): { error: string | null; label: string } {
  const schema = z.string().min(1, `The ${label} field is required`);
  const res = schema.safeParse(value?.trim());
  return { error: res.success ? null : res.error.issues[0].message, label };
}

export function validateSelect(value: string, label: string): string | null {
  const schema = z.string().min(1, `Please select a ${label}`);
  const res = schema.safeParse(value?.trim());
  return res.success ? null : res.error.issues[0].message;
}

export function validateSelectField(value: string | undefined, label: string): { error: string | null; label: string } {
  const schema = z.string().min(1, `Please select a valid option for the ${label}`);
  const res = schema.safeParse(value);
  return { error: res.success ? null : res.error.issues[0].message, label };
}

export function validateRequiredField(value: string, errorMessage: string) {
  const schema = z.string().min(1, errorMessage || 'This field is rquired');
  const res = schema.safeParse(value?.trim());
  return res.success ? '' : res.error.issues[0].message;
}

export function validateNumericField(value: string, errorMessage: string) {
  const schema = z.string().regex(/^[0-9\b]+$/, errorMessage);
  const res = schema.safeParse(value);
  return res.success ? '' : res.error.issues[0].message;
}

export function validateEmailField(value: string, errorMessage: string) {
  if (value === '' || value == null) return '';
  const schema = z.string().email(errorMessage).refine(val => val === val.toLowerCase(), { message: 'Email must be all lowercase letters' });
  const res = schema.safeParse(value);
  return res.success ? '' : res.error.issues[0].message;
}

export function validateAlphaNumericField(value: string, errorMessage: string) {
  if (!value) return '';
  const schema = z.string().regex(/^[0-9a-zA-Z ]*$/, errorMessage || 'Only alphanumeric characters are allowed');
  const res = schema.safeParse(value);
  return res.success ? '' : res.error.issues[0].message;
}

export function validateAlphaField(value: string, errorMessage: string) {
  if (!value) return '';
  const schema = z.string().regex(/^[a-zA-Z ]*$/, errorMessage || 'Only letters are allowed');
  const res = schema.safeParse(value);
  return res.success ? '' : res.error.issues[0].message;
}

export function validateMobileNoField(value: string, errorMessage: string) {
  if (value === '' || value == null) return '';
  const schema = z.string().regex(/^[0-9]{10}$/, errorMessage || 'Enter valid mobile number');
  const res = schema.safeParse(value);
  return res.success ? '' : res.error.issues[0].message;
}

export function validateRangeField(value: number, errorMessage: string, min: number, max: number) {
  if (min <= value && value <= max) {
    return errorMessage;
  }
  return '';
}

export function validateLengthField(value: string, maxLength: number) {
  if (value && value.length > maxLength) {
    return `Length of ${maxLength} characters reached`;
  }
  return '';
}

export function validateNotFutureDate(value: any, errorMessage: string) {
  if (!value) return '';
  const selectedDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate > today) {
    return errorMessage || 'Date cannot be in the future';
  }
  return '';
}

export function validatePANField(value: string, errorMessage?: string) {
  if (value === '' || value == null) return '';
  const schema = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, errorMessage || 'Enter valid PAN number');
  const res = schema.safeParse(value?.toUpperCase());
  return res.success ? '' : res.error.issues[0].message;
}

export const buildFieldSchema = (
  validations: any[],
  fieldName = ''
) => {
  let schema: z.ZodTypeAny = z.any();

  // Then refine or pipe
  schema = schema.superRefine((val, ctx) => {
     const isRequired = validations?.[0]?.validation;
     const errorMessage = validations?.[0]?.error_message || 'This field is required';

     if (isRequired) {
         if (val === undefined || val === null || val === '') {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: errorMessage });
             return;
         }
         if (typeof val === 'string' && !val.trim()) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: errorMessage });
             return;
         }
         if (Array.isArray(val) && val.length === 0) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: errorMessage });
             return;
         }
     } else {
         if (val === undefined || val === null || val === '') return;
         if (typeof val === 'string' && !val.trim()) return;
         if (Array.isArray(val) && val.length === 0) return;
     }
     
     const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
     
     if (validations?.[9]?.validation) {
       const regexString = validations[9].regexFormat;
       const regex = regexString ? new RegExp(regexString) : /.*/;
       if (!regex.test(strVal)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: validations[9].error_message || 'Regex Validation Failed.' });
       }
     }
     if (validations?.[1]?.validation && !/^[0-9\b]+$/.test(strVal)) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: validations[1].error_message });
     }
     if (validations?.[3]?.validation) {
        if (strVal !== strVal.toLowerCase()) {
           ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email must be all lowercase letters' });
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(strVal)) {
           ctx.addIssue({ code: z.ZodIssueCode.custom, message: validations[3].error_message });
        }
     }
     if (validations?.[2]?.validation && !/^[0-9a-zA-Z ]*$/.test(strVal)) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: validations[2].error_message });
     }
     if (validations?.[4]?.validation && !/^[0-9]{10}$/.test(strVal)) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: validations[4].error_message || 'Enter valid mobile number' });
     }
     if (validations?.[5]?.validation && validations[4]) {
         const num = Number(val);
         if (validations[4].min !== undefined && validations[4].max !== undefined) {
             if (num >= validations[4].min && num <= validations[4].max) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: validations[4].error_message });
             } 
         }
     }

     const valLength = (typeof val === 'string' || Array.isArray(val)) ? val.length : String(val).length;
     if (validations?.[10]?.validation && valLength > (validations[10].maxLength || 200)) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Length of ${validations[10].maxLength || 200} characters reached` });
     }

     if (fieldName) {
         const lowerName = fieldName.toLowerCase();
         if (lowerName.includes('first_name') || lowerName.includes('last_name') || lowerName.includes('parents first name') || lowerName.includes('parents last name')) {
            if (!/^[a-zA-Z ]*$/.test(strVal)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Only English letters are allowed' });
            if (strVal.length > 50) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Length of 50 characters reached' });
         }
         
         if (lowerName.includes('dob') || lowerName.includes('date_of_birth')) {
             const selected = new Date(val as string | number);
             const today = new Date();
             today.setHours(0,0,0,0);
             if (selected > today) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Date of birth cannot be in the future' });
         }
         
         if (lowerName.includes('adhar_no') || lowerName.includes('aadhar')) {
             if (!/^\d*$/.test(strVal)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Aadhar number must be numeric' });
             if (strVal.length > 12) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Length of 12 characters reached` });
         }
         
         if (lowerName.includes('pan')) {
             if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(strVal.toUpperCase())) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid PAN number' });
         }
         
         if (
            lowerName.includes('medical_details') || lowerName.includes('reason') || lowerName.includes('description') || lowerName.includes('history') ||
            lowerName.includes('details') || lowerName.includes('birth_place') || lowerName.includes('school_name') || lowerName.includes('organisation_name') ||
            lowerName.includes('organisation_address') || lowerName.includes('street') || lowerName.includes('landmark') || lowerName.includes('bank_details')
         ) {
            if (strVal.length >= 200) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Length of 200 characters reached' });
         }
     }
  });
  
  return schema;
};

export const generateFormSchema = (fields: any[], isFieldVisible: (f: any) => boolean) => {
  const shape: Record<string, z.ZodTypeAny> = {};
  fields.forEach(field => {
     if (isFieldVisible(field)) {
        shape[field.input_field_name] = buildFieldSchema(field.validations, field.input_field_name);
     }
  });
  return z.object(shape);
};

export const checkValidationsZod = (validations: any[], value: any, fieldName?: string) => {
   const schema = buildFieldSchema(validations, fieldName || '');
   const result = schema.safeParse(value);
   if (!result.success) {
      return result.error.issues[0]?.message || 'Validation error';
   }
   return '';
};
