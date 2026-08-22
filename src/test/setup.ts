import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// 防止设置持久化（localStorage）跨测试污染
beforeEach(() => {
  localStorage.clear()
})
