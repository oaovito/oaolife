import 'fake-indexeddb/auto';

import { beforeEach, afterEach, vi } from 'vitest';
// Legacy regression fixtures predate the explicitly configured November cycle.
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-01T12:00:00-03:00'));});
afterEach(()=>vi.useRealTimers());
