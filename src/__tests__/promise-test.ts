import Promise, {polyfill} from '../promise-polyfill';

jest.useFakeTimers();

describe('Promise', () => {
  describe('length', () => {
    it ('should be 1', () => {
      expect(Promise.length).toBe(1);
    });
  });

  describe('resolve', () => {
    it ('should call the onResolve method', () => {
      const onResolve = jest.fn();
      const onReject = jest.fn();
      const promise = new Promise((resolve: Function) => {
        setTimeout(() => resolve('foo'), 100);
      });
      promise.then(onResolve, onReject);

      // initial test
      expect(onResolve).not.toHaveBeenCalled();
      expect(onReject).not.toHaveBeenCalled();

      jest.runOnlyPendingTimers();

      // test after setTimeout runs
      expect(onResolve).toHaveBeenCalledWith('foo');
      expect(onReject).not.toHaveBeenCalled();
    });

    it ('should allow multiple onResolves to be called', () => {

      const onResolve1 = jest.fn();
      const onResolve2 = jest.fn();
      const promise = new Promise((resolve: Function) => {
        setTimeout(() => resolve('foo'), 100);
      });

      promise.then(onResolve1);
      promise.then(onResolve2);
      expect(onResolve1).not.toHaveBeenCalled();
      expect(onResolve2).not.toHaveBeenCalled();
      jest.runOnlyPendingTimers();
      expect(onResolve1).toHaveBeenCalledWith('foo');
      expect(onResolve2).toHaveBeenCalledWith('foo');
    });
  });

  describe('reject', () => {
    it ('should call the onReject method', () => {
      const onResolve = jest.fn();
      const onReject = jest.fn();

      const promise = new Promise((resolve: Function, reject: Function) => {
        setTimeout(() => reject('foo'), 100);
      });
      promise.then(onResolve, onReject);

      // initial test
      expect(onResolve).not.toHaveBeenCalled();
      expect(onReject).not.toHaveBeenCalled();

      jest.runOnlyPendingTimers();

      // test after setTimeout runs
      expect(onResolve).not.toHaveBeenCalled();
      expect(onReject).toHaveBeenCalledWith('foo');
    });

    it ('should allow multiple onReject to be called', () => {
      const noop = function() {};
      const onReject1 = jest.fn();
      const onReject2 = jest.fn();

      const promise = new Promise((resolve: Function, reject: Function) => {
        setTimeout(() => reject('foo'), 100);
      });

      promise.then(noop, onReject1);
      promise.then(noop, onReject2);
      expect(onReject1).not.toHaveBeenCalled();
      expect(onReject2).not.toHaveBeenCalled();
      jest.runOnlyPendingTimers();
      expect(onReject1).toHaveBeenCalledWith('foo');
      expect(onReject2).toHaveBeenCalledWith('foo');
    });
  });

  describe('then', () => {

    it ('should return a promise when called', () => {
      const noop = function() {};
      const p = new Promise((resolve) => resolve());
      const p2 = p.then(noop, noop);
      expect(p2).toBeDefined();
      expect(p2 instanceof Promise).toBe(true);
    });

    it ('resolves the returned promise with the value from the resolve hander', () => {
      let _resolve;
      const onResolve = jest.fn();
      const p = new Promise((resolve) => _resolve = resolve);
      p.then(() => 'success', () => 'failure').then(onResolve);
      expect(onResolve).not.toHaveBeenCalled();
      _resolve();
      expect(onResolve).toHaveBeenCalledWith('success');
    });

    it ('resolves the returned promise with the value of the resolved promise from the resolve hander', () => {
      let _resolve;
      const onResolve = jest.fn();
      const p = new Promise((resolve) => _resolve = resolve);
      const successPromise = () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('success'), 100);
        });
      };

      p.then(successPromise, () => 'failure').then(onResolve);
      expect(onResolve).not.toHaveBeenCalled();
      _resolve();
      jest.runOnlyPendingTimers();
      expect(onResolve).toHaveBeenCalledWith('success');
    });

    it ('resolves the returned promise with the value from the reject hander', () => {
      let _reject;
      const onResolve = jest.fn();
      const p = new Promise((_, reject) => _reject = reject);
      p.then(() => 'success', () => 'failure').then(onResolve);
      expect(onResolve).not.toHaveBeenCalled();
      _reject();
      expect(onResolve).toHaveBeenCalledWith('failure');
    });

    it ('resolves the returned promise with the value from the promise returned from the reject hander', () => {
      let _reject;
      const onResolve = jest.fn();
      const p = new Promise((_, reject) => _reject = reject);
      const failurePromise = () => {
        return new Promise((_, reject) => {
          setTimeout(() => reject('failure'), 100);
        });
      };
      p.then(() => 'success', failurePromise).then(onResolve);
      expect(onResolve).not.toHaveBeenCalled();
      _reject();
      jest.runOnlyPendingTimers();
      expect(onResolve).toHaveBeenCalledWith('failure');
    });

    it ('passes resolved values through the `then` chain', () => {
      const onResolve = jest.fn();
      Promise.resolve('foo').then().then(onResolve);
      expect(onResolve).toHaveBeenCalledWith('foo');
    });

    it ('passes rejected values through the `then` chain', () => {
      const onReject = jest.fn();
      Promise.reject('foo').then().catch(onReject);
      expect(onReject).toHaveBeenCalledWith('foo');
    });
  });

  describe('catch', () => {
    it ('calls the onReject handler on rejection', () => {
      let _reject;
      const onReject = jest.fn();
      const p = new Promise((_, reject) => _reject = reject);
      p.catch(onReject);
      expect(onReject).not.toHaveBeenCalled();
      _reject('failure');
      expect(onReject).toHaveBeenCalledWith('failure');
    });

    it ('returns a promise that resolves the onReject value', () => {
      let _reject;
      const onResolve = jest.fn();
      const p = new Promise((_, reject) => _reject = reject);
      p.catch(() => 'fuuuuuuuuuu').then(onResolve);
      expect(onResolve).not.toHaveBeenCalled();
      _reject();
      expect(onResolve).toHaveBeenCalledWith('fuuuuuuuuuu');
    });
  });

  describe('finally', () => {
    it ('calls the finally handler when the promise resolves', () => {
      let _resolve;
      const onFinally = jest.fn();
      const p = new Promise((resolve) => _resolve = resolve);
      p.finally(onFinally);
      expect(onFinally).not.toHaveBeenCalled();
      _resolve();
      expect(onFinally).toHaveBeenCalled();
    });

    it ('returns a promise that is resolved when original promise is resolved', () => {
      let _resolve;
      const onFinally = jest.fn();
      const onResolve = jest.fn();
      const p = new Promise((resolve) => _resolve = resolve);
      const finallyPromise = p.finally(onFinally);
      finallyPromise.then(onResolve);

      // check that a promise is returned
      expect(finallyPromise).toBeDefined();
      expect(finallyPromise instanceof Promise).toBe(true);

      // check that it is resolved only when original promise is resolved
      expect(onResolve).not.toHaveBeenCalled();
      _resolve();
      expect(onResolve).toHaveBeenCalled();
    });
  });

  describe('Promise.resolve', () => {
    it ('returns a promise', () => {
      const p = Promise.resolve('foo');
      expect(p instanceof Promise).toBe(true);
    });

    it ('calls onResolve with the resolved value', () => {
      const onResolve = jest.fn();
      Promise.resolve('foo').then(onResolve);
      expect(onResolve).toHaveBeenCalledWith('foo');
    });
  });

  describe('Promise.reject', () => {
    it ('returns a promise', () => {
      const p = Promise.reject('bar');
      expect(p instanceof Promise).toBe(true);
    });

    it ('calls onReject with the rejected value', () => {
      const onResolve = jest.fn();
      const onReject = jest.fn();
      Promise.reject('bar').then(onResolve, onReject);
      expect(onResolve).not.toHaveBeenCalled();
      expect(onReject).toHaveBeenCalledWith('bar');
    });
  });

  describe('Promise.all', () => {
    it('returns a promise', () => {
      let _resolve1, _resolve2;
      const p1 = new Promise((resolve) => _resolve1 = resolve);
      const p2 = new Promise((resolve) => _resolve2 = resolve);
      expect(Promise.all([p1, p2]) instanceof Promise).toBe(true);
    });

    it ('resolves when all promises resolve', () => {
      const onResolve = jest.fn();
      let _resolve1, _resolve2;
      const p1 = new Promise((resolve) => _resolve1 = resolve);
      const p2 = new Promise((resolve) => _resolve2 = resolve);
      Promise.all([p1, p2]).then(onResolve);
      expect(onResolve).not.toHaveBeenCalled();
      _resolve1();
      _resolve2();
      expect(onResolve).toHaveBeenCalled();
    });

    it ('resolves the values from all of the promises', () => {
      const onResolve = jest.fn();
      let _resolve1, _resolve2;
      const p1 = new Promise((resolve) => _resolve1 = resolve);
      const p2 = new Promise((resolve) => _resolve2 = resolve);
      Promise.all([p1, p2]).then(onResolve);
      expect(onResolve).not.toHaveBeenCalled();
      _resolve1(1);
      _resolve2(2);
      expect(onResolve).toHaveBeenCalledWith([1, 2]);
    });

    it ('rejects when at least one promise rejects', () => {
      const onResolve = jest.fn();
      const onReject = jest.fn();
      let _resolve, _reject;
      const p1 = new Promise((resolve) => _resolve = resolve);
      const p2 = new Promise((_, reject) => _reject = reject);
      Promise.all([p1, p2]).then(onResolve, onReject);
      expect(onResolve).not.toHaveBeenCalled();
      _resolve();
      _reject();

      expect(onResolve).not.toHaveBeenCalled();
      expect(onReject).toHaveBeenCalled();
    });
  });

  describe('Promise.race', () => {
    it ('returns a promise', () => {
      const p = Promise.race();
      expect(p instanceof Promise).toBe(true);
    });

    it ('resolves the with the result from the first resolve', () => {
      const onResolve = jest.fn();
      const p1 = new Promise((resolve) => {
        setTimeout(() => resolve('r1'), 100);
      });

      const p2 = new Promise((resolve) => {
        setTimeout(() => resolve('r2'), 50);
      });

      Promise.race([p1, p2]).then(onResolve);
      expect(onResolve).not.toHaveBeenCalled();
      jest.runOnlyPendingTimers();
      expect(onResolve).toHaveBeenCalledWith('r2');
    });

    it ('rejects the with the race between resolve and reject', () => {
      const onResolve = jest.fn();
      const onReject = jest.fn();

      const p1 = new Promise((resolve) => {
        setTimeout(() => resolve('r1'), 100);
      });

      const p2 = new Promise((_, reject) => {
        setTimeout(() => reject('r2'), 50);
      });

      Promise.race([p1, p2]).then(onResolve, onReject);
      expect(onResolve).not.toHaveBeenCalled();
      expect(onReject).not.toHaveBeenCalled();
      jest.runOnlyPendingTimers();
      expect(onResolve).not.toHaveBeenCalled();
      expect(onReject).toHaveBeenCalledWith('r2');
    });
  });
});
