import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getDeploymentContext,
  hashProjectId,
  isAnalyticsEnabled,
  getProjectMetadata,
  trackEvent,
  initAnalytics,
  setAnalyticsEnabled,
  getAnalyticsPreference
} from './analytics'
import type { Project } from '../model/types'

vi.mock('posthog-js', () => {
  const capture = vi.fn()
  const init = vi.fn()
  const identify = vi.fn()
  const opt_in_capturing = vi.fn()
  const opt_out_capturing = vi.fn()
  return {
    default: { capture, init, identify, opt_in_capturing, opt_out_capturing },
  }
})

import posthog from 'posthog-js'

describe('analytics', () => {
  describe('getDeploymentContext', () => {
    let originalLocation: typeof window.location

    beforeEach(() => {
      originalLocation = window.location
      // @ts-ignore
      delete window.location
    })

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('returns "hosted_demo" for contextflow.virtualgenius.com', () => {
      // @ts-ignore
      window.location = { hostname: 'contextflow.virtualgenius.com' }
      expect(getDeploymentContext()).toBe('hosted_demo')
    })

    it('returns "localhost" for localhost', () => {
      // @ts-ignore
      window.location = { hostname: 'localhost' }
      expect(getDeploymentContext()).toBe('localhost')
    })

    it('returns "localhost" for 127.0.0.1', () => {
      // @ts-ignore
      window.location = { hostname: '127.0.0.1' }
      expect(getDeploymentContext()).toBe('localhost')
    })

    it('returns "self_hosted" for other domains', () => {
      // @ts-ignore
      window.location = { hostname: 'my-company.com' }
      expect(getDeploymentContext()).toBe('self_hosted')
    })
  })

  describe('hashProjectId', () => {
    it('returns consistent hash for same input', () => {
      const id = 'test-project-123'
      const hash1 = hashProjectId(id)
      const hash2 = hashProjectId(id)
      expect(hash1).toBe(hash2)
    })

    it('returns different hashes for different inputs', () => {
      const hash1 = hashProjectId('project-a')
      const hash2 = hashProjectId('project-b')
      expect(hash1).not.toBe(hash2)
    })

    it('returns hash with proj_ prefix', () => {
      const hash = hashProjectId('test-project')
      expect(hash).toMatch(/^proj_[a-z0-9]+$/)
    })

    it('returns hash of fixed length (8 chars after prefix)', () => {
      const hash = hashProjectId('test-project')
      expect(hash.length).toBe(13) // 'proj_' (5) + 8 chars
    })
  })

  describe('isAnalyticsEnabled', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('returns false when developer mode is enabled', () => {
      localStorage.setItem('contextflow.developer_mode', 'true')
      expect(isAnalyticsEnabled()).toBe(false)
    })

    it('returns true when developer mode is explicitly disabled', () => {
      localStorage.setItem('contextflow.developer_mode', 'false')
      localStorage.setItem('contextflow.analytics_enabled', 'true')
      expect(isAnalyticsEnabled()).toBe(true)
    })

    it('returns explicit user preference when set to true', () => {
      localStorage.setItem('contextflow.analytics_enabled', 'true')
      expect(isAnalyticsEnabled()).toBe(true)
    })

    it('returns explicit user preference when set to false', () => {
      localStorage.setItem('contextflow.analytics_enabled', 'false')
      expect(isAnalyticsEnabled()).toBe(false)
    })

    it('developer mode overrides explicit analytics preference', () => {
      localStorage.setItem('contextflow.developer_mode', 'true')
      localStorage.setItem('contextflow.analytics_enabled', 'true')
      expect(isAnalyticsEnabled()).toBe(false)
    })
  })

  describe('deployment-aware defaults', () => {
    let originalLocation: typeof window.location

    beforeEach(() => {
      localStorage.clear()
      originalLocation = window.location
      // @ts-ignore
      delete window.location
    })

    afterEach(() => {
      localStorage.clear()
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('defaults to ON for hosted_demo', () => {
      // @ts-ignore
      window.location = { hostname: 'contextflow.virtualgenius.com' }
      expect(isAnalyticsEnabled()).toBe(true)
    })

    it('defaults to OFF for localhost', () => {
      // @ts-ignore
      window.location = { hostname: 'localhost' }
      expect(isAnalyticsEnabled()).toBe(false)
    })

    it('defaults to OFF for self_hosted', () => {
      // @ts-ignore
      window.location = { hostname: 'my-company.com' }
      expect(isAnalyticsEnabled()).toBe(false)
    })

    it('explicit user preference overrides hosted_demo default', () => {
      // @ts-ignore
      window.location = { hostname: 'contextflow.virtualgenius.com' }
      localStorage.setItem('contextflow.analytics_enabled', 'false')
      expect(isAnalyticsEnabled()).toBe(false)
    })

    it('explicit user preference overrides localhost default', () => {
      // @ts-ignore
      window.location = { hostname: 'localhost' }
      localStorage.setItem('contextflow.analytics_enabled', 'true')
      expect(isAnalyticsEnabled()).toBe(true)
    })
  })

  describe('setAnalyticsEnabled', () => {
    beforeEach(() => {
      localStorage.clear()
      vi.mocked(posthog.opt_in_capturing).mockClear()
      vi.mocked(posthog.opt_out_capturing).mockClear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('stores preference and calls opt_in_capturing when enabled', () => {
      setAnalyticsEnabled(true)
      expect(localStorage.getItem('contextflow.analytics_enabled')).toBe('true')
      expect(posthog.opt_in_capturing).toHaveBeenCalled()
    })

    it('stores preference and calls opt_out_capturing when disabled', () => {
      setAnalyticsEnabled(false)
      expect(localStorage.getItem('contextflow.analytics_enabled')).toBe('false')
      expect(posthog.opt_out_capturing).toHaveBeenCalled()
    })
  })

  describe('getAnalyticsPreference', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('returns null when no preference set', () => {
      expect(getAnalyticsPreference()).toBeNull()
    })

    it('returns true when preference is true', () => {
      localStorage.setItem('contextflow.analytics_enabled', 'true')
      expect(getAnalyticsPreference()).toBe(true)
    })

    it('returns false when preference is false', () => {
      localStorage.setItem('contextflow.analytics_enabled', 'false')
      expect(getAnalyticsPreference()).toBe(false)
    })
  })

  describe('initAnalytics', () => {
    let originalLocation: typeof window.location

    beforeEach(() => {
      localStorage.clear()
      vi.mocked(posthog.init).mockClear()
      vi.mocked(posthog.identify).mockClear()
      originalLocation = window.location
      // @ts-ignore
      delete window.location
    })

    afterEach(() => {
      localStorage.clear()
      vi.unstubAllEnvs()
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('calls posthog.init with privacy-hardened config when analytics enabled', () => {
      // @ts-ignore
      window.location = { hostname: 'contextflow.virtualgenius.com' }
      vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test_key')

      initAnalytics()

      expect(posthog.init).toHaveBeenCalledWith('phc_test_key', {
        api_host: 'https://us.i.posthog.com',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        disable_surveys: true,
        persistence: 'memory',
        ip: false,
        property_denylist: [
          '$current_url',
          '$pathname',
          '$referrer',
          '$referring_domain',
          '$initial_referrer',
          '$initial_referring_domain',
        ],
      })
      expect(posthog.identify).toHaveBeenCalledWith(expect.any(String))
    })

    it('does not call posthog.init when analytics disabled', () => {
      // @ts-ignore
      window.location = { hostname: 'localhost' }

      initAnalytics()

      expect(posthog.init).not.toHaveBeenCalled()
    })

    it('does not call posthog.init when no API key', () => {
      // @ts-ignore
      window.location = { hostname: 'contextflow.virtualgenius.com' }
      vi.stubEnv('VITE_POSTHOG_KEY', '')

      initAnalytics()

      expect(posthog.init).not.toHaveBeenCalled()
    })
  })

  describe('getProjectMetadata', () => {
    it('returns null when no project provided', () => {
      expect(getProjectMetadata(null)).toBeNull()
    })

    it('extracts basic project metrics', () => {
      const project: Project = {
        id: 'test-project-123',
        name: 'Test Project',
        contexts: [{} as any, {} as any, {} as any], // 3 contexts
        relationships: [{} as any, {} as any], // 2 relationships
        groups: [{} as any], // 1 group
        repos: [
          { id: '1', name: 'repo1', contextId: 'ctx1', teamIds: [], contributors: [] },
          { id: '2', name: 'repo2', contextId: undefined, teamIds: [], contributors: [] },
          { id: '3', name: 'repo3', contextId: 'ctx2', remoteUrl: 'https://github.com/test/repo', teamIds: [], contributors: [] }
        ],
        people: [{} as any, {} as any],
        teams: [{} as any],
        users: [],
        userNeeds: [],
        userNeedConnections: [],
        needContextConnections: [],
        viewConfig: { flowStages: [{} as any, {} as any] }
      }

      const metadata = getProjectMetadata(project)

      expect(metadata).toEqual({
        project_id: expect.stringMatching(/^proj_[a-z0-9]+$/),
        context_count: 3,
        relationship_count: 2,
        group_count: 1,
        repo_count: 3,
        repo_assignment_count: 2,
        repo_with_url_count: 1,
        person_count: 2,
        team_count: 1,
        contributor_count: 0,
        has_temporal: false,
        keyframe_count: 0,
        user_count: 0,
        need_count: 0,
        user_need_connection_count: 0,
        need_context_connection_count: 0,
        flow_stage_marker_count: 2
      })
    })

    it('counts contributors across all repos', () => {
      const project: Project = {
        id: 'test',
        name: 'Test',
        contexts: [],
        relationships: [],
        groups: [],
        repos: [
          { id: '1', name: 'r1', teamIds: [], contributors: [{ personId: 'p1' }, { personId: 'p2' }] },
          { id: '2', name: 'r2', teamIds: [], contributors: [{ personId: 'p3' }] }
        ],
        people: [],
        teams: [],
        users: [],
        userNeeds: [],
        userNeedConnections: [],
        needContextConnections: [],
        viewConfig: { flowStages: [] }
      }

      const metadata = getProjectMetadata(project)
      expect(metadata?.contributor_count).toBe(3)
    })

    it('handles temporal enabled with keyframes', () => {
      const project: Project = {
        id: 'test',
        name: 'Test',
        contexts: [],
        relationships: [],
        groups: [],
        repos: [],
        people: [],
        teams: [],
        users: [],
        userNeeds: [],
        userNeedConnections: [],
        needContextConnections: [],
        viewConfig: { flowStages: [] },
        temporal: {
          enabled: true,
          keyframes: [{} as any, {} as any, {} as any]
        }
      }

      const metadata = getProjectMetadata(project)
      expect(metadata?.has_temporal).toBe(true)
      expect(metadata?.keyframe_count).toBe(3)
    })

    it('handles temporal disabled', () => {
      const project: Project = {
        id: 'test',
        name: 'Test',
        contexts: [],
        relationships: [],
        groups: [],
        repos: [],
        people: [],
        teams: [],
        users: [],
        userNeeds: [],
        userNeedConnections: [],
        needContextConnections: [],
        viewConfig: { flowStages: [] },
        temporal: {
          enabled: false,
          keyframes: [{} as any]
        }
      }

      const metadata = getProjectMetadata(project)
      expect(metadata?.has_temporal).toBe(false)
    })

    it('counts users and needs', () => {
      const project: Project = {
        id: 'test',
        name: 'Test',
        contexts: [],
        relationships: [],
        groups: [],
        repos: [],
        people: [],
        teams: [],
        users: [{} as any, {} as any],
        userNeeds: [{} as any, {} as any, {} as any],
        userNeedConnections: [{} as any],
        needContextConnections: [{} as any, {} as any],
        viewConfig: { flowStages: [] }
      }

      const metadata = getProjectMetadata(project)
      expect(metadata?.user_count).toBe(2)
      expect(metadata?.need_count).toBe(3)
      expect(metadata?.user_need_connection_count).toBe(1)
      expect(metadata?.need_context_connection_count).toBe(2)
    })
  })

  describe('trackEvent', () => {
    let originalLocation: typeof window.location

    beforeEach(() => {
      localStorage.clear()
      vi.mocked(posthog.capture).mockClear()
      originalLocation = window.location
      // @ts-ignore
      delete window.location
      // @ts-ignore
      window.location = { hostname: 'contextflow.virtualgenius.com' }
    })

    afterEach(() => {
      localStorage.clear()
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('does not call posthog.capture when developer mode is enabled', () => {
      localStorage.setItem('contextflow.developer_mode', 'true')
      trackEvent('test_event', null, {})
      expect(posthog.capture).not.toHaveBeenCalled()
    })

    it('does not call posthog.capture when analytics preference is off', () => {
      localStorage.setItem('contextflow.analytics_enabled', 'false')
      trackEvent('test_event', null, {})
      expect(posthog.capture).not.toHaveBeenCalled()
    })

    it('calls posthog.capture with event name and metadata', () => {
      const project: Project = {
        id: 'test-project',
        name: 'Test',
        contexts: [{} as any],
        relationships: [],
        groups: [],
        repos: [],
        people: [],
        teams: [],
        users: [],
        userNeeds: [],
        userNeedConnections: [],
        needContextConnections: [],
        viewConfig: { flowStages: [] }
      }

      trackEvent('test_event', project, { custom: 'value' })

      expect(posthog.capture).toHaveBeenCalledWith('test_event', {
        deployment: 'hosted_demo',
        app_version: expect.any(String),
        project_id: expect.stringMatching(/^proj_[a-z0-9]+$/),
        context_count: 1,
        relationship_count: 0,
        group_count: 0,
        repo_count: 0,
        repo_assignment_count: 0,
        repo_with_url_count: 0,
        person_count: 0,
        team_count: 0,
        contributor_count: 0,
        has_temporal: false,
        keyframe_count: 0,
        user_count: 0,
        need_count: 0,
        user_need_connection_count: 0,
        need_context_connection_count: 0,
        flow_stage_marker_count: 0,
        custom: 'value'
      })
    })

    it('handles null project gracefully', () => {
      trackEvent('test_event', null, { custom: 'value' })

      expect(posthog.capture).toHaveBeenCalledWith('test_event', {
        deployment: 'hosted_demo',
        app_version: expect.any(String),
        custom: 'value'
      })
    })

    it('handles posthog.capture throwing error (silent failure)', () => {
      vi.mocked(posthog.capture).mockImplementationOnce(() => {
        throw new Error('Network error')
      })

      expect(() => trackEvent('test_event', null, {})).not.toThrow()
    })
  })
})
