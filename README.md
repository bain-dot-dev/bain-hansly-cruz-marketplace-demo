# Mini Marketplace

A Facebook Marketplace clone built with Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI, and Supabase.

## Features

- 🏪 Browse marketplace listings in a responsive grid
- 📱 Category-based filtering
- 🔍 Search functionality
- 📝 Create new listings with image upload
- 💬 Message sellers directly
- 📱 Fully responsive design
- 🎨 Modern UI with Shadcn components

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL + Storage)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account and project

### Installation

1. Clone the repository:
\`\`\`bash
git clone <your-repo-url>
cd mini-marketplace
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in your Supabase credentials in `.env.local`.

4. Set up the database:
   - Go to your Supabase project dashboard
   - Run the SQL scripts in the `scripts/` folder:
     - First run `setup-database.sql`
     - Then run `seed-data.sql` for sample data

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

\`\`\`
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── create/            # Listing creation pages
│   ├── item/              # Item detail pages
│   └── category/          # Category pages
├── components/            # React components
│   ├── ui/                # Shadcn UI components
│   ├── layout/            # Layout components
│   └── marketplace/       # Feature-specific components
├── lib/                   # Utilities
└── scripts/               # Database setup scripts
\`\`\`

## Deployment

Deploy to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
