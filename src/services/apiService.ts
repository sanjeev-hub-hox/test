import { getLocalStorageVal } from '../utils/helper'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { logoutUserData } from '../services/authService'
import { toast } from 'react-hot-toast'
import { getSession } from 'next-auth/react'

const serviceURLList: any = {
  marketing: process.env.NEXT_PUBLIC_API_BASE_URL,
  admin: process.env.NEXT_PUBLIC_ADMIN_PANEL_BASE_URL,
  mdm: process.env.NEXT_PUBLIC_MDM_BASE_URL,
  finance: process.env.NEXT_PUBLIC_FINANCE_API_BASE_URL,
  transport: process.env.NEXT_PUBLIC_TRANSPORT_API_URL,
  communication: process.env.NEXT_PUBLIC_COMMUNICATION_API_URL,
  api: process.env.NEXT_PUBLIC_ADMIN_PANEL_BASE_URL
}
const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_BASE_URL}`

  // headers: {
  //   ...(token && { Authorization: `Bearer ${token.accessToken}` })
  // }
})

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'PATCH'

const handleSignout = async () => {
  // const storageToken = localStorage.getItem('token')
  const idToken = getLocalStorageVal('idToken')
  const userSession = {
    idToken
  }
  const path = logoutUserData(userSession)
  if (path && path.url) {
    // window.open(path.url, '_self')
    window.open('/', '_self')
  } else {
    window.open('/', '_self')
  }
}

const handleResponseError = (error: any) => {
  const res = {
    data: null,
    error: null
  }

  switch (error?.response?.status) {
    case 400:
      toast.error('Error - Bad Request')
      break
    case 401:
      toast.error('Unauthenticated Logging out')
      handleSignout()
      break
    case 403:
      toast.error('Unauthorized')
      window.location.href = '/403'
      break
    case 500:
      toast.error('There Is An Internal Error')
      break
    default:
      toast.error('There Is An Internal Error')
  }

  if (error?.response?.data) {
    res.error = error.response.data
  } else {
    res.error = error
  }

  return res
}

async function httpRequest(
  method: HttpMethod,
  endpoint: string,
  data?: any,
  headers: Record<string, string> = {},
  params?: any,
  serviceURL?: string,
  authToken?: string,
  responseType?: string
): Promise<any> {
  try {
    let url = serviceURL ? serviceURLList[serviceURL] + endpoint : axiosInstance.defaults.baseURL + endpoint

    if (authToken) {
      url += (url.includes('?') ? '&' : '?') + 'platform=app'
    }
    //const token = getToken()
    const session: any = await getSession()
    const token = session?.accessToken
    const apiHeaders = {
      ...(serviceURL === 'mdm' && { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}` }),
      ...(token && serviceURL != 'mdm' && !authToken && { Authorization: `Bearer ${token}` }),
      ...headers,
      ...(authToken && serviceURL != 'mdm' && { Authorization: `Bearer ${authToken}` })
    }

    if (authToken) {
      data = data ?? {} // Initialize `data` as an empty object if it's undefined
      data.platform ??= 'app' // Add `platform` key if it doesn't exist
    }

    const config: AxiosRequestConfig = {
      method: method,
      url: url,
      data: data,
      headers: apiHeaders,
      params: params,
      responseType: responseType as any
    }
    const response: AxiosResponse = await axios(config)
    const jsonData = response.data

    return jsonData

    // return (res.data = response.data)
  } catch (err: any) {
    return handleResponseError(err)
  }
}

export const postRequest = async (params: any) => {
  return httpRequest(
    'POST',
    `${params.url}`,
    params?.data,
    params.headers,
    null,
    params?.serviceURL,
    params?.authToken,
    params?.responseType
  )
}

export const getRequest = async (params: any) => {
  return httpRequest('GET', `${params.url}`, null, params.headers, params?.params, params.serviceURL, params?.authToken)
}

export const getBlobRequest = async (params: any) => {
  return httpRequest('GET', `${params.url}`, null, params.headers, params?.params, params.serviceURL, params?.authToken, 'blob')
}

export const deleteRequest = async (params: any) => {
  return httpRequest('DELETE', `${params.url}`, null, params.headers, null, params?.serviceURL, params?.authToken)
}

export const putRequest = async (params: any) => {
  return httpRequest('PUT', `${params.url}`, params.data, params.headers, null, params?.serviceURL, params?.authToken)
}
// Nikhil
export const patchRequest = async (params: any) => {
  return httpRequest('PATCH', `${params.url}`, params.data, params.headers, null, params?.serviceURL, params?.authToken)
}
