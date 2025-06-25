# Firebase Functions Setup Guide

## Overview
This guide will help you set up the Firebase Functions that automatically fetch new research papers on PCOS, thyroid, and endometriosis every Monday.

## Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project created and configured
3. Node.js 18+ installed

## Setup Steps

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Build the Functions
```bash
npm run build
```

### 3. Deploy to Firebase
```bash
# Login to Firebase (if not already logged in)
firebase login

# Initialize Firebase Functions (if not already done)
firebase init functions

# Deploy the functions
firebase deploy --only functions
```

### 4. Verify Deployment
After deployment, you'll get URLs for your functions:
- `fetchWeeklyResearch`: Scheduled function (runs every Monday at 9 AM EST)
- `manualResearchFetch`: HTTP function for manual testing

### 5. Test the Manual Function
You can test the research fetching immediately by calling:
```
https://your-project-id.cloudfunctions.net/manualResearchFetch
```

## Function Details

### Scheduled Function (`fetchWeeklyResearch`)
- **Schedule**: Every Monday at 9 AM EST
- **Purpose**: Automatically fetches new research papers from the last 7 days
- **Data Source**: Europe PMC API
- **Storage**: Results stored in Firestore under `weeklyResearchSummaries` collection

### Manual Function (`manualResearchFetch`)
- **Purpose**: Manual trigger for testing or immediate research fetch
- **Access**: HTTP endpoint
- **Use Case**: Testing, immediate data fetch, or backup

## Data Structure

The functions store data in Firestore with this structure:

```
weeklyResearchSummaries/
  {date}/
    - date: string
    - totalConditions: number
    - totalPapers: number
    - conditions: string[]
    - lastUpdated: timestamp
    conditions/
      pcos/
        - date: string
        - condition: string
        - papers: ResearchPaper[]
        - totalCount: number
        - lastUpdated: timestamp
      thyroid/
        - (same structure)
      endometriosis/
        - (same structure)
```

## Monitoring

You can monitor function execution in the Firebase Console:
1. Go to Firebase Console
2. Navigate to Functions
3. View logs and execution history

## Troubleshooting

### Common Issues:
1. **Function not deploying**: Check Node.js version (must be 18+)
2. **API rate limits**: Europe PMC has rate limits, functions include error handling
3. **Firestore permissions**: Ensure Firestore rules allow function writes

### Testing Locally:
```bash
cd functions
npm run serve
```

## Next Steps
After deploying the functions, you can integrate the research data into your frontend by:
1. Creating a component to display research summaries
2. Fetching data from the `weeklyResearchSummaries` collection
3. Adding a "Smart Research" tab to your dashboard

The frontend component is already created and ready to use once the functions are deployed! 