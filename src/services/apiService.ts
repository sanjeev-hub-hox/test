import { getLocalStorageVal, getToken } from '../utils/helper'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { AutoLogoutUser, logoutUserData } from '../services/authService'
import { toast } from 'react-hot-toast'
import { getSession } from 'next-auth/react'
 
const serviceURLList: any = {
  marketing: process.env.NEXT_PUBLIC_API_BASE_URL,
  admin: process.env.NEXT_PUBLIC_ADMIN_PANEL_BASE_URL,
  mdm: process.env.NEXT_PUBLIC_MDM_BASE_URL,
  finance: process.env.NEXT_PUBLIC_FINANCE_API_BASE_URL,
  transport: process.env.NEXT_PUBLIC_TRANSPORT_API_URL,
  communication: process.env.NEXT_PUBLIC_COMMUNICATION_API_URL
}
const token = getToken()
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
  authToken?: string
): Promise<any> {
  try {
    let url = serviceURL ? serviceURLList[serviceURL] + endpoint : axiosInstance.defaults.baseURL + endpoint
 
    if (authToken) {
      url += (url.includes('?') ? '&' : '?') + 'platform=app'
    }
    //const token = getToken()
    const session:any = await getSession();
     console.log('SESSION-TOKEN',session)
    const token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJOV01uNDNhNmxPcnU4Y1Z2Nkp5dUdXUUtyYzdIOXVJQnRvaThjUHdYeWhnIn0.eyJleHAiOjE3NjYyNTc5ODEsImlhdCI6MTc2NjI1NjE4MSwianRpIjoiYmViMjFlMWQtMGQ2OC00MTUzLTliZTctOTRmY2RhZTZkY2EyIiwiaXNzIjoiaHR0cHM6Ly9nYXRld2F5LmFtcGVyc2FuZGdyb3VwLmluL3JlYWxtcy9hbXBlcnNhbmQtaW50ZXJuYWwiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiOTZlZGVlM2ItMTIxMC00NjZlLTg2MzQtOGQ2OTFmYjAwYjBkIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiaHViYmxlb3Jpb24tYWRtaW4tcGFuZWwiLCJzZXNzaW9uX3N0YXRlIjoiN2ZmYjBlZGYtM2MxYi00NDQ4LThhOWMtNWI5ODkwZmE4YmRlIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwczovL2FkbWluLXBhbmVsLWh1YmJsZW9yaW9uLmh1YmJsZWhveC5jb20iXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtYWQtaW50cmVncmF0aW9uLXRlc3QiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIGN1c3RvbVRva2VuU2NvcGUiLCJzaWQiOiI3ZmZiMGVkZi0zYzFiLTQ0NDgtOGE5Yy01Yjk4OTBmYThiZGUiLCJyZWFsbUZsYWciOiJpbnRlcm5hbCIsInBob25lTnVtYmVyIjoiOTY5OTg5MTQyMCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibWFuYWdlciI6IkNOPVJvaGFuIFRoYWxlLE9VPVRlc3QgT1UsT1U9VXNlcnMsT1U9SVQsT1U9VkVSVEVYLERDPXZpYmd5b3JzY2hvb2xzLERDPWNvbSIsIm5hbWUiOiJQUzEiLCJkZXNpZ25hdGlvbiI6IlRlc3QgU1NPIiwicHJlZmVycmVkX3VzZXJuYW1lIjoicHMxIiwiZ2l2ZW5fbmFtZSI6IlBTMSIsImVtYWlsIjoicHMxQHZnb3Mub3JnIn0.fYSlir_p5M3Oyoar3GvGNF-nSMCYxAC-ZvFVLStI28UwLTIG-yqlwuGRGVaIjmMSImfG1cLtgFBzKXS-WkSbx-UTozwcALDu3jw9esxJqHVMX7ZOqA-f_aKijt_2XUuT44SeVSuMHrTVPeNo-B0ly5B_RSGnILYQImfnM1rviaCCWtz5Q_K2c42T8gE_zYCV_sKGaF3cCcR9VJWd8BpRO9OSSfjN4whUvSCubhIPneApQ7rxnfN57iy1W7-B7pp41anGuGlGg-EyCnYY_vSejlUyGSjOT_hOkonGfAh5GwdOLCWVSd9KEwuvF5jeAdDqFOZ0ujCTSUYBf-EI3AkHzA"
    const apiHeaders = {
      ...(serviceURL === 'mdm' && { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}` }),
      ...(token && serviceURL != 'mdm' && !authToken && { Authorization: `Bearer ${token}` }),
      ...headers,
      ...(authToken && serviceURL != 'mdm' && { Authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJOV01uNDNhNmxPcnU4Y1Z2Nkp5dUdXUUtyYzdIOXVJQnRvaThjUHdYeWhnIn0.eyJleHAiOjE3NjYyNTc5ODEsImlhdCI6MTc2NjI1NjE4MSwianRpIjoiYmViMjFlMWQtMGQ2OC00MTUzLTliZTctOTRmY2RhZTZkY2EyIiwiaXNzIjoiaHR0cHM6Ly9nYXRld2F5LmFtcGVyc2FuZGdyb3VwLmluL3JlYWxtcy9hbXBlcnNhbmQtaW50ZXJuYWwiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiOTZlZGVlM2ItMTIxMC00NjZlLTg2MzQtOGQ2OTFmYjAwYjBkIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiaHViYmxlb3Jpb24tYWRtaW4tcGFuZWwiLCJzZXNzaW9uX3N0YXRlIjoiN2ZmYjBlZGYtM2MxYi00NDQ4LThhOWMtNWI5ODkwZmE4YmRlIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwczovL2FkbWluLXBhbmVsLWh1YmJsZW9yaW9uLmh1YmJsZWhveC5jb20iXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtYWQtaW50cmVncmF0aW9uLXRlc3QiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIGN1c3RvbVRva2VuU2NvcGUiLCJzaWQiOiI3ZmZiMGVkZi0zYzFiLTQ0NDgtOGE5Yy01Yjk4OTBmYThiZGUiLCJyZWFsbUZsYWciOiJpbnRlcm5hbCIsInBob25lTnVtYmVyIjoiOTY5OTg5MTQyMCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibWFuYWdlciI6IkNOPVJvaGFuIFRoYWxlLE9VPVRlc3QgT1UsT1U9VXNlcnMsT1U9SVQsT1U9VkVSVEVYLERDPXZpYmd5b3JzY2hvb2xzLERDPWNvbSIsIm5hbWUiOiJQUzEiLCJkZXNpZ25hdGlvbiI6IlRlc3QgU1NPIiwicHJlZmVycmVkX3VzZXJuYW1lIjoicHMxIiwiZ2l2ZW5fbmFtZSI6IlBTMSIsImVtYWlsIjoicHMxQHZnb3Mub3JnIn0.fYSlir_p5M3Oyoar3GvGNF-nSMCYxAC-ZvFVLStI28UwLTIG-yqlwuGRGVaIjmMSImfG1cLtgFBzKXS-WkSbx-UTozwcALDu3jw9esxJqHVMX7ZOqA-f_aKijt_2XUuT44SeVSuMHrTVPeNo-B0ly5B_RSGnILYQImfnM1rviaCCWtz5Q_K2c42T8gE_zYCV_sKGaF3cCcR9VJWd8BpRO9OSSfjN4whUvSCubhIPneApQ7rxnfN57iy1W7-B7pp41anGuGlGg-EyCnYY_vSejlUyGSjOT_hOkonGfAh5GwdOLCWVSd9KEwuvF5jeAdDqFOZ0ujCTSUYBf-EI3AkHzA` })
    }
 
    if (authToken) {
      data = data ?? {} // Initialize `data` as an empty object if it's undefined
      data.platform ??= 'app' // Add `platform` key if it doesn't exist
    }
    console.log('authToken')
    console.log(authToken)
    console.log(apiHeaders)
 
    const config: AxiosRequestConfig = {
      method: method,
      url: url,
      data: data,
      headers: apiHeaders,
      params: params
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
  return httpRequest('POST', `${params.url}`, params?.data, params.headers, null, params?.serviceURL, params?.authToken)
}
 
export const getRequest = async (params: any) => {
  return httpRequest('GET', `${params.url}`, null, params.headers, params?.params, params.serviceURL, params?.authToken)
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