// import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorage } from 'react-native';

export default class Fibotalk {
  constructor(appid) {
    storage("get", "sample").then(resp => {
      if (resp)
        return console.log("got from storage", resp);
      storage("set", "sample", Date.now()).then(resp => {
        console.log("set into storage", resp);
      }).catch(error => {
        console.error(error);
      })
    }).catch(error => {
      console.error(error);
    });
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = (e) => {
      if (xhr.readyState !== 4) {
        return;
      }
      console.warn('Fibo response', xhr.responseText);
    };

    xhr.open('POST', 'https://staging.fibotalk.com/widget/server/apis/open/v1/events/sync');
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("auth", appid);
    xhr.send(JSON.stringify({ events: [{ event: "hello" }] }));
  }
}

async function storage(action, key, val) {
  switch (action) {
    case "set":
      return await AsyncStorage.setItem(key, val);
    case "get":
    default:
      return await AsyncStorage.getItem(key);
  }
}