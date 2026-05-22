import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PillGroup, type PillOption } from '../inspectorShared'

type Size = 'small' | 'medium' | 'large'

const OPTIONS: ReadonlyArray<PillOption<Size>> = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

function renderGroup(props: {
  value: Size | undefined
  onChange?: (next: Size | undefined) => void
  labelText?: string
  labelId?: string
}) {
  const labelId = props.labelId ?? 'size-label'
  const labelText = props.labelText ?? 'Size'
  const onChange = props.onChange ?? vi.fn()
  return {
    onChange,
    ...render(
      <div>
        <span id={labelId}>{labelText}</span>
        <PillGroup
          labelId={labelId}
          options={OPTIONS}
          value={props.value}
          onChange={onChange}
          layout="horizontal"
          variant="green"
        />
        <button>Outside</button>
      </div>
    ),
  }
}

describe('PillGroup (WAI-ARIA radiogroup)', () => {
  it('renders a radiogroup labeled by labelId', () => {
    renderGroup({ value: 'medium', labelId: 'size-label', labelText: 'Size' })
    const group = screen.getByRole('radiogroup', { name: 'Size' })
    expect(group).toHaveAttribute('aria-labelledby', 'size-label')
  })

  it('renders each pill as a radio with aria-checked reflecting selection', () => {
    renderGroup({ value: 'medium' })
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    expect(radios[2]).toHaveAttribute('aria-checked', 'false')
  })

  describe('roving tabindex', () => {
    it('makes the selected pill the only tabbable one', () => {
      renderGroup({ value: 'medium' })
      const radios = screen.getAllByRole('radio')
      expect(radios[0]).toHaveAttribute('tabindex', '-1')
      expect(radios[1]).toHaveAttribute('tabindex', '0')
      expect(radios[2]).toHaveAttribute('tabindex', '-1')
    })

    it('makes the first pill tabbable when nothing is selected', () => {
      renderGroup({ value: undefined })
      const radios = screen.getAllByRole('radio')
      expect(radios[0]).toHaveAttribute('tabindex', '0')
      expect(radios[1]).toHaveAttribute('tabindex', '-1')
      expect(radios[2]).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('keyboard interaction', () => {
    it('ArrowRight from selected pill moves focus and selection forward', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'small', onChange })
      const radios = screen.getAllByRole('radio')
      radios[0].focus()
      fireEvent.keyDown(radios[0], { key: 'ArrowRight' })
      expect(onChange).toHaveBeenCalledWith('medium')
    })

    it('ArrowRight from last pill wraps to first', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'large', onChange })
      const radios = screen.getAllByRole('radio')
      radios[2].focus()
      fireEvent.keyDown(radios[2], { key: 'ArrowRight' })
      expect(onChange).toHaveBeenCalledWith('small')
    })

    it('ArrowLeft from first pill wraps to last', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'small', onChange })
      const radios = screen.getAllByRole('radio')
      radios[0].focus()
      fireEvent.keyDown(radios[0], { key: 'ArrowLeft' })
      expect(onChange).toHaveBeenCalledWith('large')
    })

    it('ArrowDown behaves like ArrowRight', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'small', onChange })
      const radios = screen.getAllByRole('radio')
      radios[0].focus()
      fireEvent.keyDown(radios[0], { key: 'ArrowDown' })
      expect(onChange).toHaveBeenCalledWith('medium')
    })

    it('ArrowUp behaves like ArrowLeft', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'medium', onChange })
      const radios = screen.getAllByRole('radio')
      radios[1].focus()
      fireEvent.keyDown(radios[1], { key: 'ArrowUp' })
      expect(onChange).toHaveBeenCalledWith('small')
    })

    it('Home selects the first pill', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'large', onChange })
      const radios = screen.getAllByRole('radio')
      radios[2].focus()
      fireEvent.keyDown(radios[2], { key: 'Home' })
      expect(onChange).toHaveBeenCalledWith('small')
    })

    it('End selects the last pill', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'small', onChange })
      const radios = screen.getAllByRole('radio')
      radios[0].focus()
      fireEvent.keyDown(radios[0], { key: 'End' })
      expect(onChange).toHaveBeenCalledWith('large')
    })

    it('Space selects the focused pill', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'small', onChange })
      const radios = screen.getAllByRole('radio')
      radios[2].focus()
      fireEvent.keyDown(radios[2], { key: ' ' })
      expect(onChange).toHaveBeenCalledWith('large')
    })

    it('Enter selects the focused pill', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'small', onChange })
      const radios = screen.getAllByRole('radio')
      radios[1].focus()
      fireEvent.keyDown(radios[1], { key: 'Enter' })
      expect(onChange).toHaveBeenCalledWith('medium')
    })

    it('moves DOM focus on ArrowRight to next pill', () => {
      renderGroup({ value: 'small' })
      const radios = screen.getAllByRole('radio')
      radios[0].focus()
      fireEvent.keyDown(radios[0], { key: 'ArrowRight' })
      expect(document.activeElement).toBe(radios[1])
    })

    it('moves DOM focus on End to last pill', () => {
      renderGroup({ value: 'small' })
      const radios = screen.getAllByRole('radio')
      radios[0].focus()
      fireEvent.keyDown(radios[0], { key: 'End' })
      expect(document.activeElement).toBe(radios[2])
    })
  })

  describe('mouse interaction (unchanged)', () => {
    it('clicking a pill selects it', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'small', onChange })
      const radios = screen.getAllByRole('radio')
      fireEvent.click(radios[2])
      expect(onChange).toHaveBeenCalledWith('large')
    })

    it('clicking the active pill deselects it', () => {
      const onChange = vi.fn()
      renderGroup({ value: 'medium', onChange })
      const radios = screen.getAllByRole('radio')
      fireEvent.click(radios[1])
      expect(onChange).toHaveBeenCalledWith(undefined)
    })
  })
})
