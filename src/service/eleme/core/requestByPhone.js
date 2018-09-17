const axios = require('axios-https-proxy-fix');
const proxyServer = require('../../proxy-server');
const logger = require('../../../util/logger')('service/eleme');

const origin = 'https://h5.ele.me';
const referer = `${origin}/hongbao/`;

// 接码平台TOKEN
const token = '11111111111';
// 接码平台api接口，自行选择平台，对应修改下面的异步请求
const url = 'http://api.....';

// 通过手机号登录获取cookie
module.exports = class RequestByPhone {
  constructor({cookie}) {
    this.cookie = cookie;
    this.http = axios.create({
      baseURL: origin,
      withCredentials: true,
      timeout: 10000,
      headers: {
        origin,
        referer,
        'content-type': 'text/plain;charset=UTF-8',
        'user-agent':
          'Mozilla/5.0 (Linux; Android 7.0; MIX Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/6.2 TBS/044004 Mobile Safari/537.36 V1_AND_SQ_7.5.0_794_YYB_D QQ/7.5.0.3430 NetType/WIFI WebP/0.3.0 Pixel/1080',
        pragma: 'no-cache',
        cookie: this.cookie
      },
      proxy: proxyServer()
    });
  }

  // 获取接码平台手机号
  async getPhone() {
    const data = await axios({
      method: 'get',
      url,
      params: {
        action: 'getmobile',
        token,
        itemid: 352,
        // 非必须,可指定地区
        province: 440000
      }
    });

    return data.data;
  }

  // 根据手机号获取validate_token
  async getToken({mobile, captcha_value = '', captcha_hash = ''}) {
    const {data = {}} = await this.http.post(`/restapi/eus/login/mobile_send_code`, {
      mobile,
      captcha_value,
      captcha_hash
    });
    logger.info('手机号的validate_token', data);
    return data;
  }

  // 如没有返回validate_token,释放号码
  async delPhone(mobile) {
    const data = await axios({
      method: 'get',
      url,
      params: {
        action: 'release',
        token,
        itemid: 352,
        mobile
      }
    });
    logger.info('释放成功');
    return data;
  }

  // 根据validate_token获取验证码
  async getCode(mobile) {
    const data = await axios({
      method: 'get',
      url,
      params: {
        action: 'getsms',
        token,
        itemid: 352,
        mobile
      }
    });
    logger.info('获取短信...', data.data);
    return data.data;
  }

  // 根据validate_token，mobile，code登录
  async loginByPhone({mobile, validate_code, validate_token}) {
    const {data, headers} = await this.http.post(`/restapi/eus/login/login_by_mobile`, {
      mobile,
      validate_code,
      validate_token
    });
    logger.info('手机登录后的data', data);
    logger.info('手机登录后的header', headers);
    // const sid = headers["set-cookie"].find(
    //   c => c.split("; ")[0].indexOf("SID") === 0
    // );
    // if (sid) {
    //   this.cookie.sid = sid.split("; ")[0].split("=")[1];
    // }
    return {data, headers};
  }

  // 登录成功后绑定手机
  async bindPhone(phone, sign, openid, sid) {
    const {data} = await this.http.post(
      `/restapi/marketing/hongbao/weixin/${openid}/change`,
      {
        phone,
        sign
      },
      {
        headers: {
          cookie: sid
        }
      }
    );
    return data;
  }
};
