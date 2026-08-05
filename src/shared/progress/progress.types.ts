export type ProgressTaskType =
  | "PDF_GENERAL"
  | "PDF_EXPORT_IMAGES"
  | "EXCEL_REPORT"
  | "PHOTO_UPLOAD"
  | "EXCEL_IMPORT"
  | "GENERIC_TASK"
  | "LIBERAR_IMAGENES";

export interface ProgressEvent {
  step?: string;
  message: string;
  subMessage?: string;
  current?: number;
  total?: number;
  percent?: number;
  taskType?: ProgressTaskType;
}
