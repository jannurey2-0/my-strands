# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9bf8149b-91c5-45bc-b737-b33f17e743bf

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9bf8149b-91c5-45bc-b737-b33f17e743bf) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Error Handling

This project implements Error Boundaries to prevent complete application crashes:

- **Global Error Boundary**: Wraps all routes in App.tsx to catch errors at the page level
- **Component Error Boundaries**: Individual page components (Dashboard, Results, Schools, Assessment) are wrapped with Error Boundaries
- **Chart Error Boundaries**: Specific boundaries for chart components that might fail due to data issues
- **Fallback UI**: User-friendly error displays with retry options when components fail

To test error handling, visit `/test-error` route which demonstrates the Error Boundary functionality.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9bf8149b-91c5-45bc-b737-b33f17e743bf) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)