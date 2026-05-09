# FlowState Task Manager

A premium, high-performance team task management application built with Next.js 14, Supabase, and Tailwind CSS v4. Featuring a stunning glassmorphism design system ("FlowState"), this platform enables seamless project collaboration, robust role-based access control, and a beautifully interactive Kanban board experience.

## ✨ Features

- **Stunning UI/UX**: Premium dark mode aesthetic with glassmorphic panels, glowing accents, and smooth micro-animations.
- **Secure Authentication**: Built-in Email/Password authentication powered by Supabase.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `admin` and `member` roles within specific projects.
- **Interactive Kanban Boards**: Effortlessly track task progress across "To Do", "In Progress", and "Done" stages.
- **Dynamic Dashboards**: Real-time overview of your overdue tasks, upcoming deadlines, and personalized task inbox.
- **Responsive Design**: Flawlessly optimized for both desktop and mobile viewing.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Icons**: [Google Material Symbols](https://fonts.google.com/icons)
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- A Supabase account and project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AmandeepS1ngh/task-manager.git
   cd task-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Initialize the Database:**
   Run the SQL commands found in `supabase-schema.sql` in your Supabase SQL editor to create the necessary tables, triggers, and Row Level Security (RLS) policies.

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

## 📁 Project Structure

```text
├── app/
│   ├── (auth)/             # Login and Registration routes
│   ├── (dashboard)/        # Main app layout, Dashboard, and Project views
│   └── api/                # Next.js Serverless API Routes
├── components/             # Reusable UI components (Sidebar, Modals, Cards)
├── lib/                    # Utilities, API client wrappers, Auth, RBAC logic
├── supabase-schema.sql     # Database schema and policies
└── globals.css             # Tailwind v4 configuration and custom variables
```

## 🔐 Security & Architecture

This project leverages a hybrid security model:
- **Middleware**: Validates active user sessions at the edge.
- **API Routes**: Securely handles database interactions, utilizing the `SUPABASE_SERVICE_ROLE_KEY` internally to bypass RLS for complex multi-table queries while strictly enforcing application-level RBAC logic before returning data.
- **Supabase Auth**: Manages JWTs and secure user profiles.

## 📄 License

This project is licensed under the MIT License.
