CREATE TYPE "public"."audit_action" AS ENUM('created', 'updated', 'status_changed', 'invited', 'accepted', 'approved', 'rejected', 'converted', 'closed', 'terms_changed', 'revenue_logged', 'revenue_superseded', 'recomputed', 'statement_issued', 'statement_voided', 'payment_recorded', 'contract_generated');--> statement-breakpoint
CREATE TYPE "public"."audit_entity" AS ENUM('relationship', 'relationship_terms', 'referral', 'revenue_entry', 'fee_calculation', 'statement', 'payment', 'membership', 'contract');--> statement-breakpoint
CREATE TYPE "public"."fee_basis" AS ENUM('net_profit', 'gross_revenue', 'flat');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'card', 'check', 'cash', 'other');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('submitted', 'accepted', 'rejected', 'converted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."relationship_status" AS ENUM('invited', 'active', 'paused', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."revenue_entry_status" AS ENUM('active', 'superseded', 'void');--> statement-breakpoint
CREATE TYPE "public"."statement_status" AS ENUM('draft', 'issued', 'void');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid,
	"actor_org_id" uuid,
	"actor_user_id" uuid,
	"entity_type" "audit_entity" NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"title" text NOT NULL,
	"terms_snapshot" jsonb NOT NULL,
	"referenced_term_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"format" text DEFAULT 'markdown' NOT NULL,
	"content" text,
	"storage_url" text,
	"is_out_of_date" boolean DEFAULT false NOT NULL,
	"generated_by_user_id" uuid,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deduction_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revenue_entry_id" uuid NOT NULL,
	"referral_id" uuid NOT NULL,
	"relationship_id" uuid NOT NULL,
	"referring_org_id" uuid NOT NULL,
	"paying_org_id" uuid NOT NULL,
	"applied_terms_id" uuid,
	"basis" "fee_basis" NOT NULL,
	"basis_amount" bigint NOT NULL,
	"applied_percent_bps" integer,
	"fee_amount" bigint NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"within_tail" boolean NOT NULL,
	"tail_start" date,
	"tail_end" date,
	"note" text,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text,
	"legal_name" text NOT NULL,
	"display_name" text NOT NULL,
	"jurisdiction" text,
	"address" jsonb,
	"default_currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_clerkOrgId_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"statement_id" uuid NOT NULL,
	"relationship_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"paid_at" date NOT NULL,
	"method" "payment_method" DEFAULT 'bank_transfer' NOT NULL,
	"reference" text,
	"note" text,
	"recorded_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"submitted_by_org_id" uuid NOT NULL,
	"referred_client_name" text NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"description" text,
	"status" "referral_status" DEFAULT 'submitted' NOT NULL,
	"submitted_by_user_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by_user_id" uuid,
	"rejection_reason" text,
	"accepted_at" timestamp with time zone,
	"converted_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationship_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"referring_org_id" uuid NOT NULL,
	"paying_org_id" uuid NOT NULL,
	"fee_basis" "fee_basis" NOT NULL,
	"fee_percent_bps" integer,
	"flat_amount" bigint,
	"tail_months" integer NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"note" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relationship_terms_distinct_parties" CHECK ("relationship_terms"."referring_org_id" <> "relationship_terms"."paying_org_id"),
	CONSTRAINT "relationship_terms_basis_fields" CHECK (("relationship_terms"."fee_basis" = 'flat' and "relationship_terms"."flat_amount" is not null)
          or ("relationship_terms"."fee_basis" in ('net_profit','gross_revenue') and "relationship_terms"."fee_percent_bps" is not null))
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_a_id" uuid NOT NULL,
	"org_b_id" uuid,
	"status" "relationship_status" DEFAULT 'invited' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"invited_email" text,
	"created_by_user_id" uuid,
	"invited_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relationships_distinct_orgs" CHECK ("relationships"."org_a_id" <> "relationships"."org_b_id")
);
--> statement-breakpoint
CREATE TABLE "revenue_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_id" uuid NOT NULL,
	"period" date NOT NULL,
	"gross_revenue" bigint NOT NULL,
	"net_profit" bigint NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "revenue_entry_status" DEFAULT 'active' NOT NULL,
	"supersedes_id" uuid,
	"entered_by_user_id" uuid,
	"entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_entry_deductions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revenue_entry_id" uuid NOT NULL,
	"category_id" uuid,
	"label" text NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statement_deductions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"statement_id" uuid NOT NULL,
	"category_id" uuid,
	"label" text NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"referral_id" uuid NOT NULL,
	"referred_client_name" text NOT NULL,
	"referring_org_id" uuid NOT NULL,
	"paying_org_id" uuid NOT NULL,
	"period" date NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "statement_status" DEFAULT 'draft' NOT NULL,
	"gross_revenue" bigint DEFAULT 0 NOT NULL,
	"total_deductions" bigint DEFAULT 0 NOT NULL,
	"net_profit" bigint DEFAULT 0 NOT NULL,
	"fee_amount" bigint DEFAULT 0 NOT NULL,
	"fee_calculation_id" uuid,
	"issued_at" timestamp with time zone,
	"issued_by_user_id" uuid,
	"superseded_by_statement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerkUserId_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_org_id_organizations_id_fk" FOREIGN KEY ("actor_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deduction_categories" ADD CONSTRAINT "deduction_categories_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_calculations" ADD CONSTRAINT "fee_calculations_revenue_entry_id_revenue_entries_id_fk" FOREIGN KEY ("revenue_entry_id") REFERENCES "public"."revenue_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_calculations" ADD CONSTRAINT "fee_calculations_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_calculations" ADD CONSTRAINT "fee_calculations_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_calculations" ADD CONSTRAINT "fee_calculations_referring_org_id_organizations_id_fk" FOREIGN KEY ("referring_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_calculations" ADD CONSTRAINT "fee_calculations_paying_org_id_organizations_id_fk" FOREIGN KEY ("paying_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_calculations" ADD CONSTRAINT "fee_calculations_applied_terms_id_relationship_terms_id_fk" FOREIGN KEY ("applied_terms_id") REFERENCES "public"."relationship_terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_statement_id_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."statements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_submitted_by_org_id_organizations_id_fk" FOREIGN KEY ("submitted_by_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_terms" ADD CONSTRAINT "relationship_terms_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_terms" ADD CONSTRAINT "relationship_terms_referring_org_id_organizations_id_fk" FOREIGN KEY ("referring_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_terms" ADD CONSTRAINT "relationship_terms_paying_org_id_organizations_id_fk" FOREIGN KEY ("paying_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_terms" ADD CONSTRAINT "relationship_terms_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_org_a_id_organizations_id_fk" FOREIGN KEY ("org_a_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_org_b_id_organizations_id_fk" FOREIGN KEY ("org_b_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_supersedes_id_revenue_entries_id_fk" FOREIGN KEY ("supersedes_id") REFERENCES "public"."revenue_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_entered_by_user_id_users_id_fk" FOREIGN KEY ("entered_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_entry_deductions" ADD CONSTRAINT "revenue_entry_deductions_revenue_entry_id_revenue_entries_id_fk" FOREIGN KEY ("revenue_entry_id") REFERENCES "public"."revenue_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_entry_deductions" ADD CONSTRAINT "revenue_entry_deductions_category_id_deduction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."deduction_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_deductions" ADD CONSTRAINT "statement_deductions_statement_id_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."statements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_deductions" ADD CONSTRAINT "statement_deductions_category_id_deduction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."deduction_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_referring_org_id_organizations_id_fk" FOREIGN KEY ("referring_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_paying_org_id_organizations_id_fk" FOREIGN KEY ("paying_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_fee_calculation_id_fee_calculations_id_fk" FOREIGN KEY ("fee_calculation_id") REFERENCES "public"."fee_calculations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_issued_by_user_id_users_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_superseded_by_statement_id_statements_id_fk" FOREIGN KEY ("superseded_by_statement_id") REFERENCES "public"."statements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_rel_idx" ON "audit_log" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contracts_rel_idx" ON "contracts" USING btree ("relationship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deduction_categories_org_code_uq" ON "deduction_categories" USING btree ("org_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_calculations_entry_uq" ON "fee_calculations" USING btree ("revenue_entry_id");--> statement-breakpoint
CREATE INDEX "fee_calculations_referral_idx" ON "fee_calculations" USING btree ("referral_id");--> statement-breakpoint
CREATE INDEX "fee_calculations_rel_idx" ON "fee_calculations" USING btree ("relationship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_org_user_uq" ON "memberships" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_statement_idx" ON "payments" USING btree ("statement_id");--> statement-breakpoint
CREATE INDEX "payments_rel_idx" ON "payments" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX "referrals_rel_idx" ON "referrals" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX "referrals_status_idx" ON "referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referrals_submitter_idx" ON "referrals" USING btree ("submitted_by_org_id");--> statement-breakpoint
CREATE INDEX "relationship_terms_rel_idx" ON "relationship_terms" USING btree ("relationship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "relationship_terms_active_uq" ON "relationship_terms" USING btree ("relationship_id","referring_org_id","paying_org_id") WHERE "relationship_terms"."effective_to" is null;--> statement-breakpoint
CREATE INDEX "relationships_org_a_idx" ON "relationships" USING btree ("org_a_id");--> statement-breakpoint
CREATE INDEX "relationships_org_b_idx" ON "relationships" USING btree ("org_b_id");--> statement-breakpoint
CREATE INDEX "revenue_entries_referral_idx" ON "revenue_entries" USING btree ("referral_id");--> statement-breakpoint
CREATE INDEX "revenue_entries_period_idx" ON "revenue_entries" USING btree ("period");--> statement-breakpoint
CREATE UNIQUE INDEX "revenue_entries_active_uq" ON "revenue_entries" USING btree ("referral_id","period") WHERE "revenue_entries"."status" = 'active';--> statement-breakpoint
CREATE INDEX "revenue_entry_deductions_entry_idx" ON "revenue_entry_deductions" USING btree ("revenue_entry_id");--> statement-breakpoint
CREATE INDEX "statement_deductions_statement_idx" ON "statement_deductions" USING btree ("statement_id");--> statement-breakpoint
CREATE INDEX "statements_rel_idx" ON "statements" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX "statements_referral_idx" ON "statements" USING btree ("referral_id");--> statement-breakpoint
CREATE UNIQUE INDEX "statements_referral_period_uq" ON "statements" USING btree ("referral_id","period");