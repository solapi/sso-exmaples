# SSO 튜토리얼

### SSO란?
싱글사인온(Single Sign-On, SSO)은 하나의 로그인 인증 수단을를 사용하여  
사이트에서 제공하는 여러 어플리케이션 혹은 API에 접근할 수 있는 중앙화된 세션 및 사용자 인증 서비스입니다.

### 솔라피에서 SSO란?
솔라피의 마이사이트 생성 기능을 이용하여 앱 아이디를 발급 받고,  
앱 아이디를 이용하여 SSO 토큰을 발급받아 API를 이용하는 것을 말합니다.

아래는 SSO 토큰을 이용하여 솔라피 API를 호출하는 방법 그리고 로그인 처리까지 시키는 방법입니다.


# SSO 토큰으로 솔라피 API 호출 방법 
[예제코드는 솔라피 SSO Examples 코드를 참조하였습니다.](https://github.com/solapi/sso-exmaples/blob/main/node/examples.js)

### 1. 마이사이트 만들기 & 앱 아이디 발급
SSO를 이용하기 위해서는 솔라피의 마이사이트가 필요합니다.  
마이사이트의 **앱 아이디**를 이용하여 SSO 토큰을 만들 수 있기 때문입니다.  
'마이사이트 생성' 버튼을 클릭하여 생성할 수 있습니다.

![image](https://user-images.githubusercontent.com/4575603/200463085-6fc19bba-0091-4fe3-9c6b-5378691dcd5a.png)

마이사이트 이름 그리고 발신 이메일을 작성하신 후 대표주소를 설정한 뒤 아래쪽의 '마이사이트 생성' 버튼을 클릭하면 생성이 완료됩니다.  
로고나 컬러를 원하시는 대로 변경하실 수 있습니다.

![image](https://user-images.githubusercontent.com/4575603/201793620-c23c2d20-c5ca-475e-8b08-c65ee946c5c6.png)

생성된 마이사이트 오른쪽에 있는 '마이사이트 관리'를 클릭하면 관리 페이지로 갈 수 있습니다.  
이곳에서 마이사이트에 가입한 회원들을 보고 관리할 수 있습니다.

![image](https://user-images.githubusercontent.com/4575603/201792766-ecbc2143-ca1b-42fd-af04-938a8a0ba042.png)

'마이사이트 관리' 버튼을 클릭하여 들어가면 보이는 위쪽 주소창에 'mysite/' 뒷 부분에 적혀있는 것이 **앱 아이디** 입니다.

![image](https://user-images.githubusercontent.com/4575603/201793333-ac52fa56-f819-428e-a775-3271a3720300.png)



### 2. 관리자에게 IP 허용 요청
화면 오른쪽 아래 상담창에 마이사이트의 앱아이디와 함께 관리자에게 IP 허용을 요청합니다.  
허용이된 IP에서만 SSO 토큰을 이용한 API 사용이 가능합니다.  

![image](https://user-images.githubusercontent.com/4575603/201794545-08e03acb-6b37-438c-8695-17f458732473.png)




### 3. 생성된 앱 아이디로 SSO 토큰 발급
받은 앱 아이디로 SSO 토큰 발급을 요청합니다.

```
[Requset]
const moment = require('moment-timezone')
const { HmacSHA256 } = require('crypto-js')
const apiKey = '##API_KEY##'
const apiSecret = '##API_SECRET##'

// API KEY, API SECRET 으로 인증값 만들어 헤더에 설정
const getApiKeyAuthHeader = () => {
  const date = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
  const salt = (Math.random() + 1).toString(36).substring(7) // 랜덤한 문자열
  const hmacData = date + salt
  const signature = HmacSHA256(hmacData, apiSecret).toString()
  return { Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}` }
}

/** Step 1. 앱 아이디와 가입할 회원정보를 이용하여 SSO Token 발급 */
const getSSOToken = async () => {
  const form = {
    appId: '##APP_ID##', // 발급받은 앱 아이디
    email: '##EMAIL##', // 회원가입에 사용될 이메일 주소
    password: '##PASSWORD##', // 회원가입에 사용될 암호
    customerKey: '##MEMBER_CUSTOMER_KEY##' // 마이사이트에서 사용할 회원 구분 키
  }
  const result = await request({
    method: 'POST',
    uri: `https://api.solapi.com/appstore/v2/sso/connect`,
    form,
    json: true,
    // OAuth2 or API Key로 된 인증 수단 값, 자세한 내용은 https://developers.solapi.dev/references/authentication을 참고해주세요
    headers: getApiKeyAuthHeader()
  })
  console.log(result)
}
getSSOToken()
```

```
[Response]
{
  ssoToken: 'eyJhbGciOiJIUzI1NiIsInR53216IkpXVCJ9.eyJhcHBJZCI6Ik123U5zQUUzYUp5QiIsIm1lbWJlcklkIjoiTUVNemNhZHo0WmVoUGkiLCJhY2NvdW50SWQiOiIyMjExMDgxODA5NzEwMiIsImlhdCI6MTY2Nzg4MzY5N30.rKGE_xa1ONf5vXn14wI23nlNLeNVst0gEJ_b9E9rReI'
}
```



### 4. 발급받은 SSO 토큰으로 API 요청
발급받은 SSO 토큰으로 솔라피 API 이용이 가능합니다.
```
[Request]
const request = require('request-promise')

const getMemberInfo = async () => {
  const result = await request({
    method: 'GET',
    uri: `https://api.solapi.com/users/v1/member`,
    json: true,
    // SSO 토큰 값 설정
    headers: { Authorization: `sso ##SSO TOKEN ##` }
  })
  console.log(result)
}
getMemberInfo()
```

```
[Response]
{
  name: 'user',
  phoneNumber: null,
  extraPhoneNumbers: [],
  status: 'ACTIVE',
  selectedAccountId: '22110348097102',
  betaMicroservices: null,
  appId: 'NGeNsAE334yB',
  activeDeviceAuth: false,
  isTrial: false,
  memberId: 'MEMzc34z4ZehPi',
  email: 'user@nurigo.net',
  devices: [],
  loginSessions: [],
  dateCreated: '2022-11-08T05:01:37.097Z',
  dateUpdated: '2022-11-08T05:01:37.166Z'
}
```


# SSO 토큰으로 마이사이트 로그인 방법

### 마이사이트 로그인 & 페이지 이동
SSO 토큰을 쿼리값으로 아래 주소로 보내면 로그인이 완료된채로 보내주신 리다이렉트 주소로 이동합니다.
처음에는 접속시 아래 이미지 처럼 본인인증을 해주셔야합니다.

![image](https://user-images.githubusercontent.com/4575603/202633460-49f42eba-38cf-4e06-bf1b-3766173dc09d.png)



```
[메인페이지로 이동]
https://api.solapi.com/appstore/v2/sso/connect-homepage?redirecturi=#{마이사이트주소}/dashboard
```
![image](https://user-images.githubusercontent.com/4575603/202633585-cc5cfd01-c4b1-4592-a83e-d3f27153da75.png)


```
[발신번호로 이동]
https://api.solapi.com/appstore/v2/sso/connect-homepage?redirecturi=#{마이사이트주소}/senderids
```
![image](https://user-images.githubusercontent.com/4575603/202634168-070adc80-589e-4da8-8976-658822ee055d.png)


```
[충전페이지로 이동]
https://api.solapi.com/appstore/v2/sso/connect-homepage?redirecturi=#{마이사이트주소}/balance
```
![image](https://user-images.githubusercontent.com/4575603/202634622-67451921-ff7e-4bad-bf07-1a1af10c4674.png)





---


## [관련문서]
[Site](http://solapi.com) |
[API Refernces Docs](https://developers.solapi.dev/references/appstore/connectToken) |

