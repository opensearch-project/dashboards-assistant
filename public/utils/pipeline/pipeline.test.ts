/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pipeline } from './pipeline';

describe('pipeline', () => {
  it('should run pipeline', (done) => {
    const fn1 = jest.fn().mockImplementation((input) => {
      return Promise.resolve(Array<string>().concat(input).concat('fn1'));
    });
    const fn2 = jest.fn().mockImplementation((input) => {
      return Promise.resolve(Array<string>().concat(input).concat('fn2'));
    });
    const pipeline = new Pipeline([{ execute: fn1 }, { execute: fn2 }]);
    pipeline.getResult$().subscribe((result) => {
      expect(result).toEqual(['input', 'fn1', 'fn2']);
      expect(pipeline.status$.value).toBe('STOPPED');
      done();
    });

    expect(pipeline.status$.value).toBe('STOPPED');
    pipeline.run('input');
    expect(pipeline.status$.value).toBe('RUNNING');
  });

  it('should run pipeline with the latest input', (done) => {
    const fn1 = jest.fn().mockImplementation((input) => {
      return Promise.resolve(Array<string>().concat(input).concat('fn1'));
    });
    const fn2 = jest.fn().mockImplementation((input) => {
      return Promise.resolve(Array<string>().concat(input).concat('fn2'));
    });
    const pipeline = new Pipeline([{ execute: fn1 }, { execute: fn2 }]);
    pipeline.getResult$().subscribe((result) => {
      expect(result).toEqual(['input2', 'fn1', 'fn2']);
      expect(fn1).toHaveBeenCalledTimes(2);
      // The fn2 should only be called onece because the first pipeline run should already be canceled
      expect(fn2).toHaveBeenCalledTimes(1);
      done();
    });
    // the pipeline run twice with different inputs
    // the second pipeline.run should be make it to cancel the first pipeline run
    pipeline.run('input1');
    pipeline.run('input2');
  });

  it('should run pipeline once synchronously', async () => {
    const fn1 = jest.fn().mockImplementation((input) => {
      return Promise.resolve(Array<string>().concat(input).concat('fn1'));
    });
    const fn2 = jest.fn().mockImplementation((input) => {
      return Promise.resolve(Array<string>().concat(input).concat('fn2'));
    });
    const pipeline = new Pipeline([{ execute: fn1 }, { execute: fn2 }]);
    const result = await pipeline.runOnce('input');
    expect(result).toEqual(['input', 'fn1', 'fn2']);
  });

  it('should catch error', (done) => {
    const fn1 = jest.fn().mockImplementation((input) => {
      return Promise.resolve(Array<string>().concat(input).concat('fn1'));
    });
    const fn2 = jest.fn().mockImplementation(() => {
      throw new Error('test');
    });

    const pipeline = new Pipeline([{ execute: fn1 }, { execute: fn2 }]);
    pipeline.getResult$().subscribe((result) => {
      expect(result).toEqual({ error: new Error('test') });
      done();
    });
    pipeline.run('input');
  });
});
