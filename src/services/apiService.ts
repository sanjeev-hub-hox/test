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
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJOV01uNDNhNmxPcnU4Y1Z2Nkp5dUdXUUtyYzdIOXVJQnRvaThjUHdYeWhnIn0.eyJleHAiOjE3NzczMTE0NDgsImlhdCI6MTc3NzMwOTY0OCwianRpIjoiMzY0ZTIyZmMtOWJlNy00NGQ2LWEzNGYtYWFmOGQ4ZWVjMDA2IiwiaXNzIjoiaHR0cHM6Ly9nYXRld2F5LmFtcGVyc2FuZGdyb3VwLmluL3JlYWxtcy9hbXBlcnNhbmQtaW50ZXJuYWwiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiOTZlZGVlM2ItMTIxMC00NjZlLTg2MzQtOGQ2OTFmYjAwYjBkIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiaHViYmxlb3Jpb24tYWRtaW4tcGFuZWwiLCJzZXNzaW9uX3N0YXRlIjoiNjQ4YmIyOTQtZjY3ZC00OTFmLTg2M2MtNDY3NTE0MmRkNDNjIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwczovL2FkbWluLXBhbmVsLWh1YmJsZW9yaW9uLmh1YmJsZWhveC5jb20iXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtYWQtaW50cmVncmF0aW9uLXRlc3QiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIGN1c3RvbVRva2VuU2NvcGUiLCJzaWQiOiI2NDhiYjI5NC1mNjdkLTQ5MWYtODYzYy00Njc1MTQyZGQ0M2MiLCJyZWFsbUZsYWciOiJpbnRlcm5hbCIsInBob25lTnVtYmVyIjoiOTY5OTg5MTQyMCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibWFuYWdlciI6IkNOPVJvaGFuIFRoYWxlLE9VPUxlZnQgRW1wbG95ZWUsT1U9VmliZ3lvcixEQz12aWJneW9yc2Nob29scyxEQz1jb20iLCJuYW1lIjoiUFMxIiwiZGVzaWduYXRpb24iOiJUZXN0IFNTTyIsInByZWZlcnJlZF91c2VybmFtZSI6InBzMSIsImdpdmVuX25hbWUiOiJQUzEiLCJlbWFpbCI6InBzMUB2Z29zLm9yZyJ9.M-Cmu_nzhStRIdrlPiaFB4hoBmSy9vGXPCN6NlDAhvPlIwIKFHHIzu64FZeesolBh9XtAWA2mne9UI-nA4-KscTbTtCCH24nb3ha2BvxqrHWESzlruwszkaNG5aMxpZqZF6l_5qMDG09mECrWaUkjwphBuN1_k135xHttF53uRDiQLjxwb5szSIh9ltvZNCeJlCSnCGETB2WCC7f3Lh7egucOzOL954xBbSpUbQ0IdFBlt1kA7a2p_DJ1s6rZKRAidrFXZ8uHjxa74ods5MseuYcgh5Eci_7dEok0tz00mloBRBhgew5AV5k9lKpVR3IuJM4XWLPOjTIqTDYOQjI8w'
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
