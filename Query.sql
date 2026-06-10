SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'hms_db' AND pid <> pg_backend_pid();

UPDATE invoices SET payment_status = 'PENDING' WHERE id = 2;

CREATE EXTENSION IF NOT EXISTS unaccent;

select * from invoices

SELECT * FROM customers WHERE full_name ILIKE '%tran%';

SELECT * FROM customers

