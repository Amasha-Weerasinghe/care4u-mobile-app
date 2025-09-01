-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    dietary_preference VARCHAR(20) CHECK (dietary_preference IN ('veg', 'non-veg')),
    birth_date DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    emergency_contact_number VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    contact_number VARCHAR(20),
    height INTEGER,
    weight INTEGER,
    bmi DECIMAL(4,2),
    is_profile_complete BOOLEAN DEFAULT FALSE,
    calorie_intake_goal INTEGER,
    calorie_burn_goal INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create OTP verification table
CREATE TABLE IF NOT EXISTS otp_verification (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verification(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verification(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    calories_per_100g INTEGER NOT NULL,
    is_veg BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add created_by column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'food_items' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE food_items ADD COLUMN created_by INTEGER REFERENCES users(id);
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'food_items' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE food_items ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Create indexes for food_items table
CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);
CREATE INDEX IF NOT EXISTS idx_food_items_name ON food_items(name);
CREATE INDEX IF NOT EXISTS idx_food_items_created_by ON food_items(created_by);

-- Create trigger for food_items table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_food_items_updated_at') THEN
        CREATE TRIGGER update_food_items_updated_at 
            BEFORE UPDATE ON food_items 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create meal_templates table
CREATE TABLE IF NOT EXISTS meal_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    total_calories INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create meal_template_items table
CREATE TABLE IF NOT EXISTS meal_template_items (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES meal_templates(id) ON DELETE CASCADE,
    food_item_id INTEGER REFERENCES food_items(id) ON DELETE CASCADE,
    quantity_grams INTEGER NOT NULL,
    calories INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for meal_templates table
CREATE INDEX IF NOT EXISTS idx_meal_templates_user_id ON meal_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_templates_meal_type ON meal_templates(meal_type);
CREATE INDEX IF NOT EXISTS idx_meal_template_items_template_id ON meal_template_items(template_id);

-- Create trigger for meal_templates table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_meal_templates_updated_at') THEN
        CREATE TRIGGER update_meal_templates_updated_at 
            BEFORE UPDATE ON meal_templates 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create meal_records table
CREATE TABLE IF NOT EXISTS meal_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    total_calories INTEGER NOT NULL,
    meal_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create meal_record_items table
CREATE TABLE IF NOT EXISTS meal_record_items (
    id SERIAL PRIMARY KEY,
    meal_record_id INTEGER REFERENCES meal_records(id) ON DELETE CASCADE,
    food_item_id INTEGER REFERENCES food_items(id) ON DELETE CASCADE,
    quantity_grams INTEGER NOT NULL,
    calories INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for meal_records table
CREATE INDEX IF NOT EXISTS idx_meal_records_user_id ON meal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_meal_date ON meal_records(meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_records_meal_type ON meal_records(meal_type);
CREATE INDEX IF NOT EXISTS idx_meal_record_items_meal_record_id ON meal_record_items(meal_record_id);

-- Create trigger for meal_records table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_meal_records_updated_at') THEN
        CREATE TRIGGER update_meal_records_updated_at 
            BEFORE UPDATE ON meal_records 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create sugar_records table
CREATE TABLE IF NOT EXISTS sugar_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
    blood_sugar_value INTEGER NOT NULL CHECK (blood_sugar_value > 0 AND blood_sugar_value <= 1000),
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sugar_records table
CREATE INDEX IF NOT EXISTS idx_sugar_records_user_id ON sugar_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sugar_records_record_date ON sugar_records(record_date);
CREATE INDEX IF NOT EXISTS idx_sugar_records_meal_type ON sugar_records(meal_type);

-- Create trigger for sugar_records table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sugar_records_updated_at') THEN
        CREATE TRIGGER update_sugar_records_updated_at 
            BEFORE UPDATE ON sugar_records 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create exercise_activities table
CREATE TABLE IF NOT EXISTS exercise_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    calories_burned INTEGER NOT NULL CHECK (calories_burned >= 0),
    notes TEXT,
    activity_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for exercise_activities table
CREATE INDEX IF NOT EXISTS idx_exercise_activities_user_id ON exercise_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_activities_activity_date ON exercise_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_exercise_activities_activity_type ON exercise_activities(activity_type);

-- Create trigger for exercise_activities table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_exercise_activities_updated_at') THEN
        CREATE TRIGGER update_exercise_activities_updated_at 
            BEFORE UPDATE ON exercise_activities 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for appointments table
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date, time);

-- Create trigger for appointments table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_appointments_updated_at') THEN
        CREATE TRIGGER update_appointments_updated_at 
            BEFORE UPDATE ON appointments 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create meal_recommendations table
CREATE TABLE IF NOT EXISTS meal_recommendations (
    meal_id SERIAL PRIMARY KEY,
    meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
    meal VARCHAR(255) NOT NULL,
    calories INTEGER NOT NULL CHECK (calories > 0),
    is_veg BOOLEAN DEFAULT true
);

-- Create indexes for meal_recommendations table
CREATE INDEX IF NOT EXISTS idx_meal_recommendations_meal_type ON meal_recommendations(meal_type);
CREATE INDEX IF NOT EXISTS idx_meal_recommendations_is_veg ON meal_recommendations(is_veg);

-- Trigger for meal_recommendations table removed - no updated_at column



