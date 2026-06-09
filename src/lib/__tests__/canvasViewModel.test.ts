import { describe, it, expect } from 'vitest'
import {
  coordinateSpaceFor,
  showsValueStreamScaffolding,
  showsContextMapElements,
  canvasBackdropFor,
  reservesProblemSpaceTop,
} from '../canvasViewModel'

describe('canvas view model', () => {
  describe('Context Map shows a clean context map and hides value-stream scaffolding', () => {
    it('hides all value-stream scaffolding (users, needs, wiring, stage/chain chrome)', () => {
      expect(showsValueStreamScaffolding('context-map')).toBe(false)
    })

    it('renders no value-stream backdrop (no band, stage labels, or value-chain axis)', () => {
      expect(canvasBackdropFor('context-map')).toBe('none')
    })

    it('keeps contexts, relationships, and groups visible', () => {
      expect(showsContextMapElements('context-map')).toBe(true)
    })

    it('draws contexts in Flow coordinate space (flow.x + shared.y)', () => {
      expect(coordinateSpaceFor('context-map')).toBe('flow')
    })
  })

  describe('other views are unchanged', () => {
    it('Flow shows scaffolding, its own backdrop, and flow coordinates', () => {
      expect(showsValueStreamScaffolding('flow')).toBe(true)
      expect(canvasBackdropFor('flow')).toBe('flow')
      expect(showsContextMapElements('flow')).toBe(true)
      expect(coordinateSpaceFor('flow')).toBe('flow')
    })

    it('Strategic shows scaffolding, its own backdrop, and strategic coordinates', () => {
      expect(showsValueStreamScaffolding('strategic')).toBe(true)
      expect(canvasBackdropFor('strategic')).toBe('strategic')
      expect(showsContextMapElements('strategic')).toBe(true)
      expect(coordinateSpaceFor('strategic')).toBe('strategic')
    })

    it('Distillation hides scaffolding and context-map elements, uses its own space', () => {
      expect(showsValueStreamScaffolding('distillation')).toBe(false)
      expect(canvasBackdropFor('distillation')).toBe('distillation')
      expect(showsContextMapElements('distillation')).toBe(false)
      expect(coordinateSpaceFor('distillation')).toBe('distillation')
    })
  })

  describe('reservesProblemSpaceTop', () => {
    it('reserves the top strip in the value-chain coordinate space (Flow, Strategic, Context Map)', () => {
      expect(reservesProblemSpaceTop('flow')).toBe(true)
      expect(reservesProblemSpaceTop('strategic')).toBe(true)
      expect(reservesProblemSpaceTop('context-map')).toBe(true)
    })

    it('does not reserve in Distillation, which has its own coordinate space', () => {
      expect(reservesProblemSpaceTop('distillation')).toBe(false)
    })
  })
})
