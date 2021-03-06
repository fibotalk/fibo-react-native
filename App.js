// import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorage, Dimensions, Platform } from 'react-native';

const conf = {
  settings: (gid => `__ft__settings__:${gid}`),
  sidLen: 30,
  uidLen: 30,
  awayTime: 1 * 60 * 60 * 1000, // 1 hrs
  maxEventsInSession: 500,
  apiServer: "https://appsuite.fibotalk.com",
  // apiServer: 'http://cdn.unireply.com/widget',
  eventsSync: "/apis/open/v1/events/sync",
  libVersion: "react-native-1.0",
};

export default class Fibotalk {

  storage = {};
  static device = {};
  fibotalkSettings;
  appid;

  /**
   * Get storage from local storage.
   * call init()
   * @param {*} appid 
   * @returns 
   */
  constructor(appid) {
    console.log("Fibotalk: starting", appid);
    if (!appid)
      return null;
    this.appid = appid;
    this.store("get").then(resp => {
      this.storage = resp || this.storage;
      this.init();
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
  init() {
    Fibotalk.initSystemData();
    let newSess = false;
    if (!this.storage.uid) {
      this.storage.uid = Fibotalk.genId(conf.uidLen);
      newSess = true;
    }
    if (!newSess && !this.storage.session)
      newSess = true;
    if (!newSess && this.checkSessionChange())
      newSess = true;
    if (newSess)
      this.genSession().then(resp => {
      }).catch(err => {
        console.error("Fibotalk error: ", err);
        this.exit();
      });
  }

  /**
   * Get device info and store it.
   */
  static initSystemData() {
    Fibotalk.device = Fibotalk.device || {};
    Fibotalk.device["device#screenHeight"] = Math.ceil(Dimensions.get('window').height);
    Fibotalk.device["device#screenWidth"] = Math.ceil(Dimensions.get('window').width);
    this.device["device#manufacturer"] = Platform.constants.Manufacturer;
    this.device["platform"] = Platform.OS;
    this.device["osVersion"] = Platform.Version;
  }

  /**
   * Check whether the current running session is changing
   * 1. Check time from last event.
   * 2. Check number of events in session.
   * 3. Check for user change.
   */
  checkSessionChange() {
    try {
      if (this.storage.lastEventTs && ((Date.now() - new Date(this.storage.lastEventTs).getTime()) > conf.awayTime))
        return true;
      if (this.storage.eventCount >= conf.maxEventsInSession)
        return true;
      if (this.userChanged()) {
        this.storage.uid = Fibotalk.genId(conf.uidLen);
        return true;
      }
    } catch (error) {
      console.error(error);
      return true;
    }
    return false;
  }

  /** -------------------------------------
   * compare window.fibotalkSettings with user data in localStorage. 
   -------------------------------------*/
  userChanged() {
    if (!(this.fibotalkSettings && this.storage.user))
      return false;
    var userId = this.fibotalkSettings.userId;
    if (this.fibotalkSettings.user)
      userId = this.fibotalkSettings.user.userId || userId;
    if (Fibotalk.isObjOrFunc(userId))
      return false;
    if (this.storage.user.userId && userId && this.storage.user.userId != userId)
      return true;
    try {
      var oAccountId = this.storage.account.accountId;
      var nAccountId = this.fibotalkSettings.account.accountId;
      if (Fibotalk.isObjOrFunc(nAccountId))
        return false;
      if (oAccountId && nAccountId && oAccountId != nAccountId)
        return true;
    } catch (e) { }
    return false;
  }//userChanged()

  /** -------------------------------------
   * return true only if its a JSON object
   * @param {*} obj 
   -------------------------------------*/
  static isObject(obj) {
    if (Array.isArray(obj))
      return false;
    if (typeof obj === "object")
      return true;
    return false;
  }//isObject()

  /** -------------------------------------
   * Check whether the given item is an object of a function
   * @param {*} item 
   -------------------------------------*/
  static isObjOrFunc(item) {
    var validObj = ['function', 'object'];
    return validObj.includes(typeof item);
  }//isObjOrFunc()

  /**
   * Gen new sess (id, start time).
   * Store in storage and in AsyncStorage.
   */
  async genSession() {
    this.storage.session = {
      sess: Fibotalk.genId(conf.sidLen),
      ts: new Date(),
    };
    this.storage.lastEventTs = new Date();
    await this.store("set");
    this.sendEvent("session_start");
  }

  /**
   * Delete the current data and exit
   */
  exit() {
    AsyncStorage.removeItem(conf.settings(this.appid)).then(resp => {
      console.log("Fibotalk: cleared and exiting....", resp);
    }).catch(err => {
      console.error(err);
    });
  }

  /**
   * Set the storage based on the type of data
   * @param {*} action : (set/get)
   * @returns 
   */
  async store(action) {
    switch (action) {
      case "set":
        return await AsyncStorage.setItem(conf.settings(this.appid), JSON.stringify(this.storage));
      case "get":
      default:
        return JSON.parse(await AsyncStorage.getItem(conf.settings(this.appid)));
    }
  }

  /** -------------------------------------
   * generate random ID of length $len
   * @param {*} len 
  -------------------------------------*/
  static genId(len) {
    var result = '';
    var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = len; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }//genId()

  static request(apiObj) {
    let xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      if (!(apiObj.url && apiObj.method))
        return reject("URL not provided");
      let url = apiObj.url;
      if (apiObj.qs && this.isObject(apiObj.qs)) {
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
      if (apiObj.headers && this.isObject(apiObj.headers)) {
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
   * @param {*} name : event name
   * @param {*} dimensions : event dimensions object
   */
  setEvent(name, dimensions) {
    if (this.checkSessionChange()) {
      this.genSession().then(resp => {
        this.sendEvent(name, dimensions);
      }).catch(err => {
        console.error(err);
        this.sendEvent(name, dimensions);
      });
    } else {
      this.sendEvent(name, dimensions);
    }
  }

  sendEvent(name, dimensions) {
    let event;
    try {
      if (!Fibotalk.isObject(this.fibotalkSettings))
        delete this.fibotalkSettings;
      if (this.fibotalkSettings) {
        if (this.fibotalkSettings.user) {
          this.storage.user = this.storage.user || {};
          Object.assign(this.storage.user, this.fibotalkSettings.user);
          delete this.fibotalkSettings.user;
        }
        if (this.fibotalkSettings.account) {
          this.storage.account = this.storage.account || {};
          Object.assign(this.storage.account, this.fibotalkSettings.account);
          delete this.fibotalkSettings.account;
        }
        Object.assign(this.storage.user, this.fibotalkSettings);
      }
    } catch (error) { }
    try {
      event = {
        event: name,
        gid: this.appid,
        uid: this.storage.uid,
        sess: this.storage.session.sess,
        ts: new Date(),
        ui: this.storage.user,
        account: this.storage.account,
        libVersion: conf.libVersion,
        ...Fibotalk.device,
      };
    } catch (error) {
      console.error("Fibotalk: event not accepted / event too early");
      return;
    }
    if (dimensions && Fibotalk.isObject(dimensions)) {
      for (let i in dimensions) {
        event[`dimensions#${i}`] = dimensions[i];
      }
    }
    try {
      event["sessDur"] = new Date(event.ts).getTime() - new Date(this.storage.session.ts).getTime();
      event["sessDur"] /= 1000;
    } catch (error) {
      console.error("Fibotalk:", error);
    }
    try {
      if (this.storage.lastEventTs)
        event["durDiff"] = new Date(event.ts).getTime() - new Date(this.storage.lastEventTs).getTime();
      else
        event["durDiff"] = 0;
    } catch (error) {
      console.error("Fibotalk:", error);
    }
    this.storage.lastEventTs = event.ts;

    console.log("Fibotalk: current_event", JSON.stringify(event));
    this.store("set").then(resp => { }).catch(err => console.error("Fibotalk: storage error", err));

    Fibotalk.request({
      url: conf.apiServer + conf.eventsSync,// events sync API
      headers: {
        auth: this.appid
      },
      method: "POST",
      qs: {
        gid: this.appid
      },
      json: {
        events: [event],
      }
    }).then(resp => { }).catch(err => console.log("Fibotalk: ", err));
  }
}