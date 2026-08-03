'use client'
import { useEffect, useRef } from 'react'

/**
 * useIgnoredEffect
 * @param effect - Hàm callback của effect
 * @param triggerDeps - Các dependency sẽ kích hoạt effect khi thay đổi
 * @param ignoredDeps - Các dependency sẽ cập nhật tham chiếu nhưng không kích hoạt effect
 */
export function useIgnoredEffect(
  effect: () => void | (() => void),
  triggerDeps: any[],
  ignoredDeps: any[],
) {
  const ignoredDepsRef = useRef(ignoredDeps)

  // Cập nhật ref khi ignoredDeps thay đổi, nhưng không kích hoạt effect
  useEffect(() => {
    ignoredDepsRef.current = ignoredDeps
  }, ignoredDeps)

  useEffect(effect, triggerDeps)
}
