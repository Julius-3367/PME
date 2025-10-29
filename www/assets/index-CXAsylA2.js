(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const scriptRel = "modulepreload";
const assetsURL = function(dep) {
  return "/" + dep;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = (cspNonceMeta == null ? void 0 : cspNonceMeta.nonce) || (cspNonceMeta == null ? void 0 : cspNonceMeta.getAttribute("nonce"));
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
/*! Capacitor: https://capacitorjs.com/ - MIT License */
var ExceptionCode$1;
(function(ExceptionCode2) {
  ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
  ExceptionCode2["Unavailable"] = "UNAVAILABLE";
})(ExceptionCode$1 || (ExceptionCode$1 = {}));
let CapacitorException$1 = class CapacitorException extends Error {
  constructor(message, code, data) {
    super(message);
    this.message = message;
    this.code = code;
    this.data = data;
  }
};
const getPlatformId$1 = (win) => {
  var _a, _b;
  if (win === null || win === void 0 ? void 0 : win.androidBridge) {
    return "android";
  } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
    return "ios";
  } else {
    return "web";
  }
};
const createCapacitor$1 = (win) => {
  const capCustomPlatform = win.CapacitorCustomPlatform || null;
  const cap = win.Capacitor || {};
  const Plugins = cap.Plugins = cap.Plugins || {};
  const getPlatform = () => {
    return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId$1(win);
  };
  const isNativePlatform = () => getPlatform() !== "web";
  const isPluginAvailable = (pluginName) => {
    const plugin = registeredPlugins.get(pluginName);
    if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
      return true;
    }
    if (getPluginHeader(pluginName)) {
      return true;
    }
    return false;
  };
  const getPluginHeader = (pluginName) => {
    var _a;
    return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
  };
  const handleError = (err) => win.console.error(err);
  const registeredPlugins = /* @__PURE__ */ new Map();
  const registerPlugin2 = (pluginName, jsImplementations = {}) => {
    const registeredPlugin = registeredPlugins.get(pluginName);
    if (registeredPlugin) {
      console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
      return registeredPlugin.proxy;
    }
    const platform = getPlatform();
    const pluginHeader = getPluginHeader(pluginName);
    let jsImplementation;
    const loadPluginImplementation = async () => {
      if (!jsImplementation && platform in jsImplementations) {
        jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
      } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
        jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
      }
      return jsImplementation;
    };
    const createPluginMethod = (impl, prop) => {
      var _a, _b;
      if (pluginHeader) {
        const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
        if (methodHeader) {
          if (methodHeader.rtype === "promise") {
            return (options) => cap.nativePromise(pluginName, prop.toString(), options);
          } else {
            return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
          }
        } else if (impl) {
          return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
        }
      } else if (impl) {
        return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
      } else {
        throw new CapacitorException$1(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode$1.Unimplemented);
      }
    };
    const createPluginMethodWrapper = (prop) => {
      let remove;
      const wrapper = (...args) => {
        const p = loadPluginImplementation().then((impl) => {
          const fn = createPluginMethod(impl, prop);
          if (fn) {
            const p2 = fn(...args);
            remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
            return p2;
          } else {
            throw new CapacitorException$1(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode$1.Unimplemented);
          }
        });
        if (prop === "addListener") {
          p.remove = async () => remove();
        }
        return p;
      };
      wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
      Object.defineProperty(wrapper, "name", {
        value: prop,
        writable: false,
        configurable: false
      });
      return wrapper;
    };
    const addListener = createPluginMethodWrapper("addListener");
    const removeListener = createPluginMethodWrapper("removeListener");
    const addListenerNative = (eventName, callback) => {
      const call = addListener({ eventName }, callback);
      const remove = async () => {
        const callbackId = await call;
        removeListener({
          eventName,
          callbackId
        }, callback);
      };
      const p = new Promise((resolve) => call.then(() => resolve({ remove })));
      p.remove = async () => {
        console.warn(`Using addListener() without 'await' is deprecated.`);
        await remove();
      };
      return p;
    };
    const proxy = new Proxy({}, {
      get(_, prop) {
        switch (prop) {
          case "$$typeof":
            return void 0;
          case "toJSON":
            return () => ({});
          case "addListener":
            return pluginHeader ? addListenerNative : addListener;
          case "removeListener":
            return removeListener;
          default:
            return createPluginMethodWrapper(prop);
        }
      }
    });
    Plugins[pluginName] = proxy;
    registeredPlugins.set(pluginName, {
      name: pluginName,
      proxy,
      platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
    });
    return proxy;
  };
  if (!cap.convertFileSrc) {
    cap.convertFileSrc = (filePath) => filePath;
  }
  cap.getPlatform = getPlatform;
  cap.handleError = handleError;
  cap.isNativePlatform = isNativePlatform;
  cap.isPluginAvailable = isPluginAvailable;
  cap.registerPlugin = registerPlugin2;
  cap.Exception = CapacitorException$1;
  cap.DEBUG = !!cap.DEBUG;
  cap.isLoggingEnabled = !!cap.isLoggingEnabled;
  return cap;
};
const initCapacitorGlobal$1 = (win) => win.Capacitor = createCapacitor$1(win);
const Capacitor$1 = /* @__PURE__ */ initCapacitorGlobal$1(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
const registerPlugin$1 = Capacitor$1.registerPlugin;
let WebPlugin$1 = class WebPlugin {
  constructor() {
    this.listeners = {};
    this.retainedEventArguments = {};
    this.windowListeners = {};
  }
  addListener(eventName, listenerFunc) {
    let firstListener = false;
    const listeners = this.listeners[eventName];
    if (!listeners) {
      this.listeners[eventName] = [];
      firstListener = true;
    }
    this.listeners[eventName].push(listenerFunc);
    const windowListener = this.windowListeners[eventName];
    if (windowListener && !windowListener.registered) {
      this.addWindowListener(windowListener);
    }
    if (firstListener) {
      this.sendRetainedArgumentsForEvent(eventName);
    }
    const remove = async () => this.removeListener(eventName, listenerFunc);
    const p = Promise.resolve({ remove });
    return p;
  }
  async removeAllListeners() {
    this.listeners = {};
    for (const listener in this.windowListeners) {
      this.removeWindowListener(this.windowListeners[listener]);
    }
    this.windowListeners = {};
  }
  notifyListeners(eventName, data, retainUntilConsumed) {
    const listeners = this.listeners[eventName];
    if (!listeners) {
      if (retainUntilConsumed) {
        let args = this.retainedEventArguments[eventName];
        if (!args) {
          args = [];
        }
        args.push(data);
        this.retainedEventArguments[eventName] = args;
      }
      return;
    }
    listeners.forEach((listener) => listener(data));
  }
  hasListeners(eventName) {
    var _a;
    return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
  }
  registerWindowListener(windowEventName, pluginEventName) {
    this.windowListeners[pluginEventName] = {
      registered: false,
      windowEventName,
      pluginEventName,
      handler: (event) => {
        this.notifyListeners(pluginEventName, event);
      }
    };
  }
  unimplemented(msg = "not implemented") {
    return new Capacitor$1.Exception(msg, ExceptionCode$1.Unimplemented);
  }
  unavailable(msg = "not available") {
    return new Capacitor$1.Exception(msg, ExceptionCode$1.Unavailable);
  }
  async removeListener(eventName, listenerFunc) {
    const listeners = this.listeners[eventName];
    if (!listeners) {
      return;
    }
    const index = listeners.indexOf(listenerFunc);
    this.listeners[eventName].splice(index, 1);
    if (!this.listeners[eventName].length) {
      this.removeWindowListener(this.windowListeners[eventName]);
    }
  }
  addWindowListener(handle) {
    window.addEventListener(handle.windowEventName, handle.handler);
    handle.registered = true;
  }
  removeWindowListener(handle) {
    if (!handle) {
      return;
    }
    window.removeEventListener(handle.windowEventName, handle.handler);
    handle.registered = false;
  }
  sendRetainedArgumentsForEvent(eventName) {
    const args = this.retainedEventArguments[eventName];
    if (!args) {
      return;
    }
    delete this.retainedEventArguments[eventName];
    args.forEach((arg) => {
      this.notifyListeners(eventName, arg);
    });
  }
};
const encode$1 = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
const decode$1 = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
let CapacitorCookiesPluginWeb$1 = class CapacitorCookiesPluginWeb extends WebPlugin$1 {
  async getCookies() {
    const cookies = document.cookie;
    const cookieMap = {};
    cookies.split(";").forEach((cookie) => {
      if (cookie.length <= 0)
        return;
      let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
      key = decode$1(key).trim();
      value = decode$1(value).trim();
      cookieMap[key] = value;
    });
    return cookieMap;
  }
  async setCookie(options) {
    try {
      const encodedKey = encode$1(options.key);
      const encodedValue = encode$1(options.value);
      const expires = `; expires=${(options.expires || "").replace("expires=", "")}`;
      const path = (options.path || "/").replace("path=", "");
      const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
      document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async deleteCookie(options) {
    try {
      document.cookie = `${options.key}=; Max-Age=0`;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async clearCookies() {
    try {
      const cookies = document.cookie.split(";") || [];
      for (const cookie of cookies) {
        document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async clearAllCookies() {
    try {
      await this.clearCookies();
    } catch (error) {
      return Promise.reject(error);
    }
  }
};
registerPlugin$1("CapacitorCookies", {
  web: () => new CapacitorCookiesPluginWeb$1()
});
const readBlobAsBase64$1 = async (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const base64String = reader.result;
    resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
  };
  reader.onerror = (error) => reject(error);
  reader.readAsDataURL(blob);
});
const normalizeHttpHeaders$1 = (headers = {}) => {
  const originalKeys = Object.keys(headers);
  const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
  const normalized = loweredKeys.reduce((acc, key, index) => {
    acc[key] = headers[originalKeys[index]];
    return acc;
  }, {});
  return normalized;
};
const buildUrlParams$1 = (params, shouldEncode = true) => {
  if (!params)
    return null;
  const output = Object.entries(params).reduce((accumulator, entry) => {
    const [key, value] = entry;
    let encodedValue;
    let item;
    if (Array.isArray(value)) {
      item = "";
      value.forEach((str) => {
        encodedValue = shouldEncode ? encodeURIComponent(str) : str;
        item += `${key}=${encodedValue}&`;
      });
      item.slice(0, -1);
    } else {
      encodedValue = shouldEncode ? encodeURIComponent(value) : value;
      item = `${key}=${encodedValue}`;
    }
    return `${accumulator}&${item}`;
  }, "");
  return output.substr(1);
};
const buildRequestInit$1 = (options, extra = {}) => {
  const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
  const headers = normalizeHttpHeaders$1(options.headers);
  const type = headers["content-type"] || "";
  if (typeof options.data === "string") {
    output.body = options.data;
  } else if (type.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.data || {})) {
      params.set(key, value);
    }
    output.body = params.toString();
  } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
    const form = new FormData();
    if (options.data instanceof FormData) {
      options.data.forEach((value, key) => {
        form.append(key, value);
      });
    } else {
      for (const key of Object.keys(options.data)) {
        form.append(key, options.data[key]);
      }
    }
    output.body = form;
    const headers2 = new Headers(output.headers);
    headers2.delete("content-type");
    output.headers = headers2;
  } else if (type.includes("application/json") || typeof options.data === "object") {
    output.body = JSON.stringify(options.data);
  }
  return output;
};
let CapacitorHttpPluginWeb$1 = class CapacitorHttpPluginWeb extends WebPlugin$1 {
  /**
   * Perform an Http request given a set of options
   * @param options Options to build the HTTP request
   */
  async request(options) {
    const requestInit = buildRequestInit$1(options, options.webFetchExtra);
    const urlParams = buildUrlParams$1(options.params, options.shouldEncodeUrlParams);
    const url = urlParams ? `${options.url}?${urlParams}` : options.url;
    const response = await fetch(url, requestInit);
    const contentType = response.headers.get("content-type") || "";
    let { responseType = "text" } = response.ok ? options : {};
    if (contentType.includes("application/json")) {
      responseType = "json";
    }
    let data;
    let blob;
    switch (responseType) {
      case "arraybuffer":
      case "blob":
        blob = await response.blob();
        data = await readBlobAsBase64$1(blob);
        break;
      case "json":
        data = await response.json();
        break;
      case "document":
      case "text":
      default:
        data = await response.text();
    }
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return {
      data,
      headers,
      status: response.status,
      url: response.url
    };
  }
  /**
   * Perform an Http GET request given a set of options
   * @param options Options to build the HTTP request
   */
  async get(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
  }
  /**
   * Perform an Http POST request given a set of options
   * @param options Options to build the HTTP request
   */
  async post(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
  }
  /**
   * Perform an Http PUT request given a set of options
   * @param options Options to build the HTTP request
   */
  async put(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
  }
  /**
   * Perform an Http PATCH request given a set of options
   * @param options Options to build the HTTP request
   */
  async patch(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
  }
  /**
   * Perform an Http DELETE request given a set of options
   * @param options Options to build the HTTP request
   */
  async delete(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
  }
};
registerPlugin$1("CapacitorHttp", {
  web: () => new CapacitorHttpPluginWeb$1()
});
const SplashScreen = registerPlugin$1("SplashScreen", {
  web: () => __vitePreload(() => import("./web--ljXfdOr.js"), true ? [] : void 0).then((m) => new m.SplashScreenWeb())
});
const Preferences = registerPlugin$1("Preferences", {
  web: () => __vitePreload(() => import("./web-Bm_mT53G.js"), true ? [] : void 0).then((m) => new m.PreferencesWeb())
});
/*! Capacitor: https://capacitorjs.com/ - MIT License */
var ExceptionCode;
(function(ExceptionCode2) {
  ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
  ExceptionCode2["Unavailable"] = "UNAVAILABLE";
})(ExceptionCode || (ExceptionCode = {}));
class CapacitorException2 extends Error {
  constructor(message, code, data) {
    super(message);
    this.message = message;
    this.code = code;
    this.data = data;
  }
}
const getPlatformId = (win) => {
  var _a, _b;
  if (win === null || win === void 0 ? void 0 : win.androidBridge) {
    return "android";
  } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
    return "ios";
  } else {
    return "web";
  }
};
const createCapacitor = (win) => {
  const capCustomPlatform = win.CapacitorCustomPlatform || null;
  const cap = win.Capacitor || {};
  const Plugins = cap.Plugins = cap.Plugins || {};
  const getPlatform = () => {
    return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
  };
  const isNativePlatform = () => getPlatform() !== "web";
  const isPluginAvailable = (pluginName) => {
    const plugin = registeredPlugins.get(pluginName);
    if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
      return true;
    }
    if (getPluginHeader(pluginName)) {
      return true;
    }
    return false;
  };
  const getPluginHeader = (pluginName) => {
    var _a;
    return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
  };
  const handleError = (err) => win.console.error(err);
  const registeredPlugins = /* @__PURE__ */ new Map();
  const registerPlugin2 = (pluginName, jsImplementations = {}) => {
    const registeredPlugin = registeredPlugins.get(pluginName);
    if (registeredPlugin) {
      console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
      return registeredPlugin.proxy;
    }
    const platform = getPlatform();
    const pluginHeader = getPluginHeader(pluginName);
    let jsImplementation;
    const loadPluginImplementation = async () => {
      if (!jsImplementation && platform in jsImplementations) {
        jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
      } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
        jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
      }
      return jsImplementation;
    };
    const createPluginMethod = (impl, prop) => {
      var _a, _b;
      if (pluginHeader) {
        const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
        if (methodHeader) {
          if (methodHeader.rtype === "promise") {
            return (options) => cap.nativePromise(pluginName, prop.toString(), options);
          } else {
            return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
          }
        } else if (impl) {
          return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
        }
      } else if (impl) {
        return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
      } else {
        throw new CapacitorException2(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
      }
    };
    const createPluginMethodWrapper = (prop) => {
      let remove;
      const wrapper = (...args) => {
        const p = loadPluginImplementation().then((impl) => {
          const fn = createPluginMethod(impl, prop);
          if (fn) {
            const p2 = fn(...args);
            remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
            return p2;
          } else {
            throw new CapacitorException2(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        });
        if (prop === "addListener") {
          p.remove = async () => remove();
        }
        return p;
      };
      wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
      Object.defineProperty(wrapper, "name", {
        value: prop,
        writable: false,
        configurable: false
      });
      return wrapper;
    };
    const addListener = createPluginMethodWrapper("addListener");
    const removeListener = createPluginMethodWrapper("removeListener");
    const addListenerNative = (eventName, callback) => {
      const call = addListener({ eventName }, callback);
      const remove = async () => {
        const callbackId = await call;
        removeListener({
          eventName,
          callbackId
        }, callback);
      };
      const p = new Promise((resolve) => call.then(() => resolve({ remove })));
      p.remove = async () => {
        console.warn(`Using addListener() without 'await' is deprecated.`);
        await remove();
      };
      return p;
    };
    const proxy = new Proxy({}, {
      get(_, prop) {
        switch (prop) {
          case "$$typeof":
            return void 0;
          case "toJSON":
            return () => ({});
          case "addListener":
            return pluginHeader ? addListenerNative : addListener;
          case "removeListener":
            return removeListener;
          default:
            return createPluginMethodWrapper(prop);
        }
      }
    });
    Plugins[pluginName] = proxy;
    registeredPlugins.set(pluginName, {
      name: pluginName,
      proxy,
      platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
    });
    return proxy;
  };
  if (!cap.convertFileSrc) {
    cap.convertFileSrc = (filePath) => filePath;
  }
  cap.getPlatform = getPlatform;
  cap.handleError = handleError;
  cap.isNativePlatform = isNativePlatform;
  cap.isPluginAvailable = isPluginAvailable;
  cap.registerPlugin = registerPlugin2;
  cap.Exception = CapacitorException2;
  cap.DEBUG = !!cap.DEBUG;
  cap.isLoggingEnabled = !!cap.isLoggingEnabled;
  return cap;
};
const initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
const Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
const registerPlugin = Capacitor.registerPlugin;
class WebPlugin2 {
  constructor() {
    this.listeners = {};
    this.retainedEventArguments = {};
    this.windowListeners = {};
  }
  addListener(eventName, listenerFunc) {
    let firstListener = false;
    const listeners = this.listeners[eventName];
    if (!listeners) {
      this.listeners[eventName] = [];
      firstListener = true;
    }
    this.listeners[eventName].push(listenerFunc);
    const windowListener = this.windowListeners[eventName];
    if (windowListener && !windowListener.registered) {
      this.addWindowListener(windowListener);
    }
    if (firstListener) {
      this.sendRetainedArgumentsForEvent(eventName);
    }
    const remove = async () => this.removeListener(eventName, listenerFunc);
    const p = Promise.resolve({ remove });
    return p;
  }
  async removeAllListeners() {
    this.listeners = {};
    for (const listener in this.windowListeners) {
      this.removeWindowListener(this.windowListeners[listener]);
    }
    this.windowListeners = {};
  }
  notifyListeners(eventName, data, retainUntilConsumed) {
    const listeners = this.listeners[eventName];
    if (!listeners) {
      if (retainUntilConsumed) {
        let args = this.retainedEventArguments[eventName];
        if (!args) {
          args = [];
        }
        args.push(data);
        this.retainedEventArguments[eventName] = args;
      }
      return;
    }
    listeners.forEach((listener) => listener(data));
  }
  hasListeners(eventName) {
    var _a;
    return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
  }
  registerWindowListener(windowEventName, pluginEventName) {
    this.windowListeners[pluginEventName] = {
      registered: false,
      windowEventName,
      pluginEventName,
      handler: (event) => {
        this.notifyListeners(pluginEventName, event);
      }
    };
  }
  unimplemented(msg = "not implemented") {
    return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
  }
  unavailable(msg = "not available") {
    return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
  }
  async removeListener(eventName, listenerFunc) {
    const listeners = this.listeners[eventName];
    if (!listeners) {
      return;
    }
    const index = listeners.indexOf(listenerFunc);
    this.listeners[eventName].splice(index, 1);
    if (!this.listeners[eventName].length) {
      this.removeWindowListener(this.windowListeners[eventName]);
    }
  }
  addWindowListener(handle) {
    window.addEventListener(handle.windowEventName, handle.handler);
    handle.registered = true;
  }
  removeWindowListener(handle) {
    if (!handle) {
      return;
    }
    window.removeEventListener(handle.windowEventName, handle.handler);
    handle.registered = false;
  }
  sendRetainedArgumentsForEvent(eventName) {
    const args = this.retainedEventArguments[eventName];
    if (!args) {
      return;
    }
    delete this.retainedEventArguments[eventName];
    args.forEach((arg) => {
      this.notifyListeners(eventName, arg);
    });
  }
}
const encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
const decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
class CapacitorCookiesPluginWeb2 extends WebPlugin2 {
  async getCookies() {
    const cookies = document.cookie;
    const cookieMap = {};
    cookies.split(";").forEach((cookie) => {
      if (cookie.length <= 0)
        return;
      let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
      key = decode(key).trim();
      value = decode(value).trim();
      cookieMap[key] = value;
    });
    return cookieMap;
  }
  async setCookie(options) {
    try {
      const encodedKey = encode(options.key);
      const encodedValue = encode(options.value);
      const expires = `; expires=${(options.expires || "").replace("expires=", "")}`;
      const path = (options.path || "/").replace("path=", "");
      const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
      document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async deleteCookie(options) {
    try {
      document.cookie = `${options.key}=; Max-Age=0`;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async clearCookies() {
    try {
      const cookies = document.cookie.split(";") || [];
      for (const cookie of cookies) {
        document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async clearAllCookies() {
    try {
      await this.clearCookies();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
registerPlugin("CapacitorCookies", {
  web: () => new CapacitorCookiesPluginWeb2()
});
const readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const base64String = reader.result;
    resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
  };
  reader.onerror = (error) => reject(error);
  reader.readAsDataURL(blob);
});
const normalizeHttpHeaders = (headers = {}) => {
  const originalKeys = Object.keys(headers);
  const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
  const normalized = loweredKeys.reduce((acc, key, index) => {
    acc[key] = headers[originalKeys[index]];
    return acc;
  }, {});
  return normalized;
};
const buildUrlParams = (params, shouldEncode = true) => {
  if (!params)
    return null;
  const output = Object.entries(params).reduce((accumulator, entry) => {
    const [key, value] = entry;
    let encodedValue;
    let item;
    if (Array.isArray(value)) {
      item = "";
      value.forEach((str) => {
        encodedValue = shouldEncode ? encodeURIComponent(str) : str;
        item += `${key}=${encodedValue}&`;
      });
      item.slice(0, -1);
    } else {
      encodedValue = shouldEncode ? encodeURIComponent(value) : value;
      item = `${key}=${encodedValue}`;
    }
    return `${accumulator}&${item}`;
  }, "");
  return output.substr(1);
};
const buildRequestInit = (options, extra = {}) => {
  const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
  const headers = normalizeHttpHeaders(options.headers);
  const type = headers["content-type"] || "";
  if (typeof options.data === "string") {
    output.body = options.data;
  } else if (type.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.data || {})) {
      params.set(key, value);
    }
    output.body = params.toString();
  } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
    const form = new FormData();
    if (options.data instanceof FormData) {
      options.data.forEach((value, key) => {
        form.append(key, value);
      });
    } else {
      for (const key of Object.keys(options.data)) {
        form.append(key, options.data[key]);
      }
    }
    output.body = form;
    const headers2 = new Headers(output.headers);
    headers2.delete("content-type");
    output.headers = headers2;
  } else if (type.includes("application/json") || typeof options.data === "object") {
    output.body = JSON.stringify(options.data);
  }
  return output;
};
class CapacitorHttpPluginWeb2 extends WebPlugin2 {
  /**
   * Perform an Http request given a set of options
   * @param options Options to build the HTTP request
   */
  async request(options) {
    const requestInit = buildRequestInit(options, options.webFetchExtra);
    const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
    const url = urlParams ? `${options.url}?${urlParams}` : options.url;
    const response = await fetch(url, requestInit);
    const contentType = response.headers.get("content-type") || "";
    let { responseType = "text" } = response.ok ? options : {};
    if (contentType.includes("application/json")) {
      responseType = "json";
    }
    let data;
    let blob;
    switch (responseType) {
      case "arraybuffer":
      case "blob":
        blob = await response.blob();
        data = await readBlobAsBase64(blob);
        break;
      case "json":
        data = await response.json();
        break;
      case "document":
      case "text":
      default:
        data = await response.text();
    }
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return {
      data,
      headers,
      status: response.status,
      url: response.url
    };
  }
  /**
   * Perform an Http GET request given a set of options
   * @param options Options to build the HTTP request
   */
  async get(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
  }
  /**
   * Perform an Http POST request given a set of options
   * @param options Options to build the HTTP request
   */
  async post(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
  }
  /**
   * Perform an Http PUT request given a set of options
   * @param options Options to build the HTTP request
   */
  async put(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
  }
  /**
   * Perform an Http PATCH request given a set of options
   * @param options Options to build the HTTP request
   */
  async patch(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
  }
  /**
   * Perform an Http DELETE request given a set of options
   * @param options Options to build the HTTP request
   */
  async delete(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
  }
}
registerPlugin("CapacitorHttp", {
  web: () => new CapacitorHttpPluginWeb2()
});
const Dialog = registerPlugin("Dialog", {
  web: () => __vitePreload(() => import("./web-CQvpwsJG.js"), true ? [] : void 0).then((m) => new m.DialogWeb())
});
const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  EMPLOYEE: "employee",
  ACCOUNTANT: "accountant"
};
class AuthService {
  constructor() {
    this.currentUser = null;
    this.initialize();
  }
  async initialize() {
    try {
      const user = await this.getStoredUser();
      if (user) {
        this.currentUser = user;
      }
    } catch (error) {
      console.error("Failed to initialize auth service:", error);
    }
  }
  async getStoredUser() {
    try {
      const { value } = await Preferences.get({ key: "currentUser" });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Failed to get stored user:", error);
      return null;
    }
  }
  async setStoredUser(user) {
    try {
      if (user) {
        await Preferences.set({
          key: "currentUser",
          value: JSON.stringify(user)
        });
      } else {
        await Preferences.remove({ key: "currentUser" });
      }
    } catch (error) {
      console.error("Failed to store user:", error);
    }
  }
  async login(email, password) {
    try {
      const response = await fetch("https://ke.erpproject.online/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed. Please check your credentials.");
      }
      const data = await response.json();
      if (!data.token) {
        throw new Error("No authentication token received");
      }
      await Preferences.set({
        key: "auth_token",
        value: data.token
      });
      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role || ROLES.EMPLOYEE
      };
      this.currentUser = user;
      await this.setStoredUser(user);
      return user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }
  async logout() {
    try {
      const token = await this.getAuthToken();
      if (token) {
        await fetch("https://ke.erpproject.online/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          }
        }).catch((error) => {
          console.error("Logout API call failed:", error);
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await Promise.all([
        Preferences.remove({ key: "auth_token" }),
        Preferences.remove({ key: "currentUser" })
      ]);
      this.currentUser = null;
      window.dispatchEvent(new CustomEvent("logout"));
    }
  }
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;
      if (this.currentUser) return true;
      const response = await fetch("https://ke.erpproject.online/api/auth/user", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      });
      if (response.ok) {
        const user = await response.json();
        this.currentUser = user;
        await this.setStoredUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  }
  async getAuthToken() {
    try {
      const { value } = await Preferences.get({ key: "auth_token" });
      return value;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  }
  async requestPasswordReset(email) {
    try {
      const response = await fetch("https://ke.erpproject.online/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to request password reset");
      }
      return true;
    } catch (error) {
      console.error("Password reset request failed:", error);
      throw error;
    }
  }
  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }
  hasAnyRole(roles) {
    return this.currentUser && roles.includes(this.currentUser.role);
  }
}
new AuthService();
registerPlugin$1("App", {
  web: () => __vitePreload(() => import("./web-DpF8zdvw.js"), true ? [] : void 0).then((m) => new m.AppWeb())
});
class LoginComponent extends HTMLElement {
  constructor() {
    super();
    this.authService = new AuthService();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
        
        .login-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background-color: #f5f7ff;
        }
        
        .login-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          width: 100%;
          max-width: 420px;
          padding: 32px;
          margin: 20px 0;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .login-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 16px 0 8px;
          color: #1a1a1a;
        }
        
        .login-header p {
          color: #666;
          font-size: 15px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
          color: #333;
        }
        
        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #4a6cf7;
          box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.2);
        }
        
        .password-input {
          position: relative;
        }
        
        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          color: #666;
        }
        
        .login-button {
          width: 100%;
          padding: 16px;
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background-color 0.2s;
          margin: 24px 0;
        }
        
        .login-button:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }
        
        .login-button:hover:not(:disabled) {
          background-color: #3a5bd9;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .forgot-password {
          display: block;
          text-align: right;
          margin-top: 8px;
          font-size: 14px;
          color: #4a6cf7;
          text-decoration: none;
        }
        
        .forgot-password:hover {
          text-decoration: underline;
        }
        
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0;
          color: #999;
          font-size: 14px;
        }
        
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .divider:not(:empty)::before {
          margin-right: 16px;
        }
        
        .divider:not(:empty)::after {
          margin-left: 16px;
        }
        
        .social-login {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .social-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background: white;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .social-button:hover {
          background-color: #f8f9fa;
          border-color: #cbd5e0;
        }
        
        .social-button.google {
          color: #db4437;
        }
        
        .social-button.facebook {
          color: #1877f2;
        }
        
        .signup-link {
          text-align: center;
          font-size: 15px;
          color: #666;
          margin-top: 24px;
        }
        
        .signup-link a {
          color: #4a6cf7;
          text-decoration: none;
          font-weight: 500;
          margin-left: 4px;
        }
        
        .signup-link a:hover {
          text-decoration: underline;
        }
        
        .error-message {
          color: #ff4444;
          background-color: #fff5f5;
          border: 1px solid #ffdddd;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 14px;
          display: none;
        }
        
        .error-input {
          border-color: #ff4444 !important;
        }
        
        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 16px 0;
        }
        
        .remember-me input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin: 0;
        }
        
        @media (max-width: 480px) {
          .login-card {
            padding: 24px 16px;
          }
          
          .login-button {
            padding: 14px;
          }
        }
      </style>
      
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your account</p>
          </div>
          
          <div id="error-message" class="error-message"></div>
          
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                class="form-input" 
                placeholder="Enter your email" 
                required 
                autocomplete="username"
                inputmode="email"
              >
            </div>
            
            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <div class="password-input">
                <input 
                  type="password" 
                  id="password" 
                  class="form-input" 
                  placeholder="Enter your password" 
                  required
                  autocomplete="current-password"
                >
                <button type="button" id="togglePassword" class="toggle-password" aria-label="Toggle password visibility">👁️</button>
              </div>
              <a href="#" class="forgot-password" id="forgot-password">Forgot password?</a>
            </div>

            <div class="remember-me">
              <input type="checkbox" id="rememberMe" class="form-checkbox">
              <label for="rememberMe">Remember me</label>
            </div>

            <button type="submit" class="login-button">
              <span class="button-text">Sign In</span>
              <span class="button-loader" style="display: none;">
                <div class="spinner"></div>
              </span>
            </button>

            <div class="divider">OR</div>

            <div class="social-login">
              <button type="button" class="social-button google">
                <span>Continue with Google</span>
              </button>
              
              <button type="button" class="social-button facebook">
                <span>Continue with Facebook</span>
              </button>
            </div>

            <div class="signup-link">
              Don't have an account? <a href="#" id="showSignup">Sign up</a>
            </div>
          </form>
        </div>
      </div>
    `;
  }
  attachEventListeners() {
    const form = this.shadowRoot.getElementById("login-form");
    const togglePassword = this.shadowRoot.getElementById("togglePassword");
    const passwordInput = this.shadowRoot.getElementById("password");
    const showSignupBtn = this.shadowRoot.getElementById("showSignup");
    const forgotPasswordLink = this.shadowRoot.getElementById("forgot-password");
    const googleBtn = this.shadowRoot.querySelector(".social-button.google");
    const facebookBtn = this.shadowRoot.querySelector(".social-button.facebook");
    if (togglePassword && passwordInput) {
      togglePassword.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        togglePassword.textContent = type === "password" ? "👁️" : "👁️‍🗨️";
      });
    }
    if (form) {
      form.addEventListener("submit", this.handleLogin.bind(this));
    }
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener("click", this.handleForgotPassword.bind(this));
    }
    if (showSignupBtn) {
      showSignupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent("show-signup", {
          bubbles: true,
          composed: true
        }));
      });
    }
    if (googleBtn) {
      googleBtn.addEventListener("click", () => this.handleSocialLogin("google"));
    }
    if (facebookBtn) {
      facebookBtn.addEventListener("click", () => this.handleSocialLogin("facebook"));
    }
  }
  async handleLogin(e) {
    var _a, _b;
    e.preventDefault();
    const email = this.shadowRoot.getElementById("email").value.trim();
    const password = this.shadowRoot.getElementById("password").value;
    const rememberMe = this.shadowRoot.getElementById("rememberMe").checked;
    const loginBtn = this.shadowRoot.querySelector('button[type="submit"]');
    const buttonText = loginBtn == null ? void 0 : loginBtn.querySelector(".button-text");
    const buttonLoader = loginBtn == null ? void 0 : loginBtn.querySelector(".button-loader");
    const errorElement = this.shadowRoot.querySelector("#error-message");
    try {
      if (buttonText) buttonText.style.display = "none";
      if (buttonLoader) buttonLoader.style.display = "flex";
      if (loginBtn) loginBtn.disabled = true;
      if (errorElement) errorElement.style.display = "none";
      if (!email || !password) {
        throw new Error("Please fill in all fields");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }
      const user = await this.authService.login(email, password);
      await Preferences.set({
        key: "remember_me",
        value: rememberMe.toString()
      });
      await Dialog.alert({
        title: "Success",
        message: `Welcome back, ${user.name || "User"}!`,
        buttonTitle: "Continue"
      });
      this.dispatchEvent(new CustomEvent("login-success", {
        bubbles: true,
        composed: true,
        detail: { user }
      }));
    } catch (error) {
      console.error("Login error:", error);
      if (errorElement) {
        errorElement.textContent = error.message || "An error occurred during login. Please try again.";
        errorElement.style.display = "block";
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (((_a = error.message) == null ? void 0 : _a.includes("network")) || ((_b = error.message) == null ? void 0 : _b.includes("server"))) {
        await Dialog.alert({
          title: "Connection Error",
          message: "Unable to connect to the server. Please check your internet connection and try again.",
          buttonTitle: "OK"
        });
      }
    } finally {
      if (buttonText) buttonText.style.display = "block";
      if (buttonLoader) buttonLoader.style.display = "none";
      if (loginBtn) loginBtn.disabled = false;
    }
  }
  async handleForgotPassword(e) {
    e.preventDefault();
    try {
      const { value: email, cancelled } = await Dialog.prompt({
        title: "Reset Password",
        message: "Enter your email address to receive a password reset link",
        inputPlaceholder: "your@email.com",
        inputType: "email",
        okButtonTitle: "Send Reset Link",
        cancelButtonTitle: "Cancel"
      });
      if (cancelled || !email) return;
      const loading = await Dialog.alert({
        title: "Sending...",
        message: "Sending password reset instructions",
        buttonTitle: ""
        // No button while loading
      });
      try {
        await this.authService.requestPasswordReset(email);
        await loading.dismiss();
        await Dialog.alert({
          title: "Email Sent",
          message: "If an account exists with this email, you will receive a password reset link shortly.",
          buttonTitle: "OK"
        });
      } catch (error) {
        try {
          await loading.dismiss();
        } catch (e2) {
        }
        console.error("Password reset error:", error);
        await Dialog.alert({
          title: "Error",
          message: error.message || "Failed to send password reset email. Please try again later.",
          buttonTitle: "OK"
        });
      }
    } catch (error) {
      console.error("Forgot password dialog error:", error);
    }
  }
  async handleSocialLogin(provider) {
    try {
      await Dialog.alert({
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Login`,
        message: `This would typically redirect to ${provider} for authentication`,
        buttonTitle: "OK"
      });
      this.dispatchEvent(new CustomEvent("login-success", {
        bubbles: true,
        composed: true,
        detail: {
          email: `user@${provider}.com`,
          provider
        }
      }));
    } catch (error) {
      const errorElement = this.shadowRoot.getElementById("error-message");
      if (errorElement) {
        errorElement.textContent = `Failed to sign in with ${provider}: ${error.message}`;
        errorElement.style.display = "block";
      }
      console.error(`${provider} login failed:`, error);
    }
  }
}
if (!customElements.get("login-component")) {
  customElements.define("login-component", LoginComponent);
}
class ERPApp {
  constructor() {
    this.authService = new AuthService();
    this.appContainer = document.getElementById("app");
    this.init();
  }
  async init() {
    try {
      await SplashScreen.hide();
      this.showLogin();
      document.addEventListener("login-success", async () => {
        this.appContainer.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <p>Logging you in...</p>
          </div>
        `;
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.showDashboard();
      });
      document.addEventListener("logout", async () => {
        try {
          await this.authService.logout();
          this.showLogin();
        } catch (error) {
          console.error("Logout failed:", error);
          this.showLogin();
        }
      });
    } catch (error) {
      console.error("App initialization failed:", error);
      this.showLogin();
    }
  }
  showLogin() {
    this.appContainer.innerHTML = `
      <login-component></login-component>
    `;
  }
  async showDashboard() {
    try {
      const token = await this.authService.getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      this.appContainer.innerHTML = `
        <div style="width: 100%; height: 100vh; position: relative;">
          <div id="erp-loading" style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: white;
            z-index: 10;
          ">
            <div style="
              width: 40px;
              height: 40px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #4a6cf7;
              border-radius: 50%;
              margin: 0 auto 20px;
              animation: spin 1s linear infinite;
            "></div>
            <p>Loading ERP interface...</p>
          </div>
          <iframe 
            id="erp-iframe"
            src="https://ke.erp.project.online/login?token=${encodeURIComponent(token)}"
            style="
              width: 100%;
              height: 100%;
              border: none;
              display: none;
            "
            allow="camera *; microphone *; geolocation *;"
          ></iframe>
          <style>
            @keyframes spin { 
              0% { transform: rotate(0deg); } 
              100% { transform: rotate(360deg); } 
            }
          </style>
        </div>`;
      const iframe = document.getElementById("erp-iframe");
      const loading = document.getElementById("erp-loading");
      if (iframe && loading) {
        iframe.onload = () => {
          loading.style.display = "none";
          iframe.style.display = "block";
        };
        setTimeout(() => {
          if (loading) loading.style.display = "none";
          if (iframe) iframe.style.display = "block";
        }, 5e3);
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      await Dialog.alert({
        title: "Error",
        message: "Failed to load the ERP interface. Please try again.",
        buttonTitle: "OK"
      });
      this.showLogin();
    }
  }
}
if (!customElements.get("login-component")) {
  customElements.define("login-component", LoginComponent);
}
const initApp = async () => {
  try {
    await SplashScreen.hide();
    const app = new ERPApp();
    return app;
  } catch (error) {
    console.error("Failed to initialize app:", error);
    document.getElementById("app").innerHTML = `
      <div style="padding: 20px; text-align: center; margin-top: 50px;">
        <h2 style="color: #e74c3c;">Something went wrong</h2>
        <p style="margin: 20px 0; color: #7f8c8d;">${error.message || "Please try again later"}</p>
        <button onclick="window.location.reload()" style="
          background: #4a6cf7;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(74, 108, 247, 0.3);
          transition: all 0.2s ease;
        ">
          Refresh Page
        </button>
      </div>
    `;
  }
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
window.erpApp = {
  auth: new AuthService(),
  initApp,
  Capacitor: Capacitor$1,
  Preferences
};
export {
  WebPlugin$1 as W,
  WebPlugin2 as a
};
