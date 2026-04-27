import React from 'react'
import { Grid, Typography, Divider } from '@mui/material'

interface FormSectionProps {
  title: string
  children: React.ReactNode
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => {
  return (
    <Grid item container xs={12} spacing={5}>
      {title !== 'null' && (
        <Grid item xs={12} md={12}>
          <Typography variant='h6' color={'text.primary'} sx={{ lineHeight: '22px' }}>
            {title}
          </Typography>
        </Grid>
      )}
      <Grid item xs={12}>
        <Divider />
      </Grid>
      {children}
    </Grid>
  )
}

export default FormSection
