export type ProgressTaskType =
  | 'PDF_GENERAL'
  | 'EXCEL_REPORT'
  | 'PHOTO_UPLOAD'
  | 'EXCEL_IMPORT'
  | 'GENERIC_TASK';

export interface ProgressEvent {
  step?: string;
  message: string;
  subMessage?: string;
  current?: number;
  total?: number;
  percent?: number;
  taskType?: ProgressTaskType;
}
