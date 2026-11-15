import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImportConflictDialog } from '../ImportConflictDialog'

describe('ImportConflictDialog', () => {
  function renderDialog() {
    const onReplace = vi.fn()
    const onImportAsNew = vi.fn()
    const onCancel = vi.fn()
    render(
      <ImportConflictDialog
        importedProjectName="Payments (imported)"
        existingProjectName="Payments"
        onReplace={onReplace}
        onImportAsNew={onImportAsNew}
        onCancel={onCancel}
      />
    )
    return { onReplace, onImportAsNew, onCancel }
  }

  it('shows the existing and imported project names', () => {
    renderDialog()
    expect(screen.getByText('"Payments"')).toBeInTheDocument()
    expect(screen.getByText('"Payments (imported)"')).toBeInTheDocument()
  })

  it('calls only onReplace when Replace existing project is clicked', () => {
    const { onReplace, onImportAsNew, onCancel } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Replace existing project' }))
    expect(onReplace).toHaveBeenCalledTimes(1)
    expect(onImportAsNew).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls only onImportAsNew when Import as new project is clicked', () => {
    const { onReplace, onImportAsNew, onCancel } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Import as new project' }))
    expect(onImportAsNew).toHaveBeenCalledTimes(1)
    expect(onReplace).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls only onCancel when Cancel is clicked', () => {
    const { onReplace, onImportAsNew, onCancel } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onReplace).not.toHaveBeenCalled()
    expect(onImportAsNew).not.toHaveBeenCalled()
  })

  it('calls onCancel when the close (X) button is clicked', () => {
    const { onCancel } = renderDialog()
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
