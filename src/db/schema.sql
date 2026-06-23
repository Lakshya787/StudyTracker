CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startTime TEXT NOT NULL,
    endTime TEXT,
    duration INTEGER,
    ruleId INTEGER,
    notes TEXT,
    FOREIGN KEY(ruleId) REFERENCES rules(id)
);

CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    count INTEGER NOT NULL DEFAULT 1
);

-- Insert default rules if not exists
INSERT OR IGNORE INTO rules (key, value) VALUES ('pomodoro_length', '25');
INSERT OR IGNORE INTO rules (key, value) VALUES ('short_break', '5');
INSERT OR IGNORE INTO rules (key, value) VALUES ('long_break', '15');
