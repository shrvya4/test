import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  journal: string;
  publicationDate: string;
  doi?: string;
  url?: string;
}

interface ResearchSummary {
  date: string;
  condition: string;
  papers: ResearchPaper[];
  totalCount: number;
}

// Function to fetch papers from Europe PMC API
async function fetchPapers(condition: string, daysBack: number = 7): Promise<ResearchPaper[]> {
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);
    const fromDateStr = fromDate.toISOString().split('T')[0];
    
    const query = encodeURIComponent(condition);
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${query}&sort_date:y&resultType=core&format=json&pageSize=10&fromPublicationDate=${fromDateStr}`;
    
    console.log(`Fetching papers for ${condition} from ${fromDateStr}`);
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data.resultList || !data.resultList.result) {
      console.log(`No results found for ${condition}`);
      return [];
    }
    
    const papers: ResearchPaper[] = data.resultList.result.map((paper: any) => ({
      id: paper.id,
      title: paper.title || 'No title available',
      authors: paper.authorString ? paper.authorString.split(', ') : [],
      abstract: paper.abstract || 'No abstract available',
      journal: paper.journalTitle || 'Unknown journal',
      publicationDate: paper.firstPublicationDate || 'Unknown date',
      doi: paper.doi,
      url: paper.fullTextUrlList?.fullTextUrl?.[0]?.url
    }));
    
    console.log(`Found ${papers.length} papers for ${condition}`);
    return papers;
    
  } catch (error) {
    console.error(`Error fetching papers for ${condition}:`, error);
    return [];
  }
}

// Scheduled function that runs every Monday at 9 AM
export const fetchWeeklyResearch = functions.pubsub
  .schedule('0 9 * * 1') // Every Monday at 9 AM
  .timeZone('America/New_York')
  .onRun(async (context: functions.EventContext) => {
    console.log('Starting weekly research paper fetch...');
    
    const conditions = ['PCOS', 'thyroid', 'endometriosis'];
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const weeklySummary: ResearchSummary[] = [];
      
      for (const condition of conditions) {
        console.log(`Fetching papers for ${condition}...`);
        const papers = await fetchPapers(condition, 7); // Last 7 days
        
        if (papers.length > 0) {
          weeklySummary.push({
            date: today,
            condition: condition,
            papers: papers,
            totalCount: papers.length
          });
        }
      }
      
      // Store the results in Firestore
      if (weeklySummary.length > 0) {
        const batch = db.batch();
        
        // Store individual condition summaries
        weeklySummary.forEach(summary => {
          const docRef = db.collection('weeklyResearchSummaries')
            .doc(today)
            .collection('conditions')
            .doc(summary.condition.toLowerCase());
          
          batch.set(docRef, {
            ...summary,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        
        // Store overall summary
        const overallSummaryRef = db.collection('weeklyResearchSummaries').doc(today);
        batch.set(overallSummaryRef, {
          date: today,
          totalConditions: weeklySummary.length,
          totalPapers: weeklySummary.reduce((sum: number, s: ResearchSummary) => sum + s.totalCount, 0),
          conditions: weeklySummary.map(s => s.condition),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await batch.commit();
        console.log(`Successfully stored research summaries for ${today}`);
      } else {
        console.log('No new papers found this week');
      }
      
      return { success: true, date: today, summaries: weeklySummary.length };
      
    } catch (error) {
      console.error('Error in weekly research fetch:', error);
      throw error;
    }
  });

// HTTP function to manually trigger the research fetch (for testing)
export const manualResearchFetch = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  try {
    console.log('Manual research fetch triggered');
    
    const conditions = ['PCOS', 'thyroid', 'endometriosis'];
    const today = new Date().toISOString().split('T')[0];
    const weeklySummary: ResearchSummary[] = [];
    
    for (const condition of conditions) {
      const papers = await fetchPapers(condition, 7);
      
      if (papers.length > 0) {
        weeklySummary.push({
          date: today,
          condition: condition,
          papers: papers,
          totalCount: papers.length
        });
      }
    }
    
    // Store results
    if (weeklySummary.length > 0) {
      const batch = db.batch();
      
      weeklySummary.forEach(summary => {
        const docRef = db.collection('weeklyResearchSummaries')
          .doc(today)
          .collection('conditions')
          .doc(summary.condition.toLowerCase());
        
        batch.set(docRef, {
          ...summary,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      const overallSummaryRef = db.collection('weeklyResearchSummaries').doc(today);
      batch.set(overallSummaryRef, {
        date: today,
        totalConditions: weeklySummary.length,
        totalPapers: weeklySummary.reduce((sum: number, s: ResearchSummary) => sum + s.totalCount, 0),
        conditions: weeklySummary.map(s => s.condition),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await batch.commit();
    }
    
    res.json({
      success: true,
      date: today,
      summaries: weeklySummary,
      message: `Found ${weeklySummary.reduce((sum: number, s: ResearchSummary) => sum + s.totalCount, 0)} new papers`
    });
    
  } catch (error) {
    console.error('Error in manual research fetch:', error);
    res.status(500).json({ error: 'Failed to fetch research papers' });
  }
}); 