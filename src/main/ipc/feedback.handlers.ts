import { ipcMain, shell, app } from 'electron'
import type { CreateFeedbackInput, Feedback, FeedbackCategory } from '../../preload/types'
import { feedbackRepository } from '../db/repositories/feedback.repository'
import { FEEDBACK_GITHUB_REPO } from '../config'

const VALID_CATEGORIES: FeedbackCategory[] = ['bug', 'feature', 'general']

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  feature: 'Feature request',
  general: 'Feedback'
}

function buildGitHubIssueUrl(feedback: Feedback): string {
  const title = `[${CATEGORY_LABELS[feedback.category]}] ${feedback.message.slice(0, 60)}`
  const body = [
    feedback.message,
    '',
    '---',
    `- App version: ${feedback.appVersion}`,
    `- Platform: ${feedback.platform}`
  ].join('\n')
  const params = new URLSearchParams({ title, body, labels: `feedback,${feedback.category}` })
  return `https://github.com/${FEEDBACK_GITHUB_REPO}/issues/new?${params.toString()}`
}

export function registerFeedbackHandlers(): void {
  ipcMain.handle('feedback:submit', async (_event, input: CreateFeedbackInput) => {
    const message = input?.message?.trim()
    if (!message) throw new Error('Feedback message is required')
    const category = VALID_CATEGORIES.includes(input.category) ? input.category : 'general'

    const record = feedbackRepository.create({
      category,
      message,
      appVersion: app.getVersion(),
      platform: `${process.platform} ${process.arch}`
    })

    await shell.openExternal(buildGitHubIssueUrl(record))
    return feedbackRepository.markSubmitted(record.id)
  })

  ipcMain.handle('feedback:list', async () => {
    return feedbackRepository.findAll()
  })
}
