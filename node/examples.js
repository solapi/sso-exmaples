const { HmacSHA256 } = require('crypto-js')
const request = require('request-promise')
const qs = require('qs')
const moment = require('moment-timezone')
const host = 'https://api.solapi.net/'

/** API KEY, API SECERT을 입력해주세요. */
const apiKey = '##API_KEY##'
const apiSecret = '##API_SECERT##'

// 마이사이트 앱 아이디
const appId = '##APP_ID##'
const ssoToken = '##SSO_TOKEN##'

// API KEY, API SECRET 으로 인증값 만들어 헤더에 설정
const getApiKeyAuthHeader = () => {
  const date = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
  const salt = (Math.random() + 1).toString(36).substring(7) // 랜덤한 문자열
  const hmacData = date + salt
  const signature = HmacSHA256(hmacData, apiSecret).toString()
  return { Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}` }
}

// 넘어온 SSO 토큰값을 헤더에 설정
const SSOTokenHeader = { Authorization: `sso ${ssoToken}` }

/** 앱 아이디와 가입할 회원정보를 이용하여 SSO Token 발급 */
const getSSOToken = async () => {
  const form = {
    appId, // 회원가입 및 SSO Token의 주체가 되는 앱 아이디
    email: '##USER_EMAIL##', // 회원가입에 사용될 이메일 주소
    password: '##PASSWORD##', // 회원가입에 사용될 암호
    customerKey: '##MEMBER_CUSTOMER_KEY##' // 회원 구분 키 (이미 가입된 회원일 경우 사용되지 않음)
  }
  const result = await request({
    method: 'POST',
    uri: `${host}appstore/v2/sso/connect`,
    form,
    json: true,
    headers: getApiKeyAuthHeader()
  })
  console.log(result)
}
// getSSOToken()

/** Case 1) SSO 토큰으로 API 요청 */
// SSO 토큰을 인증방식으로 사용시 IP 허용이 필요, 사이트에서 관리자에게 문의.
const getMemberInfo = async () => {
  const result = await request({
    method: 'GET',
    uri: `${host}users/v1/member`,
    json: true,
    headers: SSOTokenHeader
  })
  console.log(result)
}
// getMemberInfo()

/** Case 2) 발급받은 SSO 토큰으로 Access Token 발급 */
// SSO 토큰을 인증방식으로 사용시 IP 허용이 필요, 사이트에서 관리자에게 문의.
// 발급받은 SSO 토큰으로 마이사이트에 로그인
const mysiteLogin = async () => {
  const form = {
    redirectUri: 'https://nurigo.net'
  }
  const result = await request({
    method: 'POST',
    uri: `${host}appstore/v2/sso/issue-oauth2-token`,
    json: true,
    headers: SSOTokenHeader
  })
  console.log(result)
}
// mysiteLogin()
