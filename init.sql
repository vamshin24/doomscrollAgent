CREATE TABLE IF NOT EXISTS raw_data (
    id SERIAL PRIMARY KEY,
    source_url TEXT,
    raw_payload TEXT,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS insights (
    id SERIAL PRIMARY KEY,
    raw_data_id INTEGER REFERENCES raw_data(id),
    cleaned_text TEXT,
    analysis_result TEXT,
    insight_result TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
