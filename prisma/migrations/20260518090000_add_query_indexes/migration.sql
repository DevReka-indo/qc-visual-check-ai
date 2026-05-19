-- Add indexes used by the local PostgreSQL-backed dashboard queries.
CREATE INDEX IF NOT EXISTS "users_division_id_idx" ON "users"("division_id");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");

CREATE INDEX IF NOT EXISTS "inspections_division_id_idx" ON "inspections"("division_id");
CREATE INDEX IF NOT EXISTS "inspections_inspection_date_idx" ON "inspections"("inspection_date");
CREATE INDEX IF NOT EXISTS "inspections_inspector_id_idx" ON "inspections"("inspector_id");
CREATE INDEX IF NOT EXISTS "inspections_validation_status_idx" ON "inspections"("validation_status");

CREATE INDEX IF NOT EXISTS "anomalies_inspection_id_idx" ON "anomalies"("inspection_id");
