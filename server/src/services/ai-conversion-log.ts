import { nanoid } from 'nanoid';
import { getDb } from '../db/connection.js';

export interface StartConversionParams {
  userId: string;
  captureId?: string | null;
  targetFramework: string;
  targetStyling: string;
  aiModel: string;
}

export interface CompleteConversionParams {
  inputTokens: number;
  outputTokens: number;
  costMicros: number;
  responseText: string;
}

/**
 * Insert a pending ai_conversion_requests row. Returns the new row id.
 */
export function startConversion(params: StartConversionParams): string {
  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  db.prepare(
    `INSERT INTO ai_conversion_requests
       (id, user_id, capture_id, target_framework, target_styling, ai_model, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(
    id,
    params.userId,
    params.captureId ?? null,
    params.targetFramework,
    params.targetStyling,
    params.aiModel,
    now
  );

  return id;
}

/**
 * Mark a conversion as succeeded, storing token usage, cost, and response text.
 */
export function completeConversion(id: string, params: CompleteConversionParams): void {
  const db = getDb();
  db.prepare(
    `UPDATE ai_conversion_requests SET
       status = 'success',
       input_tokens = ?,
       output_tokens = ?,
       total_cost_usd_micros = ?,
       response_text = ?,
       completed_at = ?
     WHERE id = ?`
  ).run(
    params.inputTokens,
    params.outputTokens,
    params.costMicros,
    params.responseText,
    Date.now(),
    id
  );
}

/**
 * Mark a conversion as failed with an error message.
 */
export function failConversion(id: string, errorMessage: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE ai_conversion_requests SET
       status = 'error',
       error_message = ?,
       completed_at = ?
     WHERE id = ?`
  ).run(errorMessage, Date.now(), id);
}
