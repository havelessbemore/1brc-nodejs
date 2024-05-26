export const enum RequestType {
  PROCESS,
  MERGE,
}

export interface Request {
  type: RequestType;
}
