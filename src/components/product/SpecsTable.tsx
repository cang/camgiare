import React from 'react'

import type { Product } from '@/payload-types'

type Props = {
  specifications: NonNullable<Product['specifications']>
}

export const SpecsTable: React.FC<Props> = ({ specifications }) => {
  if (!specifications?.length) return null

  return (
    <div>
      <h2 className="mb-3 text-lg font-medium">Thông số kỹ thuật</h2>
      <table className="w-full text-sm">
        <tbody>
          {specifications.map((spec, index) => {
            const lines = spec.value.split('\n').filter(Boolean)

            return (
              <tr className="border-b last:border-b-0" key={index}>
                <td className="w-1/3 py-2 pr-4 align-top text-primary/60">{spec.label}</td>
                <td className="py-2 align-top">
                  {lines.length > 1 ? (
                    <ul className="list-disc space-y-1 pl-4">
                      {lines.map((line, lineIndex) => (
                        <li key={lineIndex}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    spec.value
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
