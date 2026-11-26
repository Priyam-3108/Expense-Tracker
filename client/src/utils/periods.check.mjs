import assert from 'node:assert/strict'
import { periodRanges, periodTitle } from './periods.js'

let r = periodRanges('month', new Date(2026, 10, 26))
assert.deepEqual(r.current, { startDate: '2026-11-01', endDate: '2026-11-26' })
assert.deepEqual(r.previous, { startDate: '2026-10-01', endDate: '2026-10-26' })

r = periodRanges('month', new Date(2026, 2, 31)) // Mar 31 -> Feb has 28 days
assert.deepEqual(r.previous, { startDate: '2026-02-01', endDate: '2026-02-28' })

r = periodRanges('month', new Date(2026, 0, 15)) // January wraps to last December
assert.deepEqual(r.previous, { startDate: '2025-12-01', endDate: '2025-12-15' })

r = periodRanges('year', new Date(2028, 1, 29)) // leap day -> Feb 28 last year
assert.deepEqual(r.current, { startDate: '2028-01-01', endDate: '2028-02-29' })
assert.deepEqual(r.previous, { startDate: '2027-01-01', endDate: '2027-02-28' })

r = periodRanges('all', new Date(2026, 10, 26))
assert.deepEqual(r, { current: { startDate: '1970-01-01', endDate: '2026-11-26' }, previous: null })

assert.equal(periodTitle('month', new Date(2026, 10, 26)), 'November 2026')
assert.equal(periodTitle('year', new Date(2026, 10, 26)), '2026')
assert.equal(periodTitle('all'), 'All time')
console.log('periods ok')
