"use client"

import React, { createContext, useContext, useState } from "react"

interface BucketContextType {
  selectedBucket: string | null
  setSelectedBucket: (bucket: string | null) => void
}

const BucketContext = createContext<BucketContextType | undefined>(undefined)

export const BucketProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)

  return (
    <BucketContext.Provider value={{ selectedBucket, setSelectedBucket }}>
      {children}
    </BucketContext.Provider>
  )
}

export const useBucket = (): BucketContextType => {
  const context = useContext(BucketContext)
  if (!context) throw new Error("useBucket must be used within a BucketProvider")
  return context
}
