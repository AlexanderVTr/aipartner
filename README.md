# AISHA - AI Chat Assistant

This is a [Next.js](https://nextjs.org) project with AI chat capabilities, built with React 19, Next.js 15, and Supabase.

## 🚀 Features

- 🤖 AI Chat with LangGraph integration
- 🎤 Speech-to-text voice input
- Video chat with HeyGen Integration
- 👤 User authentication with Clerk
- 🗄️ Vector database with Supabase
- 🎯 Token-based usage system
- 🌙 Dark/light theme toggle

## 📦 Getting Started

First, install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔧 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

### 🚀 Release Scripts

- `pnpm release:patch` - Create patch release (bug fixes)
- `pnpm release:minor` - Create minor release (new features) 
- `pnpm release:major` - Create major release (breaking changes)
- `pnpm release:dry` - Preview release changes
- `pnpm release:custom` - Create custom release

## 📚 Documentation

- [Release Process](./docs/RELEASE_PROCESS.md) - How to create releases
- [Vercel Integration](./docs/VERCEL_RELEASE_INTEGRATION.md) - Deployment with releases
- [Supabase Integration](./README_SUPABASE.md) - Database setup

## 🗄️ Database

This project uses Supabase with vector embeddings for AI chat functionality. See [Supabase documentation](./README_SUPABASE.md) for setup instructions.

## 🚀 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📝 Contributing

1. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
2. Follow the [Release Process](./docs/RELEASE_PROCESS.md) for creating releases
3. Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
