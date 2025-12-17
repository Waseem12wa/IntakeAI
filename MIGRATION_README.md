# MongoDB Migration Script

## Quick Start

### 1. Make sure localhost MongoDB is running
```powershell
# Check if MongoDB is running
Get-Process mongod
```

### 2. Run the migration script
```powershell
node migrate-to-atlas.js
```

### 3. What the script does:
- ✅ Connects to localhost MongoDB (`mongodb://localhost:27017/intakeai`)
- ✅ Connects to MongoDB Atlas (`mongodb+srv://intake:1234@cluster0.wvrfuwo.mongodb.net/intakeai`)
- ✅ Fetches all collections from localhost
- ✅ Migrates all documents to Atlas
- ✅ Shows progress and summary

### 4. After migration:
- Update Render environment variable `MONGODB_URI` to:
  ```
  mongodb+srv://intake:1234@cluster0.wvrfuwo.mongodb.net/intakeai?retryWrites=true&w=majority
  ```
- Deploy on Render!

## Troubleshooting

### Error: "Cannot connect to localhost"
- Make sure MongoDB is running locally
- Check if port 27017 is accessible

### Error: "Cannot connect to Atlas"
- Verify MongoDB Atlas Network Access allows `0.0.0.0/0`
- Check username: `intake` and password: `1234`
- Ensure cluster is running

### Error: "Collection already exists"
- The script automatically clears existing data in Atlas
- If you want to keep existing data, comment out the `deleteMany` line

## Safety Features

- ⏱️ 5-second countdown before starting migration
- 🔍 Connection verification before migration
- 📊 Detailed progress reporting
- ✅ Summary of migrated collections
- ❌ Error handling for each collection

## What Gets Migrated

All collections in the `intakeai` database, including:
- users
- jobs
- estimates
- n8nquotes
- integrations
- Any other collections you have

---

**Created**: December 17, 2024
**Author**: Antigravity AI Assistant
