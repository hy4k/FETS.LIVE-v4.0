# FETS OMNI AI - User Guide

Welcome to FETS OMNI AI, your intelligent assistant for managing and analyzing data across the FETS.LIVE platform!

---

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Using the AI Assistant](#using-the-ai-assistant)
3. [Query Examples](#query-examples)
4. [Advanced Features](#advanced-features)
5. [Tips & Best Practices](#tips--best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing FETS OMNI AI

There are two ways to access the AI:

#### 1. **Floating Chat Widget** (Quick Access)
- Look for the floating AI bubble in the bottom-right corner
- Click to open a quick chat interface
- Perfect for quick queries while working on other tabs

#### 2. **Full AI Interface** (Advanced)
- Navigate to **FETS OMNI AI** from the sidebar
- Access the complete AI dashboard with:
  - 🤖 AI Assistant (Chat)
  - 📊 Analytics Dashboard
  - 📚 Knowledge Base
  - 🕒 Conversation History

---

## Using the AI Assistant

### Starting a Conversation

1. **Click the chat bubble** or navigate to the AI tab
2. **Type your question** in the input field
3. **Press Enter** or click the send button
4. Wait for the AI response (usually 1-3 seconds)

### Quick Actions

Use the pre-defined quick action buttons for common queries:
- **All Exams** - View all exams conducted
- **Candidates** - Get candidate statistics
- **Future** - See upcoming exam schedule
- **History** - Access historical data

---

## Query Examples

### 📊 Statistical Queries

#### Candidate Statistics
```
How many candidates registered this month?
Show me CMA US candidate count for 2024
Which exam type has the most registrations?
```

**Example Response:**
```
📊 Candidate Statistics

Total Candidates (2024): 1,234
By Exam Type:
- CMA US: 512 (41.5%)
- PTE: 345 (28.0%)
- CELPIP: 245 (19.9%)
- CIA: 132 (10.7%)

Sources: candidates
```

#### Session Statistics
```
How many sessions were conducted in Calicut?
Show all CELPIP exams in January 2026
What's the total capacity for upcoming sessions?
```

### 🔮 Future Projections

```
Show me upcoming exams for February 2026
When is the next CMA US session in Cochin?
Future CELPIP schedule
```

**Example Response:**
```
📅 Upcoming CELPIP Sessions

Next 30 Days:
1. Feb 5, 2026 - Calicut (Capacity: 30)
2. Feb 12, 2026 - Cochin (Capacity: 25)
3. Feb 19, 2026 - Calicut (Capacity: 30)

Total: 18 sessions
Available Seats: 480

Sources: calendar_sessions
```

### 📈 Trend Analysis

```
What's the trend in registrations over the last year?
Show me growth in CMA US exams
Compare branch performance
```

**Example Response:**
```
📈 Registration Trends (Last 12 Months)

Overall Growth: +23%
Peak Month: December 2025 (245)
Lowest Month: July 2025 (89)

By Exam:
- CMA US: +34% ⬆️
- PTE: +12% ⬆️
- CELPIP: -5% ⬇️

Prediction: Continued growth in Q1 2026

Sources: candidates, ai_trend_data
```

### 🏢 Branch-Specific Queries

```
Show me Calicut branch statistics
Compare all branches
Which branch has the most incidents?
```

### 📚 Exam Information

```
What is CMA US?
Tell me about CELPIP exam format
What's the passing score for CIA?
Exam fees for PTE
```

**Example Response:**
```
📚 CMA US (Certified Management Accountant)

Conducting Body: IMA (Institute of Management Accountants)
Exam Format: 2 Parts
- Part 1: Financial Planning, Performance & Analytics
- Part 2: Strategic Financial Management

Duration: 4 hours (2 parts × 2 hours)
Questions: 100 per part
Passing Score: 72%
Fees: $695 (IMA members), $845 (non-members)
Eligibility: Bachelor's degree + 2 years experience

Exam Cycles: On-demand at Prometric centers

Sources: exam_knowledge_base
```

### ⏰ Date-Based Queries

Natural language date parsing supported:

```
Show exams from last week
Sessions between Jan 1 and Jan 31
Candidates registered yesterday
All incidents since December 2025
```

---

## Advanced Features

### 💬 Conversation History

- All conversations are automatically saved
- Access past queries from the **History** tab
- Continue previous conversations
- Export conversation transcripts

### 🎯 Context Awareness

The AI remembers your conversation:

```
You: Show me CMA US candidates
AI: [Shows 512 CMA US candidates]

You: How many passed?
AI: [Understands you're still asking about CMA US]
```

### 📊 Analytics Dashboard

View system-wide metrics:
- Total conversations
- Questions answered
- Knowledge stored
- Response accuracy
- Average response time
- Active users

### 🔍 Knowledge Base

- AI-generated insights
- Verified knowledge entries
- Topic-based organization
- Confidence scoring

### 📎 Source Citations

Every response includes source attribution:
- Database tables used
- Data points referenced
- Timestamp of data

---

## Tips & Best Practices

### ✅ Do's

1. **Be specific with dates**
   - Good: "Show CMA US exams in January 2026"
   - Better: "Show CMA US exams between Jan 1 and Jan 31, 2026"

2. **Use exam synonyms naturally**
   - "CMA", "CMA US", "CMA USA" all work
   - "CELPIP", "Canadian English test" recognized

3. **Ask follow-up questions**
   - The AI maintains conversation context
   - Build on previous queries

4. **Combine filters**
   - "Show Calicut branch CMA US candidates from last month"

5. **Request specific formats**
   - "Give me a list of..."
   - "Show me statistics for..."
   - "Compare..."

### ❌ Don'ts

1. **Don't ask unrelated questions**
   - AI is trained on FETS data only
   - Can't answer general knowledge questions

2. **Don't expect real-time transaction data**
   - Data refreshes every 30 seconds
   - For live data, check the actual modules

3. **Don't include sensitive information**
   - Avoid personal details in queries
   - Queries are logged for analytics

---

## Troubleshooting

### AI Not Responding

**Issue**: Chat bubble not responding to messages

**Solutions**:
1. Check your internet connection
2. Refresh the page (F5)
3. Clear browser cache
4. Check browser console for errors (F12)

### Incorrect Answers

**Issue**: AI provides wrong or outdated information

**Solutions**:
1. Be more specific with your query
2. Include date ranges explicitly
3. Specify branch location if needed
4. Report the issue to admin for knowledge verification

### Slow Response Times

**Issue**: AI takes longer than 5 seconds

**Possible Causes**:
- Large dataset query (all-time data)
- Complex aggregation
- API rate limiting

**Solutions**:
- Narrow your query scope
- Add date filters
- Wait a moment and retry

### "Neural Link Failed" Error

**Issue**: Connection to AI service failed

**Solutions**:
1. Check API key configuration
2. Verify Supabase connection
3. Contact system administrator
4. Check server logs

### Empty Responses

**Issue**: AI responds with no data

**Possible Causes**:
- No matching records in database
- Query too specific
- Date range outside available data

**Solutions**:
- Broaden your query
- Check date ranges
- Try different keywords

---

## Query Cheat Sheet

### Quick Reference

| Task | Example Query |
|------|---------------|
| Count candidates | "How many candidates registered?" |
| Future sessions | "Show upcoming exams" |
| Branch stats | "Calicut branch statistics" |
| Exam info | "What is CMA US?" |
| Trend analysis | "Show registration trends" |
| Date-specific | "Exams in January 2026" |
| Compare | "Compare all branches" |
| Specific exam | "All CELPIP sessions" |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Enter** | Send message |
| **Shift+Enter** | New line in message |
| **Esc** | Close chat bubble |
| **↑** | Previous message (history) |
| **↓** | Next message (history) |

---

## Understanding AI Responses

### Response Sections

1. **Summary** - Quick answer to your query
2. **Details** - Breakdown of data (lists, tables, stats)
3. **Sources** - Database tables and references used
4. **Timestamp** - When the response was generated

### Confidence Indicators

- **High Confidence** (90-100%): Data verified, multiple sources
- **Medium Confidence** (70-89%): Inferred from available data
- **Low Confidence** (<70%): Limited data, estimates

### Data Freshness

- **Real-time**: Active sessions, online staff
- **30s Cache**: Recent queries
- **Daily**: Analytics summaries
- **Historical**: All-time data

---

## Privacy & Data

### What Gets Stored

✅ **Stored**:
- Your queries (text)
- AI responses
- Conversation metadata
- Data sources used

❌ **NOT Stored**:
- Personal sensitive information
- Passwords or credentials
- Raw database records

### Data Retention

- Conversations: Indefinite (can be deleted)
- Query logs: 90 days
- Analytics: Aggregated only
- Knowledge: Verified entries permanent

---

## Getting More Help

### Resources

- **Technical Docs**: `/docs/AI_DATA_ANALYSIS_SYSTEM_ARCHITECTURE.md`
- **API Reference**: `/docs/AI_API_REFERENCE.md`
- **Troubleshooting**: See this guide's troubleshooting section

### Support

- **In-App**: Use the feedback button
- **Email**: support@fets.in
- **Admin**: Contact your system administrator

---

## Feedback

Help us improve FETS OMNI AI!

- Report incorrect answers
- Suggest new features
- Share use cases
- Vote on knowledge verification

---

**🎉 Happy querying with FETS OMNI AI!**

*Last Updated: January 31, 2026*
*Version: 1.0.0*
