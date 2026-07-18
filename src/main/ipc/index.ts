import { registerTaskHandlers } from './task.handlers'
import { registerFileHandlers } from './file.handlers'
import { registerVersionHandlers } from './version.handlers'
import { registerStyleHandlers } from './style.handlers'
import { registerDialogHandlers } from './dialog.handlers'
import { registerPdfHandlers } from './pdf.handlers'
import { registerFeedbackHandlers } from './feedback.handlers'

export function registerAllHandlers(): void {
  registerTaskHandlers()
  registerFileHandlers()
  registerVersionHandlers()
  registerStyleHandlers()
  registerDialogHandlers()
  registerPdfHandlers()
  registerFeedbackHandlers()
}
