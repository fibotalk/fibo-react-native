// import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorage } from 'react-native';
const conf = {
  settings: (gid => `__ft__settings__:${gid}`),
};

export default class Fibotalk {

  static #xhr = new XMLHttpRequest();
  static #storage = {};
  static #device = {};
  static fibotalkSettings;
  appid;

  /**
   * Get storage from local storage.
   * call init()
   * @param {*} appid 
   * @returns 
   */
  constructor(appid) {
    if (!appid)
      return null;
    this.appid = appid;
    this.#storage("get").then(resp => {
      Fibotalk.#storage = resp || Fibotalk.#storage;
      this.#init();
    }).catch(error => {
      console.error(error);
    });
  }

  /**
   * Get uid or create a new uid.
   * Get session details:
   *    - If present, check for changing session conditions.
   *      - If changing, gen new session.
   *    - If not present, gen new session.
   * Get device info and store it.
   */
  #init() {

  }

  /**
   * Gen new sess (id, start time).
   * Store in #storage and in AsyncStorage.
   */
  #genSession() {

  }

  async #storage(action, val) {
    switch (action) {
      case "set":
        return await AsyncStorage.setItem(conf.settings(this.appid), val);
      case "get":
      default:
        return await AsyncStorage.getItem(conf.settings(this.appid));
    }
  }

  async #request(apiObj) {
    let xhr = Fibotalk.#xhr;
    return new Promise(function (resolve, reject) {
      if (!(apiObj.url && apiObj.method))
        return reject("URL not provided");
      let url = apiObj.url;
      if (apiObj.qs && isObject(apiObj.qs)) {
        url += '?';
        for (let i in apiObj.qs)
          url += i + '=' + apiObj.qs[i] + '&';
        url = url.slice(0, -1);
      }
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          let status = xhr.status;
          let resp = "";
          try {
            resp = JSON.parse(xhr.responseText);
          } catch (error) {
            return reject("Bad response");
          }
          if (status === 0 || (status >= 200 && status < 400)) {
            return resolve(resp.data);
          } else {
            return reject(resp.msg || status);
          }
        }
      };
      xhr.open(apiObj.method, url);
      xhr.setRequestHeader("Content-Type", "application/json");
      if (apiObj.headers && isObject(apiObj.headers)) {
        for (let i in apiObj.headers) {
          if (i && apiObj.headers[i])
            xhr.setRequestHeader(i, apiObj.headers[i]);
        }
      }
      let body = {};
      if (apiObj.json)
        body = apiObj.json;
      xhr.send(JSON.stringify(body));
    });
  }

  /**
   * Create an event and send to BE
   * Instantly send events
   * @param {*} event : event name
   * @param {*} dimensions : event dimensions object
   */
  setEvent(event, dimensions) {}
}