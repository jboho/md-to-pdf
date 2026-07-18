import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { cssThemeRepository } from './cssTheme.repository'

let db: Database.Database

beforeEach(() => {
  db = createTestDb()
})

afterEach(() => {
  closeTestDb(db)
})

describe('cssThemeRepository', () => {
  it('creates and finds a css theme', () => {
    const theme = cssThemeRepository.create('Dark', '.markdown-body { color: #fff; }')
    expect(theme.name).toBe('Dark')
    expect(cssThemeRepository.findById(theme.id)?.css).toContain('#fff')
  })

  it('lists themes ordered by name', () => {
    cssThemeRepository.create('Zeta', '')
    cssThemeRepository.create('Alpha', '')
    expect(cssThemeRepository.findAll().map((t) => t.name)).toEqual(['Alpha', 'Zeta'])
  })

  it('updates name and css', () => {
    const theme = cssThemeRepository.create('Old', 'a {}')
    const updated = cssThemeRepository.update(theme.id, 'New', 'b {}')
    expect(updated.name).toBe('New')
    expect(updated.css).toBe('b {}')
  })

  it('deletes a theme', () => {
    const theme = cssThemeRepository.create('Temp', '')
    cssThemeRepository.delete(theme.id)
    expect(cssThemeRepository.findById(theme.id)).toBeNull()
  })

  it('rejects a duplicate name', () => {
    cssThemeRepository.create('Unique', '')
    expect(() => cssThemeRepository.create('Unique', '')).toThrow()
  })
})
