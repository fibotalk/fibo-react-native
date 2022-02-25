// import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorage } from 'react-native';
const conf = {
  settings: (gid => `__ft__settings__:${gid}`),
  sidLen: 30,
  uidLen: 30,
};

export default class Fibotalk {

  static #xhr = new XMLHttpRequest();
  #storage = {};
  static #device = {};
  fibotalkSettings;
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
    this.#store("get").then(resp => {
      this.#storage = resp || this.#storage;
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
    let newSess = false;
    if (!this.#storage.uid) {
      this.#storage.uid = Fibotalk.#genId(conf.uidLen);
      newSess = true;
    }
    if (!newSess && !this.#storage.session)
      newSess = true;
    if (!newSess && this.#checkSessionChange())
      newSess = true;
    if (newSess)
      return this.#genSession().then(resp => {
        Fibotalk.#initSystemData();
      }).catch(err => {
        console.error("Fibotalk error: ", err);
        this.#exit();
      });
    Fibotalk.#initSystemData();
  }

  /**
   * Get device info and store it.
   */
  static #initSystemData() {}

  /**
   * Check whether the current running session is changing
   * 1. Check time from last event.
   * 2. Check number of events in session.
   * 3. Check for user change.
   */
  #checkSessionChange() {
    try {
      
    } catch (error) {
      return true;
    }
  }

  /**
   * Gen new sess (id, start time).
   * Store in #storage and in AsyncStorage.
   */
  async #genSession() {
    this.#storage.session = {
      sess: Fibotalk.#genId(conf.sidLen),
      ts: new Date(),
    };
    return await this.#store("set");
  }

  /**
   * Delete the current data and exit
   */
  #exit() {
    
  }

  /**
   * Set the storage based on the type of data
   * @param {*} action : (set/get)
   * @returns 
   */
  async #store(action) {
    switch (action) {
      case "set":
        return await AsyncStorage.setItem(conf.settings(this.appid), JSON.stringify(this.#storage));
      case "get":
      default:
        return await JSON.parse(AsyncStorage.getItem(conf.settings(this.appid)));
    }
  }

  /** -------------------------------------
   * generate random ID of length $len
   * @param {*} len 
  -------------------------------------*/
  static #genId(len) {
    var result = '';
    var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = len; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }//genId()

  async static #request(apiObj) {
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
   * Check for changing session
   * Create an event and send to BE
   * Instantly send events
   * @param {*} event : event name
   * @param {*} dimensions : event dimensions object
   */
  setEvent(event, dimensions) { }
}