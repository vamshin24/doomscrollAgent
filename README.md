# n8n Data Web Pipeline

This is a minimal n8n pipeline MVP designed to fetch data continuously via API, store it sequentially, prep it, and summarize / analyze it using dynamically chosen LLM models directly inside n8n.

## Architecture

This setup relies on 3 main components:
1. **PostgreSQL Database (`init.sql`)**: Used to persist raw data out of the source API and to store finalized cleaned/insightful data outputs locally.
2. **n8n Workflow (`workflow.json`)**: Contains the schedule trigger, external API HTTP logic, and LLM classification/analysis chains.
3. **Internal Configuration Router**: Early in the workflow, an n8n Set node assigns `analysis_model` and `insight_model`. All subsequent steps dynamically reference these variables, ensuring the user can choose the LLM intuitively within the GUI without external scripts.

## Getting Started

### 1. Initialize Postgres Database
On your local machine, use Homebrew to install and start Postgres natively without Docker:
```bash
brew install postgresql@14
brew services start postgresql@14
createdb pipeline
psql pipeline -c "CREATE USER n8n WITH SUPERUSER PASSWORD 'n8n';"
psql -d pipeline -U n8n -W n8n < init.sql
```
*(When prompted for password, enter `n8n`)*.
This spawns the `pipeline` database containing `raw_data` and `insights` tables locally.

### 2. Start n8n
Since you run n8n natively without Docker, just execute:
```bash
npx n8n
```
Then navigate to `http://localhost:5678`.

### 3. Import Workflow
- Inside the n8n GUI, click "Add Workflow".
- Click the "..." options menu and select "Import from File".
- Select `workflow.json` located in this repository.

### 4. Add DB and API Credentials
- Double-click **Store Raw Data (Postgres)**. Under credentials, select/create a new **Postgres** credential. Set the:
  - Host: `localhost`
  - Database: `pipeline`
  - User: `n8n`
  - Password: `n8n`
- Repeat for the **Store Insights (Postgres)** node.
- Double-click both **Connect Gemini** nodes and paste your Google API Key via a newly created **Google Gemini API** credential.

### 4. Choose LLMs
- Open the **Model Config** node.
- Modify `analysis_model` and `insight_model` variables to point to your desired supported model IDs for the connected LLM integrations (e.g. models configured for Anthropic, OpenAI, or Ollama inside n8n).

### 5. Add Credentials to LLM Nodes
- Open the Analysis and Insight Agent nodes.
- Make sure to route your actual model nodes inside of them, passing the credentials. The configuration values initialized in the Model Config node are accessible via `{{ $('Model Config').item.json.analysis_model }}` for injection into child model nodes.

## Next Steps
In future updates, you can replace the placeholder API URL and adjust data manipulation in the Data Prep Code node without touching the LLM/SQLite persistence logic.
