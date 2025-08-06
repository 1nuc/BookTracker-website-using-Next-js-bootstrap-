# 📚 Book Tracker App

A modern full-stack book tracking application built with **Next.js (App Router)**, **Supabase**, **Tailwind CSS**, and **Framer Motion**. Easily track your reading progress, search and filter your books, update their status, and enjoy real-time syncing — all in a clean, user-friendly interface.

---

## ✨ Features

- 🔐 **Auth** via Supabase (Sign in / Sign out)
- 📘 **Book CRUD** (Add, Delete, Status Update)
- 📊 **Dashboard Stats** (Total, Reading, Completed, Wishlist)
- 🔍 **Search** books by title
- 🏷️ **Filter** books by status (via `?status=` query param)
- 🔄 **Realtime Sync** via Supabase Channels
- 📈 **Pagination** (WIP or optional)
- 🧠 **AI Summary (Optional)** — using Gemini/OpenAI API *(in progress)*
- 👥 **Role-based access** *(admin can delete any book, user only their own — optional)*

---

## 🛠 Getting Started

This project was bootstrapped using [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/book-tracker.git
cd book-tracker
npm install
````

### 2. Setup Supabase

Create a project on [Supabase](https://supabase.io) and set up the following:

#### Required Tables

```sql
-- books table
create table books (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  author text not null,
  status text default 'reading',
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table books enable row level security;

-- Add RLS policies
create policy "Users can read their own books" on books
  for select using (auth.uid() = user_id);

create policy "Users can insert their own books" on books
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own books" on books
  for update using (auth.uid() = user_id);

create policy "Users can delete their own books" on books
  for delete using (auth.uid() = user_id);
```

### 3. Configure Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

> You can also add your OpenAI or Gemini API keys if using the AI summary feature.

---

## 🧪 Run Dev Server

```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deployment

Deploy instantly to **Vercel** using this button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app-readme)

> Make sure to set your Supabase environment variables in the Vercel dashboard.

---

## 📁 File Structure Highlights

```
app/
├── page.tsx           # Dashboard
├── auth/              # Auth Page
├── books/             # API routes for books
├── ai/                # (Optional) AI Summary page
lib/
├── supabase.ts        # Supabase client setup
```

---

## 📚 Learn More

* [Next.js Docs](https://nextjs.org/docs)
* [Supabase Docs](https://supabase.com/docs)
* [Tailwind CSS](https://tailwindcss.com)
* [Framer Motion](https://www.framer.com/motion/)

---

## 🧠 Upcoming Enhancements

* [ ] Role-based dashboard for admins
* [ ] AI-powered book suggestions
* [ ] Book summaries from Gemini/OpenAI
* [ ] Favorites & Tags
* [ ] Responsive layout improvements
* [ ] Profile page

---

## License

MIT — Free to use, modify, and improve. Contributions welcome!

```

---

Let me know if you want:

- AI summary endpoints documented  
- Example `.env.local` filled out  
- Preview GIF/screenshots section added  
- Or help with the Vercel deployment config (e.g., `vercel.json`)  

Just say the word.
```
