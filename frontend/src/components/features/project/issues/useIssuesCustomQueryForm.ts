import { useState } from "react"

const DEFAULT_COLUMNS = ["id", "tracker", "title", "assignee", "status", "priority", "progress"]

/** Custom hook managing state and validation for the custom query creation form. */
export function useIssuesCustomQueryForm() {
  const [isNewQueryOpen, setIsNewQueryOpen] = useState(false)
  const [newQueryName, setNewQueryName] = useState("")
  const [newQueryDesc, setNewQueryDesc] = useState("")
  const [newQueryForAll, setNewQueryForAll] = useState(false)
  const [newQueryDefaultCols, setNewQueryDefaultCols] = useState(true)
  const [newQueryShowRelated, setNewQueryShowRelated] = useState(true)
  const [newQueryShowProgress, setNewQueryShowProgress] = useState(false)
  const [newQuerySelectedCols, setNewQuerySelectedCols] = useState<string[]>(DEFAULT_COLUMNS)
  const [availSelectedKey, setAvailSelectedKey] = useState<string | null>(null)
  const [selSelectedKey, setSelSelectedKey] = useState<string | null>(null)

  const [newQueryFilters, setNewQueryFilters] = useState({
    status: { enabled: true, value: "open" },
    tracker: { enabled: false, value: "all" },
    priority: { enabled: false, value: "all" },
    assignee: { enabled: false, value: "all" },
    createdBy: { enabled: false, value: "all" },
  })

  const resetForm = () => {
    setIsNewQueryOpen(false)
    setNewQueryName("")
    setNewQueryDesc("")
    setNewQueryForAll(false)
    setNewQueryDefaultCols(true)
    setNewQueryShowRelated(true)
    setNewQueryShowProgress(false)
    setNewQuerySelectedCols(DEFAULT_COLUMNS)
    setNewQueryFilters({
      status: { enabled: true, value: "open" },
      tracker: { enabled: false, value: "all" },
      priority: { enabled: false, value: "all" },
      assignee: { enabled: false, value: "all" },
      createdBy: { enabled: false, value: "all" },
    })
  }

  const handleSubmitSaveQuery = (
    e: React.FormEvent,
    onSave: (payload: { name: string; projectId: string | null; queryData: string }) => void,
    projectId: string,
  ) => {
    e.preventDefault()
    if (!newQueryName.trim()) return

    const queryDataObj = {
      description: newQueryDesc.trim(),
      defaultColumns: newQueryDefaultCols,
      selectedColumns: newQuerySelectedCols,
      filters: newQueryFilters,
    }

    onSave({
      name: newQueryName.trim(),
      projectId: newQueryForAll ? null : projectId,
      queryData: JSON.stringify(queryDataObj),
    })
  }

  return {
    isNewQueryOpen,
    setIsNewQueryOpen,
    newQueryName,
    setNewQueryName,
    newQueryDesc,
    setNewQueryDesc,
    newQueryForAll,
    setNewQueryForAll,
    newQueryDefaultCols,
    setNewQueryDefaultCols,
    newQueryShowRelated,
    setNewQueryShowRelated,
    newQueryShowProgress,
    setNewQueryShowProgress,
    newQuerySelectedCols,
    setNewQuerySelectedCols,
    availSelectedKey,
    setAvailSelectedKey,
    selSelectedKey,
    setSelSelectedKey,
    newQueryFilters,
    setNewQueryFilters,
    handleSubmitSaveQuery,
    resetForm,
  }
}
