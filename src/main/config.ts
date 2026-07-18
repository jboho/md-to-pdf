/**
 * GitHub repository (owner/name) that in-app feedback is filed against as a
 * prefilled new issue. Override with the FEEDBACK_GITHUB_REPO env var.
 */
export const FEEDBACK_GITHUB_REPO = process.env.FEEDBACK_GITHUB_REPO || 'jboho/md-to-pdf'
