# Infera Notebook – AI-Powered Notes & Podcast Generator

Infera Notebook lets you upload documents, chat with your files, and instantly generate insightful notes and engaging podcasts using cutting-edge LLM technology.

---

## Features

- **Upload Documents:** Seamlessly upload PDFs, audio, and other supported files.
- **Chat with Your Files:** Ask questions and interact with your documents using advanced language models.
- **AI-Generated Notes:** Instantly create summaries and notes from your files.
- **Podcast Generation:** Turn your notes or documents into engaging audio podcasts.
- **Modern UI:** Clean, responsive interface for productivity and ease of use.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/lwshakib/infera-notebook.git
cd infera-notebook
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory and add the following (see Google Cloud Storage setup below):

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/your/service-account-key.json
```

### 4. Google Cloud Storage Setup

This project uses Google Cloud Storage for file uploads. To set this up:

- Install the dependency:
  ```bash
  npm install @google-cloud/storage
  ```
- Create a bucket named `infera-notebook` in your Google Cloud project.
- Set up a service account and download the JSON key file.
- Ensure your service account has the necessary permissions (see below).

#### Bucket Permissions

- `Storage Object Admin` for full access
- Or `Storage Object Creator` and `Storage Object Viewer` for restricted access

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the app.

---

## Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Prisma** (ORM)
- **Google Cloud Storage** (file uploads)
- **LLM Integration** (for chat, notes, and podcast generation)
- **Tailwind CSS** (UI styling)

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Google Cloud Storage](https://cloud.google.com/storage)

---

## License

MIT
