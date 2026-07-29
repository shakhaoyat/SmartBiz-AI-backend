import { Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SalesRecord from '../models/SalesRecord';
import Business from '../models/Business';
import AnalyticsReport from '../models/AnalyticsReport';
import AIConversation from '../models/AIConversation';
import AIMessage from '../models/AIMessage';
import Recommendation from '../models/Recommendation';
import { AuthRequest } from '../middlewares/auth';

const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

const buildSystemPrompt = (business: any, context: any): string => {
  return `You are SmartBiz AI, an expert business advisor. You help business owners analyze their sales data, identify trends and risks, and provide actionable recommendations.

Business Context:
- Name: ${business.name}
- Type: ${business.type}
- Industry: ${business.industry}
- Description: ${business.description}
- Goals: ${business.goals || 'Not specified'}

${context.summary ? `Recent Sales Summary: ${context.summary}\n` : ''}
${context.revenue ? `Total Revenue: $${context.revenue}\n` : ''}
${context.topProducts ? `Top Products: ${context.topProducts.join(', ')}\n` : ''}

Guidelines:
- Only use the data provided. Do not fabricate statistics.
- Provide structured, concise, and actionable insights.
- Be professional and supportive.
- If data is insufficient, clearly state what is missing.`;
};

export const sendAdvisorMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user?._id?.toString();
    const businesses = await Business.find({ owner: userId });
    if (!businesses.length) {
      res.status(400).json({ message: 'No business found.' });
      return;
    }
    const business = businesses[0];

    const recentMessages = await AIMessage.find({ conversation: conversationId ? conversationId : { $exists: false } }).sort({ createdAt: -1 }).limit(10);

    const context: any = {};
    try {
      const records = await SalesRecord.find({ business: business._id }).limit(100);
      const totalRevenue = records.reduce((s, r) => s + r.totalRevenue, 0);
      const topProductsMap = new Map<string, number>();
      records.forEach(r => topProductsMap.set(r.productName, (topProductsMap.get(r.productName) || 0) + r.totalRevenue));
      context.revenue = totalRevenue;
      context.topProducts = Array.from(topProductsMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(p=>p[0]);
      context.summary = `${records.length} records analyzed.`;
    } catch {
      context.summary = 'No sales data available.';
    }

    let conversation = null;
    if (conversationId) conversation = await AIConversation.findById(conversationId);
    if (!conversation) {
      conversation = new AIConversation({ business: business._id, user: userId, title: message.slice(0, 50) });
      await conversation.save();
    }

    const userMsg = new AIMessage({ conversation: conversation._id, role: 'user', content: message });
    await userMsg.save();

    const model = getGenAI().getGenerativeModel({ model: process.env.AI_MODEL || 'gemini-2.0-flash' });

    const contents = [
      { role: 'user', parts: [{ text: buildSystemPrompt(business, context) }] },
      ...recentMessages.reverse().map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const tools = [
      { functionDeclarations: [
        { name: 'getBusinessProfile', description: 'Get current business profile details', parameters: { type: 'object', properties: {} } },
        { name: 'getSalesSummary', description: 'Get sales summary including total revenue and record count', parameters: { type: 'object', properties: {} } },
        { name: 'getTopProducts', description: 'Get top-performing products by revenue', parameters: { type: 'object', properties: {} } },
        { name: 'getLowPerformingProducts', description: 'Get lowest-performing products by revenue', parameters: { type: 'object', properties: {} } },
        { name: 'getRecentReports', description: 'Get recent AI-generated reports for this business', parameters: { type: 'object', properties: {} } },
        { name: 'createRecommendation', description: 'Create a new AI recommendation for the user', parameters: { type: 'object', properties: { title: { type: 'string' }, priority: { type: 'string', enum: ['high','medium','low'] }, category: { type: 'string' }, reason: { type: 'string' }, impact: { type: 'string' }, action: { type: 'string' } }, required: ['title','priority','category','reason','impact','action'] } },
      ] }
    ];

    let result = await model.generateContent({ contents, tools } as any);
    let response = await result.response;
    let responseText = response.text();

    const toolCalls: any[] = [];
    const toolResults: any[] = [];

    const functionCalls = (response as any).candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall);
    if (functionCalls && functionCalls.length) {
      for (const fc of functionCalls) {
        const functionName = fc.functionCall.name;
        const args = fc.functionCall.args || {};
        toolCalls.push({ id: functionName, function: { name: functionName, arguments: JSON.stringify(args) } });
        let resultData: any = {};
        switch (functionName) {
          case 'getBusinessProfile':
            resultData = { name: business.name, type: business.type, industry: business.industry, goals: business.goals };
            break;
          case 'getSalesSummary': {
            const recs = await SalesRecord.find({ business: business._id }).limit(100);
            resultData = { totalRevenue: recs.reduce((s, r) => s + r.totalRevenue, 0), totalOrders: recs.length };
            break;
          }
          case 'getTopProducts': {
            const recs = await SalesRecord.find({ business: business._id }).limit(100);
            const map = new Map<string, number>();
            recs.forEach(r => map.set(r.productName, (map.get(r.productName) || 0) + r.totalRevenue));
            resultData = { products: Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(p=>p[0]) };
            break;
          }
          case 'getLowPerformingProducts': {
            const recs = await SalesRecord.find({ business: business._id }).limit(100);
            const map = new Map<string, number>();
            recs.forEach(r => map.set(r.productName, (map.get(r.productName) || 0) + r.totalRevenue));
            resultData = { products: Array.from(map.entries()).sort((a,b)=>a[1]-b[1]).slice(0,5).map(p=>p[0]) };
            break;
          }
          case 'getRecentReports': {
            const recent = await AnalyticsReport.find({ business: business._id }).sort({ createdAt: -1 }).limit(3);
            resultData = { reports: recent.map(r => ({ title: r.title, type: r.type, createdAt: r.createdAt })) };
            break;
          }
          case 'createRecommendation': {
            const rec = new Recommendation({ business: business._id, user: userId, title: args.title, priority: args.priority || 'medium', category: args.category, reason: args.reason, impact: args.impact, action: args.action, confidence: 0.8 });
            await rec.save();
            resultData = { created: true, recommendation: { title: rec.title, priority: rec.priority } };
            break;
          }
          default:
            resultData = { error: 'Unknown tool' };
        }
        toolResults.push({ functionResponse: { name: functionName, response: resultData } });
      }
    }

    if (toolResults.length) {
      const followUp = await model.generateContent({ contents: [...contents, { role: 'model', parts: functionCalls }, { role: 'user', parts: toolResults.map(tr => ({ text: JSON.stringify(tr) })) }] });
      responseText = (await followUp.response).text();
    }

    const assistantMsg = new AIMessage({ conversation: conversation._id, role: 'assistant', content: responseText });
    await assistantMsg.save();
    res.json({ conversationId: conversation._id, message: responseText });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conversations = await AIConversation.find({ user: req.user?._id }).sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conversation = await AIConversation.findById(req.params.id);
    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found.' });
      return;
    }
    if (conversation.user.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    const messages = await AIMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 });
    res.json({ ...conversation.toObject(), messages });
  } catch (error) {
    next(error);
  }
};
