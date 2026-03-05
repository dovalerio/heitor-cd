import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '../../renderer/services/eventBusService';

// Helper to access a fresh isolated EventBus instance per test
// Since eventBus is a singleton, we clean up subscriptions between tests manually.

describe('eventBusService', () => {
  beforeEach(() => {
    // No built-in reset, but we use unique event names per test group
    // and off() in afterEach where needed.
  });

  describe('on / emit', () => {
    it('fires the callback with the correct data when event is emitted', () => {
      const cb = vi.fn();
      eventBus.on('test:basic', cb);

      eventBus.emit('test:basic', { value: 42 });

      expect(cb).toHaveBeenCalledOnce();
      expect(cb).toHaveBeenCalledWith({ value: 42 });

      eventBus.off('test:basic', cb);
    });

    it('fires the callback multiple times on multiple emits', () => {
      const cb = vi.fn();
      eventBus.on('test:multi-emit', cb);

      eventBus.emit('test:multi-emit', 'first');
      eventBus.emit('test:multi-emit', 'second');
      eventBus.emit('test:multi-emit', 'third');

      expect(cb).toHaveBeenCalledTimes(3);
      expect(cb).toHaveBeenNthCalledWith(1, 'first');
      expect(cb).toHaveBeenNthCalledWith(2, 'second');
      expect(cb).toHaveBeenNthCalledWith(3, 'third');

      eventBus.off('test:multi-emit', cb);
    });

    it('does not fire callback for a different event', () => {
      const cb = vi.fn();
      eventBus.on('test:event-a', cb);

      eventBus.emit('test:event-b', 'irrelevant');

      expect(cb).not.toHaveBeenCalled();

      eventBus.off('test:event-a', cb);
    });

    it('does nothing when emitting an event with no subscribers', () => {
      // Should not throw
      expect(() => eventBus.emit('test:no-subscribers', 'data')).not.toThrow();
    });
  });

  describe('off', () => {
    it('unregisters the callback so it is no longer called after off', () => {
      const cb = vi.fn();
      eventBus.on('test:off-basic', cb);
      eventBus.off('test:off-basic', cb);

      eventBus.emit('test:off-basic', 'payload');

      expect(cb).not.toHaveBeenCalled();
    });

    it('only removes the specified callback, not others', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      eventBus.on('test:off-selective', cb1);
      eventBus.on('test:off-selective', cb2);

      eventBus.off('test:off-selective', cb1);
      eventBus.emit('test:off-selective', 'hello');

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledWith('hello');

      eventBus.off('test:off-selective', cb2);
    });

    it('does not throw when calling off for an unregistered callback', () => {
      const cb = vi.fn();
      expect(() => eventBus.off('test:off-unknown', cb)).not.toThrow();
    });

    it('does not throw when calling off for a callback that was already removed', () => {
      const cb = vi.fn();
      eventBus.on('test:off-double', cb);
      eventBus.off('test:off-double', cb);
      // Second off should be a no-op
      expect(() => eventBus.off('test:off-double', cb)).not.toThrow();
    });
  });

  describe('multiple subscribers', () => {
    it('calls all subscribers when an event is emitted', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const cb3 = vi.fn();

      eventBus.on('test:multi-subs', cb1);
      eventBus.on('test:multi-subs', cb2);
      eventBus.on('test:multi-subs', cb3);

      eventBus.emit('test:multi-subs', 'broadcast');

      expect(cb1).toHaveBeenCalledWith('broadcast');
      expect(cb2).toHaveBeenCalledWith('broadcast');
      expect(cb3).toHaveBeenCalledWith('broadcast');

      eventBus.off('test:multi-subs', cb1);
      eventBus.off('test:multi-subs', cb2);
      eventBus.off('test:multi-subs', cb3);
    });

    it('subscribing the same callback twice has no effect (called once)', () => {
      const cb = vi.fn();
      eventBus.on('test:dedup', cb);
      eventBus.on('test:dedup', cb); // duplicate

      eventBus.emit('test:dedup', 'ping');

      expect(cb).toHaveBeenCalledOnce();

      eventBus.off('test:dedup', cb);
    });
  });

  describe('typed generic usage', () => {
    it('works with typed string payload', () => {
      const cb = vi.fn<[string], void>();
      eventBus.on<string>('test:typed-string', cb);

      eventBus.emit<string>('test:typed-string', 'hello');

      expect(cb).toHaveBeenCalledWith('hello');

      eventBus.off<string>('test:typed-string', cb);
    });

    it('works with typed object payload', () => {
      type Payload = { id: number; name: string };
      const cb = vi.fn<[Payload], void>();
      eventBus.on<Payload>('test:typed-object', cb);

      eventBus.emit<Payload>('test:typed-object', { id: 1, name: 'test' });

      expect(cb).toHaveBeenCalledWith({ id: 1, name: 'test' });

      eventBus.off<Payload>('test:typed-object', cb);
    });

    it('works with numeric payload', () => {
      const cb = vi.fn<[number], void>();
      eventBus.on<number>('test:typed-number', cb);

      eventBus.emit<number>('test:typed-number', 99);

      expect(cb).toHaveBeenCalledWith(99);

      eventBus.off<number>('test:typed-number', cb);
    });
  });

  describe('callback safety during emit', () => {
    it('does not fail if a callback calls off during emit', () => {
      const cb = vi.fn(() => {
        eventBus.off('test:self-off', cb);
      });

      eventBus.on('test:self-off', cb);
      expect(() => eventBus.emit('test:self-off', null)).not.toThrow();
      expect(cb).toHaveBeenCalledOnce();

      // Subsequent emit should not call cb
      eventBus.emit('test:self-off', null);
      expect(cb).toHaveBeenCalledOnce();
    });
  });
});
