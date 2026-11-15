import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupCreateDialog } from '../GroupCreateDialog'

describe('GroupCreateDialog', () => {
  function renderDialog(contextCount = 3) {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <GroupCreateDialog contextCount={contextCount} onConfirm={onConfirm} onCancel={onCancel} />
    )
    return { onConfirm, onCancel }
  }

  const labelInput = () => screen.getByPlaceholderText('e.g., Customer-Facing Services')
  const createButton = () => screen.getByRole('button', { name: 'Create Group' })

  it('shows the selected context count with correct pluralization', () => {
    renderDialog(3)
    expect(screen.getByText('Creating group with 3 selected contexts')).toBeInTheDocument()
  })

  it('uses the singular form for one context', () => {
    renderDialog(1)
    expect(screen.getByText('Creating group with 1 selected context')).toBeInTheDocument()
  })

  it('disables Create Group while the label is empty or whitespace', () => {
    renderDialog()
    expect(createButton()).toBeDisabled()
    fireEvent.change(labelInput(), { target: { value: '   ' } })
    expect(createButton()).toBeDisabled()
  })

  it('calls onConfirm with the trimmed label, default color, and no notes', () => {
    const { onConfirm } = renderDialog()
    fireEvent.change(labelInput(), { target: { value: '  Core  ' } })
    fireEvent.click(createButton())
    expect(onConfirm).toHaveBeenCalledWith('Core', '#3b82f6', undefined)
  })

  it('passes the preset color that was clicked', () => {
    const { onConfirm } = renderDialog()
    fireEvent.change(labelInput(), { target: { value: 'Core' } })
    fireEvent.click(screen.getByTitle('Purple'))
    fireEvent.click(createButton())
    expect(onConfirm).toHaveBeenCalledWith('Core', '#a855f7', undefined)
  })

  it('passes a custom hex color typed into the text field', () => {
    const { onConfirm } = renderDialog()
    fireEvent.change(labelInput(), { target: { value: 'Core' } })
    fireEvent.change(screen.getByPlaceholderText('#3b82f6'), { target: { value: '#123456' } })
    fireEvent.click(createButton())
    expect(onConfirm).toHaveBeenCalledWith('Core', '#123456', undefined)
  })

  it('passes trimmed notes when provided', () => {
    const { onConfirm } = renderDialog()
    fireEvent.change(labelInput(), { target: { value: 'Core' } })
    fireEvent.change(screen.getByPlaceholderText('Additional context about this group...'), {
      target: { value: '  Owned by team A  ' },
    })
    fireEvent.click(createButton())
    expect(onConfirm).toHaveBeenCalledWith('Core', '#3b82f6', 'Owned by team A')
  })

  it('passes undefined notes when notes are whitespace only', () => {
    const { onConfirm } = renderDialog()
    fireEvent.change(labelInput(), { target: { value: 'Core' } })
    fireEvent.change(screen.getByPlaceholderText('Additional context about this group...'), {
      target: { value: '   ' },
    })
    fireEvent.click(createButton())
    expect(onConfirm).toHaveBeenCalledWith('Core', '#3b82f6', undefined)
  })

  it('does not call onConfirm when submitted with a whitespace-only label', () => {
    const { onConfirm } = renderDialog()
    fireEvent.change(labelInput(), { target: { value: '   ' } })
    fireEvent.submit(labelInput())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const { onConfirm, onCancel } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onCancel when the close (X) button is clicked', () => {
    const { onCancel } = renderDialog()
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
