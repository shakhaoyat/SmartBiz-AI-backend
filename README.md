# SmartBiz AI — Backend

Express.js backend for SmartBiz AI.

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Google Generative AI SDK
- Multer + csv-parse
- Helmet, CORS, express-rate-limit

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Server runs on `http://localhost:5000`.

## Environment Variables

Create `.env` in the backend root:

```
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartbizai?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:3000
AI_MODEL=gemini-2.0-flash
```

## Project Structure

```
src/
├── config/            # Database connection
├── controllers/       # Route controllers
├── middlewares/        # Auth, error handling
├── models/            # Mongoose schemas
├── routes/            # Express routers
├── services/          # Business logic
├── ai/                # AI utilities
├── tools/             # AI tools
├── utils/             # Helpers
├── types/             # TypeScript types
├── app.ts             # Express app
└── server.ts          # Server entry
```

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`

### Business
- `GET /api/business`
- `GET /api/business/:id`
- `POST /api/business`
- `PATCH /api/business/:id`
- `DELETE /api/business/:id`

### Products
- `GET /api/products?businessId=`
- `GET /api/products/:id`
- `POST /api/products`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`

### Data
- `POST /api/data/upload`
- `GET /api/data?businessId=`
- `DELETE /api/data/:id`

### Analytics
- `GET /api/analytics?businessId=&startDate=&endDate=`
- `POST /api/analytics/generate-ai-report`

### Reports
- `GET /api/reports?businessId=`
- `GET /api/reports/:id`
- `POST /api/reports/generate`
- `DELETE /api/reports/:id`

### AI Advisor
- `POST /api/ai/advisor`
- `GET /api/ai/conversations`
- `GET /api/ai/conversations/:id`

### Recommendations
- `GET /api/recommendations?businessId=`
- `POST /api/recommendations/generate`
- `PATCH /api/recommendations/:id`

### Admin
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/businesses`
- `DELETE /api/admin/users/:id`

## Database Collections

- `users` — user accounts
- `businesses` — owned businesses
- `products` — products/services
- `salesDatasets` — uploaded file metadata
- `salesRecords` — parsed sales transactions
- `analyticsReports` — AI-generated reports
- `aiConversations` — advisor chat sessions
- `aiMessages` — individual chat messages
- `recommendations` — AI recommendations
- `userInteractions` — action tracking

## AI Features

### AI Data Analyst
- Aggregates sales data on the backend
- Sends computed KPIs + top products to Gemini/LLM
- Returns structured JSON with summary, trends, risks, opportunities, and recommendations
- Results saved to `analyticsReports`

### AI Business Advisor
- Context-aware chat using business profile + sales data
- Tool calling: `getBusinessProfile`, `getSalesSummary`, `getTopProducts`, `getLowPerformingProducts`, `getRecentReports`, `createRecommendation`
- Conversation history persisted in `aiConversations` + `aiMessages`
- Uses Gemini SDK

### AI Recommendation Engine
- Generates personalized recommendations
- Tracks accept/dismiss/complete status
- Stores confidence, impact, and reasoning

## Security

- Passwords hashed with bcrypt
- JWT signed tokens
- Protected API routes via auth middleware
- Authorization checks on all data routes
- MongoDB injection protection via express-mongo-sanitize
- CORS configured via `CLIENT_URL` env var
- Rate limiting on AI endpoints

## Build

```bash
npm run build
npm start
```

## Deployment

### Render
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

### Environment Variables
Set all variables from `.env` in your hosting dashboard.

## License

MIT
