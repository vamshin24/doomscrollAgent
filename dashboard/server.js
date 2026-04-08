const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = 3000;

const pool = new Pool({
  host: 'localhost',
  database: 'pipeline',
  user: 'n8n',
  password: 'n8n',
  port: 5432,
});

app.use(express.static(path.join(__dirname, 'public')));

// All insights ordered newest first
app.get('/api/insights', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.raw_data_id, i.cleaned_text, i.analysis_result, i.insight_result, i.created_at,
              r.source_url, r.fetched_at
       FROM insights i
       LEFT JOIN raw_data r ON r.id = i.raw_data_id
       ORDER BY i.created_at DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Parsed summary: topic keywords + sentiment from latest insight
app.get('/api/summary', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT analysis_result, insight_result, created_at
       FROM insights
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({ topics: [], sentiment: { positive: 0, neutral: 0, concern: 0 }, insight: '' });
    }

    const { analysis_result, insight_result, created_at } = result.rows[0];
    const combined = (analysis_result + ' ' + insight_result).toLowerCase();

    // Topic keyword extraction — count meaningful tech/market terms
    const topicMap = {
      'AI / Machine Learning': ['ai', 'machine learning', 'llm', 'gpt', 'gemini', 'neural', 'artificial intelligence', 'model'],
      'Security': ['security', 'vulnerability', 'breach', 'exploit', 'malware', 'ransomware', 'cve'],
      'Databases': ['database', 'postgres', 'sql', 'nosql', 'sqlite', 'redis', 'storage'],
      'Cloud & Infra': ['cloud', 'aws', 'azure', 'kubernetes', 'docker', 'devops', 'infrastructure'],
      'Browsers & Web': ['browser', 'chrome', 'firefox', 'safari', 'web', 'dom', 'http'],
      'Startups & Business': ['startup', 'founder', 'vc', 'funding', 'revenue', 'market', 'product'],
      'Dev Tools': ['compiler', 'ide', 'debugging', 'editor', 'framework', 'library', 'tool'],
      'Society & Burnout': ['burnout', 'layoff', 'hiring', 'salary', 'regulation', 'antitrust', 'doj'],
    };

    const topics = Object.entries(topicMap).map(([label, keywords]) => {
      const count = keywords.reduce((acc, kw) => {
        const regex = new RegExp(kw, 'gi');
        const matches = combined.match(regex);
        return acc + (matches ? matches.length : 0);
      }, 0);
      return { label, count };
    }).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

    // Sentiment word scoring
    const positiveWords = ['opportunity', 'growth', 'innovative', 'capitalize', 'valuable', 'improve', 'benefit', 'promising', 'actionable'];
    const concernWords = ['burnout', 'anxiety', 'risk', 'fragmentation', 'concern', 'leaving', 'tension', 'regulatory', 'antitrust', 'danger'];

    const positive = positiveWords.reduce((acc, w) => acc + (combined.split(w).length - 1), 0);
    const concern = concernWords.reduce((acc, w) => acc + (combined.split(w).length - 1), 0);
    const total = positive + concern;
    const neutral = Math.max(0, 10 - total);

    res.json({
      topics: topics.slice(0, 8),
      sentiment: { positive, neutral, concern },
      insight: insight_result,
      analysis: analysis_result,
      created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`\n🚀 HN Intelligence Dashboard running at http://localhost:${PORT}\n`);
});
