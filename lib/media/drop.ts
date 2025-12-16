export async function getFilesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  const items = Array.from(dt.items ?? [])
  const hasEntries = items.some((i) => typeof (i as any).webkitGetAsEntry === "function")

  if (!hasEntries) {
    return Array.from(dt.files ?? []).filter((f) => f && f.size >= 0)
  }

  const files: File[] = []

  const walkEntry = async (entry: any): Promise<void> => {
    if (!entry) return

    if (entry.isFile) {
      await new Promise<void>((resolve) => {
        entry.file((file: File) => {
          files.push(file)
          resolve()
        })
      })
      return
    }

    if (entry.isDirectory) {
      const reader = entry.createReader()
      const readBatch = async (): Promise<any[]> =>
        await new Promise((resolve) => {
          reader.readEntries((entries: any[]) => resolve(entries || []))
        })

      // readEntries returns batches
      while (true) {
        const batch = await readBatch()
        if (!batch.length) break
        for (const child of batch) await walkEntry(child)
      }
    }
  }

  for (const item of items) {
    const entry = (item as any).webkitGetAsEntry?.()
    if (entry) await walkEntry(entry)
    else {
      const file = item.getAsFile()
      if (file) files.push(file)
    }
  }

  return files
}

