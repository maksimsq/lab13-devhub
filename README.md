# DevPortal & System Dashboard - Lab 13

This is a premium, modern developer web application built as part of **Laboratory Work #13 (Web App Deployment)**.

## 🚀 Technologies Used
- **Backend**: Node.js & Express (minimalistic API and static server)
- **Frontend**: Responsive HTML5, glassmorphic CSS3 styling, Vanilla JavaScript ES6
- **Deployment**: Docker containerization (`Dockerfile` using `node:18-alpine`)
- **Hosting**: Designed for deployment on **Render.com** (using Docker runtime) or **Railway.app**

---

## 🛠️ How to Run Locally

### Option A: Standard Node.js Run
1. Make sure you have [Node.js](https://nodejs.org/) installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Access the web app in your browser at `http://localhost:3000`.

### Option B: Docker Container Run
1. Build the Docker image:
   ```bash
   docker build -t devportal-lab13 .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 devportal-lab13
   ```
3. Open `http://localhost:3000` in your browser.

---

## 📦 How to Upload to GitHub
To deploy the project, you need to push it to a new GitHub repository:

1. Create a repository on your GitHub account (`https://github.com/maksimsq/my-app` or similar).
2. Run the following commands in the project directory:
   ```bash
   git init
   git add .
   git commit -m "feat: initial devportal project configuration for deploy"
   git branch -M main
   git remote add origin https://github.com/maksimsq/my-app.git
   git push -u origin main
   ```

---

## 🌐 How to Deploy to Render.com
1. Go to [Render.com](https://render.com) and log in using your GitHub account.
2. In the dashboard, click **New +** and select **Web Service**.
3. Connect your repository (`my-app`).
4. Set the following settings:
   - **Name**: `devportal-lab13` (or any name you prefer)
   - **Environment / Runtime**: Select **Docker** (it will automatically read the `Dockerfile`).
   - **Branch**: `main`
5. Click **Deploy Web Service** at the bottom. Render will compile the container and provide you with a live URL.
