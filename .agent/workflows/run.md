---
description: how to run the KrishiMitra AI application
---

To run the application, you need to start both the backend and frontend servers in separate terminal instances.

### 1. Prerequisites
- Ensure you have **Node.js** and **npm** installed.
- Ensure **MongoDB** is running on your system (or accessible via your `.env` configuration).

### 2. Start the Backend Server
1.  Open a terminal.
2.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
3.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
// turbo
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The backend will start on `http://localhost:5000`.

### 3. Start the Frontend Server
1.  Open a second terminal.
2.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
3.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
// turbo
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will start on `http://localhost:5173`.

### 4. Access the Application
- Open your browser and go to `http://localhost:5173`.
