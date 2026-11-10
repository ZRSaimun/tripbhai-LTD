CREATE UNIQUE INDEX `clients_account_id_unique` ON `clients` (`account_id`);
--> statement-breakpoint
CREATE TRIGGER appointments_no_overlap_insert BEFORE INSERT ON appointments
WHEN NEW.status='confirmed' AND EXISTS(SELECT 1 FROM appointments WHERE staff_id=NEW.staff_id AND status='confirmed' AND starts_at<NEW.ends_at AND ends_at>NEW.starts_at)
BEGIN SELECT RAISE(ABORT, 'appointment_overlap'); END;
--> statement-breakpoint
CREATE TRIGGER appointments_no_overlap_update BEFORE UPDATE ON appointments
WHEN NEW.status='confirmed' AND EXISTS(SELECT 1 FROM appointments WHERE id!=NEW.id AND staff_id=NEW.staff_id AND status='confirmed' AND starts_at<NEW.ends_at AND ends_at>NEW.starts_at)
BEGIN SELECT RAISE(ABORT, 'appointment_overlap'); END;
--> statement-breakpoint
CREATE TRIGGER documents_version_limit BEFORE INSERT ON document_versions
WHEN (SELECT COUNT(*) FROM document_versions WHERE item_id=NEW.item_id)>=20
BEGIN SELECT RAISE(ABORT, 'version_limit'); END;
--> statement-breakpoint
CREATE UNIQUE INDEX template_destination_version ON checklist_templates(destination,version);
