const { HmacSHA256 } = require('crypto-js')
const request = require('request-promise')
const qs = require('qs')
const moment = require('moment-timezone')
const host = 'https://api.solapi.com/'

/**
 * 아래부터 차례로 SSO 토큰 발급과 SSO 토큰을 이용한 로그인, API 사용 방법을 설명합니다.
 *
 * [관련 문서]
 * 튜토리얼 문서: https://github.com/solapi/sso-exmaples#readme
 * API Reference: https://developers.solapi.dev/references/appstore
 */

/** 인증 */

// API KEY, API SECERT을 입력해주세요.
const apiKey = '##API_KEY##'
const apiSecret = '##API_SECRET##'

// 마이사이트 앱 아이디를 입력해주세요.
// ssoToken 값은 getSSOToken()을 실행하여 나오는 결과값을 입력해주시면 됩니다.
const appId = '##APP_ID##'
const ssoToken = '##SSO_TOKEN##'

// 마이사이트 주소를 입력해주시면 됩니다. 예) https://mystie.solapi.com
const mysiteUri = '##마이사이트 주소##'

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

/** 인증 END */


/** SSO 토큰 발급 */

// 앱 아이디와 가입할 회원정보를 이용하여 SSO Token 발급
const getSSOToken = async () => {
  const form = {
    appId, // 회원가입 및 SSO Token의 주체가 되는 앱 아이디
    email: '##EMAIL##', // 회원가입에 사용될 이메일 주소
    password: '##PASSWORD##', // 회원가입에 사용될 암호
    customerKey: '##CUSTOM_KEY##' // 회원 구분 키 (이미 가입된 회원일 경우 사용되지 않습니다.)
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

/** SSO 토큰 발급 END */


/** SSO 토큰으로 API 요청 */

// Case 1. SSO 토큰으로 API 요청
// SSO 토큰을 인증방식으로 사용시 IP 허용이 필요합니다.
// 사이트에서 관리자에게 문의해주세요.
const getMemberInfo = async () => {
  const result = await request({
    method: 'GET',
    uri: `${host}users/v1/member`,
    json: true,
    headers: SSOTokenHeader
  })
  console.log(result)
}

/** SSO 토큰으로 API 요청 END */


/** SSO 토큰으로 로그인 & 리다이렉트 */

// 해당 요청시 SSO 토큰으로 마이사이트에 로그인 후 설정하신 redirectUri로 redirect됩니다.
const mysiteLogin = async () => {
  const result = await request({
    method: 'GET',
    uri: `${host}/api/appstore/v2/sso/connect-homepage?redirectUri=${mysiteUri}&ssoToken=${ssoToken}`,
    json: true,
    headers: SSOTokenHeader
  })
  console.log(result)
}

/** SSO 토큰 사용 END */


/** SSO 토큰으로 페이지로 이동 */

// 메인 페이지로 이동
console.log(`${mysiteUri}/api/appstore/v2/sso/connect-homepage?redirectUri=${mysiteUri}/dashboard&ssoToken=${ssoToken}`)

// 발신번호 관리 페이지로 이동 (인증이 되어있지 않으면 인증 폼이 뜹니다.
console.log(`${mysiteUri}/api/appstore/v2/sso/connect-homepage?redirectUri=${mysiteUri}/senderids&ssoToken=${ssoToken}`)

/** SSO 토큰으로 페이지로 이동 END */
