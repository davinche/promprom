interface IExecutor {
  (resolve: Function, reject: Function) : any;
}

interface PromiseType {
  then(onResolve?: Function, onReject?: Function) : PromiseType
}

enum PromiseState {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected'
}

function isPromise(val: any) : Boolean {
  return val && typeof val.then === 'function';
}

class Promise {
  private _state: PromiseState;
  private _onFulfilled: Function[];
  private _onRejected: Function[];
  private _onFinally: Function[];
  private _value: any;

  constructor(executor: IExecutor) {
    this._state = PromiseState.PENDING;
    this._resolve = this._resolve.bind(this);
    this._reject = this._reject.bind(this);
    this._onFulfilled = [];
    this._onRejected = [];
    this._onFinally = [];
    executor(this._resolve, this._reject);
  }

  private _resolve(val: any) {
    if (this._state !== PromiseState.PENDING) { return; }
    this._state = PromiseState.FULFILLED;
    this._value = val;
    this._onFulfilled.forEach((onFulfill) => {
      onFulfill(val);
    });
    this._finally();
  }

  private _reject(val: any) {
    if (this._state !== PromiseState.PENDING) { return; }
    this._state = PromiseState.REJECTED;
    this._value = val;
    this._onRejected.forEach((onRejected) => {
      onRejected(val);
    });
    this._finally();
  }

  private _finally() {
    this._onFinally.forEach((onFinally) => onFinally());
  }

  // handles `then` and `catch` calls when the promise is still pending resolution
  private _handlePending(resolve: Function, reject:Function, onFulfilled?: Function, onRejected?: Function) {
    if (this._state !== PromiseState.PENDING) { return; }
    if (onFulfilled) {
      this._onFulfilled.push((val: any) => {
        const retVal = onFulfilled(val);
        if (isPromise(retVal)) {
          return retVal.then(resolve, resolve);
        }
        resolve(retVal);
      });
    } else {
      this._onFulfilled.push(resolve);
    }
    if (onRejected) {
      this._onRejected.push((val: any) => {
        const retVal = onRejected(val);
        if (isPromise(retVal)) {
          return retVal.then(resolve, resolve);
        }
        resolve(retVal);
      });
    } else {
      this._onRejected.push(reject);
    }
  }

  // handles when `then` or `catch` is called when the promise has already
  // been resolved or rejected
  private _handleResolvedRejected(resolve: Function, reject: Function, onFulfilled?: Function, onRejected?: Function) {
    if (this._state === PromiseState.PENDING) { return; }
    if (this._state === PromiseState.FULFILLED) {
      if (onFulfilled) {
        const retVal = onFulfilled(this._value);
        if (isPromise(retVal)) {
          return retVal.then(resolve, resolve);
        }
        return resolve(retVal);
      }
      return resolve(this._value);
    }

    if (onRejected) {
      const retVal = onRejected(this._value);
      if (isPromise(retVal)) {
        return retVal.then(resolve, resolve);
      }
      return resolve(retVal);
    }
    return reject(this._value);
  }

  then(onFulfilled?: Function, onRejected?: Function) {
    return new Promise((resolve:Function, reject:Function) => {
      this._handlePending(resolve, reject, onFulfilled, onRejected);
      this._handleResolvedRejected(resolve, reject, onFulfilled, onRejected);
    });
  }

  catch(onRejected?: Function) {
    return this.then(undefined, onRejected);
  }

  finally(onFinally: Function) {
    return new Promise((resolve) => {
      this._onFinally.push(() => {
        onFinally();
        resolve();
      });
    });
  }

  static all(promises: PromiseType[]=[]) {
    return new Promise((resolve: Function, reject: Function) => {
      const retVal: any[] = [];
      const total = promises.length;
      let counter = 0;

      const success = (val: any, index: number) => {
        retVal[index] = val;
        counter++;
        if (counter === total) {
          resolve(retVal);
        }
      };

      promises.forEach((p, index) => {
        p.then((val: any) => success(val, index), reject);
      });
    });
  }

  static race(promises: PromiseType[]=[]) {
    return new Promise((resolve: Function, reject: Function) => {
      promises.forEach((p, index) => {
        p.then(resolve, reject);
      });
    });
  }

  static resolve(val: any) {
    return new Promise((resolve) => resolve(val));
  }

  static reject(val: any) {
    return new Promise((_, reject: Function) => reject(val));
  }

}

Object.defineProperty(Promise, 'length', {
  configurable: false,
  enumerable: false,
  value: 1,
});

export default Promise;
export function polyfill(w = window) {
  (w as any).Promise = Promise;
}
