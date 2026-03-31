-- Add source column to subscriptions to distinguish Stripe-synced vs manually granted rows.
ALTER TABLE subscriptions ADD COLUMN source TEXT NOT NULL DEFAULT 'stripe';
