// ---- Domain types ----

export type TaskStatus = 'active' | 'completed' | 'archived'
export type FileStatus = 'draft' | 'editing' | 'ready' | 'converting' | 'converted' | 'error'
export type PageSize = 'A4' | 'Letter' | 'Legal' | 'A3'
export type ThemeName = 'github' | 'academic' | 'minimal' | 'manuscript'

export interface Task {
  id: string
  name: string
  description: string
  status: TaskStatus
  customCss: string
  theme: ThemeName
  pageSize: PageSize
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  outputDir: string
  createdAt: string
  updatedAt: string
  fileCount?: number
  convertedCount?: number
  readyCount?: number
}

export interface TaskFile {
  id: string
  taskId: string
  filename: string
  content: string
  status: FileStatus
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface FileVersion {
  id: string
  fileId: string
  content: string
  label: string
  createdAt: string
}

export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
}

export interface VersionDiff {
  fromVersionId: string
  toVersionId: string
  hunks: DiffHunk[]
}

export interface PdfFileProgress {
  fileId: string
  filename: string
  status: 'pending' | 'generating' | 'done' | 'error'
  error?: string
}

export interface BatchProgress {
  taskId: string
  total: number
  completed: number
  currentFile: string
  files: PdfFileProgress[]
}

export interface CreateTaskInput {
  name: string
  description?: string
  theme?: ThemeName
  pageSize?: PageSize
}

export interface UpdateTaskInput {
  name?: string
  description?: string
  status?: TaskStatus
  customCss?: string
  theme?: ThemeName
  pageSize?: PageSize
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  outputDir?: string
}

export interface CreateFileInput {
  taskId: string
  filename: string
  content: string
}

export interface UpdateFileInput {
  content?: string
  filename?: string
  status?: FileStatus
  sortOrder?: number
}

export interface QuickConvertInput {
  markdown: string
  theme: ThemeName
  customCss: string
  pageSize: PageSize
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
}

// ---- The API contract ----

export interface ElectronAPI {
  task: {
    list(): Promise<Task[]>
    get(id: string): Promise<Task | null>
    create(input: CreateTaskInput): Promise<Task>
    update(id: string, input: UpdateTaskInput): Promise<Task>
    delete(id: string): Promise<void>
    setComplete(id: string): Promise<Task>
  }

  file: {
    listByTask(taskId: string): Promise<TaskFile[]>
    get(id: string): Promise<TaskFile | null>
    create(input: CreateFileInput): Promise<TaskFile>
    createMany(inputs: CreateFileInput[]): Promise<TaskFile[]>
    update(id: string, input: UpdateFileInput): Promise<TaskFile>
    delete(id: string): Promise<void>
    importFromDisk(taskId: string): Promise<TaskFile[]>
    setStatus(id: string, status: FileStatus): Promise<TaskFile>
  }

  version: {
    listByFile(fileId: string): Promise<FileVersion[]>
    get(id: string): Promise<FileVersion | null>
    create(fileId: string, label?: string): Promise<FileVersion>
    diff(fromId: string, toId: string): Promise<VersionDiff>
    restore(versionId: string): Promise<TaskFile>
  }

  style: {
    getThemeCss(theme: ThemeName): Promise<string>
    listThemes(): Promise<ThemeName[]>
  }

  pdf: {
    generateSingle(fileId: string): Promise<string>
    generateBatch(taskId: string): Promise<void>
    onBatchProgress(callback: (progress: BatchProgress) => void): () => void
    cancelBatch(taskId: string): Promise<void>
    openOutputDir(taskId: string): Promise<void>
    quickConvert(input: QuickConvertInput): Promise<string | null>
  }

  dialog: {
    selectOutputDir(): Promise<string | null>
  }
}
