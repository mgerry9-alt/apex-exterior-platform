require 'sqlite3'
require 'json'
require 'fileutils'

module ExteriorOutreach
  class Database
    DB_PATH = File.expand_path('../../data/outreach.db', __FILE__)

    def self.instance
      @instance ||= new
    end

    def initialize(db_path = DB_PATH)
      FileUtils.mkdir_p(File.dirname(db_path))
      @db = SQLite3::Database.new(db_path)
      @db.results_as_hash = true
      @db.execute("PRAGMA foreign_keys = ON;")
      @db.execute("PRAGMA journal_mode = WAL;")
      migrate
    end

    def db
      @db
    end

    def execute(sql, *args)
      @db.execute(sql, *args)
    end

    def get_first_row(sql, *args)
      @db.get_first_row(sql, *args)
    end

    def last_insert_row_id
      @db.last_insert_row_id
    end

    private

    def migrate
      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          address TEXT,
          city TEXT DEFAULT '',
          state TEXT DEFAULT 'TX',
          zip TEXT,
          property_type TEXT DEFAULT 'Single Family',
          property_sqft INTEGER DEFAULT 2400,
          service_interest TEXT DEFAULT 'House Washing',
          lead_source TEXT DEFAULT 'Website Form',
          status TEXT DEFAULT 'New Lead',
          opt_out_sms INTEGER DEFAULT 0,
          opt_out_email INTEGER DEFAULT 0,
          sms_consent INTEGER DEFAULT 0,
          email_consent INTEGER DEFAULT 0,
          consent_recorded_at TEXT,
          quote_amount REAL DEFAULT 0.0,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS campaigns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          channel TEXT DEFAULT 'Omnichannel',
          target_audience TEXT DEFAULT 'All Leads',
          status TEXT DEFAULT 'Active',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS campaign_steps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          campaign_id INTEGER NOT NULL,
          step_order INTEGER NOT NULL,
          channel TEXT NOT NULL,
          delay_hours INTEGER DEFAULT 0,
          subject TEXT,
          body_template TEXT NOT NULL,
          variant TEXT DEFAULT 'A',
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS campaign_enrollments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          campaign_id INTEGER NOT NULL,
          contact_id INTEGER NOT NULL,
          current_step INTEGER DEFAULT 1,
          status TEXT DEFAULT 'Active',
          enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
          last_sent_at TEXT,
          next_run_at TEXT,
          attempt_count INTEGER DEFAULT 0,
          last_error TEXT,
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
          FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
          UNIQUE(campaign_id, contact_id)
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contact_id INTEGER NOT NULL,
          campaign_id INTEGER,
          step_id INTEGER,
          channel TEXT NOT NULL,
          direction TEXT NOT NULL,
          sender TEXT,
          recipient TEXT,
          subject TEXT,
          body TEXT NOT NULL,
          status TEXT DEFAULT 'sent',
          sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id INTEGER,
          contact_id INTEGER NOT NULL,
          inbound_text TEXT NOT NULL,
          channel TEXT NOT NULL,
          sentiment TEXT DEFAULT 'Neutral',
          sentiment_score REAL DEFAULT 0.0,
          intent_category TEXT DEFAULT 'GENERAL_INQUIRY',
          objection_detail TEXT,
          key_phrases TEXT,
          recommended_reply TEXT,
          conversion_outcome TEXT DEFAULT 'Pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS marketing_insights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          finding TEXT NOT NULL,
          metric_impact TEXT,
          recommendation TEXT NOT NULL,
          priority TEXT DEFAULT 'High',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS technicians (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          truck_name TEXT NOT NULL,
          color_code TEXT DEFAULT '#3b82f6',
          status TEXT DEFAULT 'Active',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS scheduled_jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contact_id INTEGER,
          technician_id INTEGER,
          customer_name TEXT NOT NULL,
          phone TEXT,
          address TEXT NOT NULL,
          city TEXT DEFAULT 'Demo City',
          job_date TEXT NOT NULL,
          time_slot TEXT NOT NULL,
          services TEXT NOT NULL,
          amount REAL DEFAULT 0.0,
          status TEXT DEFAULT 'Scheduled',
          notes TEXT,
          booked_by TEXT DEFAULT 'Direct',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
          FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL
        );
      SQL

      # Enforce the slot invariant in SQLite so concurrent requests cannot race
      # through an application-level check before inserting a booking.
      @db.execute <<-SQL
        CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_jobs_active_slot
        ON scheduled_jobs (technician_id, job_date, time_slot)
        WHERE status != 'Cancelled';
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS d2d_knocks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          rep_name TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT DEFAULT 'Demo City',
          neighborhood TEXT,
          homeowner_name TEXT,
          phone TEXT,
          email TEXT,
          status TEXT DEFAULT 'Interested',
          stories INTEGER DEFAULT 2,
          panes_estimate INTEGER DEFAULT 30,
          services TEXT DEFAULT 'Pure DI Window Cleaning',
          quote_amount REAL DEFAULT 0.0,
          notes TEXT,
          scheduled_job_id INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (scheduled_job_id) REFERENCES scheduled_jobs(id) ON DELETE SET NULL
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS growth_ideas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          hook TEXT NOT NULL,
          description TEXT NOT NULL,
          blueprint TEXT NOT NULL,
          script_template TEXT NOT NULL,
          metric_impact TEXT NOT NULL,
          difficulty TEXT DEFAULT 'Easy',
          status TEXT DEFAULT 'Ready',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_number TEXT UNIQUE,
          job_id INTEGER,
          contact_id INTEGER,
          customer_name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          address TEXT NOT NULL,
          city TEXT DEFAULT 'Demo City',
          subtotal REAL DEFAULT 0.0,
          tax REAL DEFAULT 0.0,
          total_amount REAL DEFAULT 0.0,
          tip_amount REAL DEFAULT 0.0,
          status TEXT DEFAULT 'Draft',
          payment_method TEXT,
          paid_at TEXT,
          line_items_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (job_id) REFERENCES scheduled_jobs(id) ON DELETE SET NULL,
          FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS estimates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          estimate_number TEXT UNIQUE,
          contact_id INTEGER,
          customer_name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          address TEXT NOT NULL,
          city TEXT DEFAULT 'Demo City',
          panes_count INTEGER DEFAULT 30,
          stories INTEGER DEFAULT 2,
          tier_bronze_title TEXT DEFAULT 'Demo option 1',
          tier_bronze_price REAL DEFAULT 0.0,
          tier_bronze_desc TEXT DEFAULT 'Illustrative only; not a customer offer.',
          tier_silver_title TEXT DEFAULT 'Demo option 2',
          tier_silver_price REAL DEFAULT 0.0,
          tier_silver_desc TEXT DEFAULT 'Illustrative only; not a customer offer.',
          tier_gold_title TEXT DEFAULT 'Demo option 3',
          tier_gold_price REAL DEFAULT 0.0,
          tier_gold_desc TEXT DEFAULT 'Illustrative only; not a customer offer.',
          selected_tier TEXT,
          status TEXT DEFAULT 'Draft',
          accepted_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS iot_telemetry (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          technician_id INTEGER,
          truck_name TEXT NOT NULL,
          inflow_ppm INTEGER DEFAULT 0,
          outflow_ppm INTEGER DEFAULT 0,
          flow_rate_gpm REAL DEFAULT 0.0,
          system_pressure_psi INTEGER DEFAULT 0,
          resin_life_percent INTEGER DEFAULT 0,
          gallons_filtered_today REAL DEFAULT 0.0,
          status TEXT DEFAULT 'Simulated demo; not connected to hardware',
          source_mode TEXT DEFAULT 'simulated',
          last_reading_at TEXT
        );
      SQL

      @db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS clarity_certificates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cert_number TEXT UNIQUE,
          job_id INTEGER,
          contact_id INTEGER,
          customer_name TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT DEFAULT 'Demo City',
          technician_name TEXT DEFAULT 'Demo Technician',
          truck_name TEXT DEFAULT 'Demo vehicle',
          municipal_inflow_ppm INTEGER DEFAULT 0,
          purified_outflow_ppm INTEGER DEFAULT 0,
          gallons_used REAL DEFAULT 0.0,
          panes_cleaned INTEGER DEFAULT 0,
          purity_verified_at TEXT,
          rain_shield_expires_at TEXT,
          status TEXT DEFAULT 'SIMULATED DEMO — NOT A FIELD MEASUREMENT',
          source_mode TEXT DEFAULT 'simulated'
        );
      SQL

      # Graceful migration for existing databases
      { 'sms_consent' => 'INTEGER DEFAULT 0',
        'email_consent' => 'INTEGER DEFAULT 0',
        'consent_recorded_at' => 'TEXT' }.each do |column, definition|
        begin
          @db.execute("ALTER TABLE contacts ADD COLUMN #{column} #{definition}")
        rescue SQLite3::SQLException
          # Column already exists.
        end
      end

      { 'attempt_count' => 'INTEGER DEFAULT 0', 'last_error' => 'TEXT' }.each do |column, definition|
        begin
          @db.execute("ALTER TABLE campaign_enrollments ADD COLUMN #{column} #{definition}")
        rescue SQLite3::SQLException
          # Column already exists.
        end
      end

      begin
        @db.execute("ALTER TABLE iot_telemetry ADD COLUMN source_mode TEXT DEFAULT 'simulated'")
      rescue SQLite3::SQLException
        # Column already exists
      end

      begin
        @db.execute("ALTER TABLE clarity_certificates ADD COLUMN source_mode TEXT DEFAULT 'simulated'")
      rescue SQLite3::SQLException
        # Column already exists
      end

      # Legacy source copies could not establish field provenance.
      @db.execute("UPDATE clarity_certificates SET status = 'SIMULATED DEMO — NOT A FIELD MEASUREMENT', source_mode = 'simulated'")
      @db.execute("UPDATE iot_telemetry SET status = 'Simulated demo; legacy provenance unverified', source_mode = 'simulated'")

      # Provider credentials must be supplied through process environment only.
      @db.execute("DELETE FROM settings WHERE key IN ('smtp_password', 'twilio_auth_token', 'sendgrid_api_key')")

      seed_crm_defaults
    end

    def seed_crm_defaults
      # Fresh installs deliberately contain no synthetic workers, jobs,
      # campaigns, customers, or telemetry that could be mistaken for activity.
    end
  end
end
