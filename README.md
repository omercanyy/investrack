# investrack: an investment tracker

This document is the single source of truth for our project. It outlines the tech stack, data structure, and a full breakdown of features (Epics and Stories) to guide development. This serves as an onboarding document for new members, a real-time project tracker, and a context document for LLM collaborators.

## Project Goal

To build a web application that replaces a Google Sheets-based investment tracker, providing a more modular, scalable, and user-friendly interface to manage and analyze a personal investment portfolio.

## Team Members

* **Architect:** Responsible for the overall project roadmap and high-level decisions regarding architecture and budget. The architect is also responsible for talking to the customer.
* **Devops/Firebase engineer:** Responsible for any change regarding Devops, CI/CD, or Firebase.
* **Senior engineer:** Responsible for creating specs for user stories or bugs to lead the mid-level engineer. The senior engineer is to clarify all design decisions and some implementation decisions when they are important.
* **Mid-level engineer:** Responsible for implementing specs created by the senior engineer. The mid-level engineer is not expected to handle any ambiguity regarding the solution technologies and design. However, they can make implementation decisions for the most part.
* **Researchers:** A team of engineers and scientists that can research any topic and create a deep-dive article on it. They require a spec doc similar to a mid-level engineer.
* **Tech Writer:** Responsible for keeping this document, in-code comments, and all other project documentation up-to-date, clean, and reflective of the current codebase.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd investrack
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Firebase API keys.

    ```.env
    VITE_API_KEY=your_firebase_api_key
    VITE_AUTH_DOMAIN=your_firebase_auth_domain
    VITE_PROJECT_ID=your_firebase_project_id
    VITE_STORAGE_BUCKET=your_firebase_storage_bucket
    VITE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    VITE_APP_ID=your_firebase_app_id
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## Tech Stack

This outlines the key technologies and services currently used to run the application.

* **Frontend:**
    * **Framework:** React 18+ (using Vite)
    * **Styling:** Tailwind CSS
    * **UI Components:** Headless UI (for modals, dropdowns)
    * **Icons:** Heroicons
    * **Charting:** Recharts
* **Backend & Platform:**
    * **Platform:** Firebase
    * **Authentication:** Firebase Authentication (Email/Password, Google)
    * **Database:** Firestore
    * **Deployment:** Firebase Hosting
## Data Structure

All user-specific data is stored in subcollections under the corresponding user's document.

*   `users/{userId}`: Stores basic user profile info and status flags.
    *   `status/schwab`: Document indicating if the user's Schwab account is connected.
*   `users/{userId}/positions/{positionId}`: Subcollection for a user's **current** position lots.
    *   `{ ticker, amount, fillPrice, date, createdAt }`
*   `users/{userId}/closed_positions/{closedId}`: Subcollection for a user's **closed** position lots.
    *   `{ ticker, amount, fillPrice, date, exitPrice, exitDate, closedAt }`
*   `users/{userId}/strategies/{ticker}`: Subcollection storing the user-defined strategy for each ticker.
    *   `{ strategy: "Long" }`

The following collections are stored at the root level:

*   `betas/{ticker}`: A read-only cache of calculated Beta values for each ticker.
*   `user_credentials/{userId}`: A secure, backend-only collection to store sensitive credentials like Schwab refresh tokens.

## Project Architecture & File Overview

### Core Architecture (Current)

The application is a **client-side React application** that relies on Firebase for its backend-as-a-service (BaaS) capabilities. While most business logic, calculations, and data fetching run in the user's browser, the application uses a **Firebase Function** to securely handle the Charles Schwab API authentication and token refresh flow.

1.  **Schwab API Authentication**
    The `schwabApi.js` client communicates with a dedicated Firebase Function (`refreshSchwabToken`) to exchange the user's authorization code for an access token and to handle subsequent token refreshes. This is essential for securely managing API credentials and ensuring continuous access to the Schwab API.

3.  **Beta Calculation Architecture**
    The Beta calculation is a critical, multi-step process that bridges the client and the database:
    * **Trigger:** The user (an admin) navigates to the `AdminTools` component (currently on the `PositionsPage`).
    * **Fetch:** The user clicks "Calculate & Cache All Betas." This triggers a function that fetches data for all tickers in the `positions` collection, plus `SPY`.
    * **Process:** This large data set is passed to the `calculateBeta` utility in `src/utils/betaCalculator.js`, which performs the statistical analysis (covariance, variance) and returns a Beta value for each ticker.
    * **Cache:** The resulting Beta value is written to the `betas/{ticker}` collection in Firestore.
    * **Read:** All regular users (and the admin) consume this data. The `PortfolioContext` reads from the `betas` collection on load, providing the data to the Dashboard `StatCard` and `Risk Analysis` components.

### Repository Architecture (Current)

The `src` directory is organized to separate concerns, making the codebase easier to maintain.

* `/src`: Main application source code.
* `/src/assets`: Static assets like images and SVGs.
* `/src/components`: Reusable presentational components.
    * `Layout.jsx`: The main app shell with sidebar and header.
    * `StatCard.jsx`: The generic card component for the dashboard.
    * `AdminTools.jsx`: Component to house admin-only actions like Beta calculation.
* `/src/constants`: Shared, app-wide constant values.
    * `colors.js`: Defines shared color schemes (e.g., `RISK_COLORS`).
* `/src/context`: React Context providers for global state management.
    * `AuthContext.jsx`: Manages user login state and user object.
    * `PortfolioContext.jsx`: Manages all portfolio data (positions, calculations, API calls).
* `/src/pages`: Top-level components that correspond to a "page" or "route."
    * `DashboardPage.jsx`: The main dashboard.
    * `PositionsPage.jsx`: The table of aggregated positions and lots.
    * `ClosedPositionsPage.jsx`: Table of all realized gains/losses.
* `/src/utils`: Helper modules, utilities, and API clients.
    * `schwabApi.js`: The dedicated client for all Schwab API interactions.
    * `betaCalculator.js`: Logic for calculating and categorizing Beta.
    * `xirr.js`: The internal XIRR calculation function.
    * `csvParser.js`: Logic for parsing the user-uploaded CSV.

## Attention for LLMs (Onboarding Guide)

Welcome! To ramp up on this project quickly, please follow these "golden rules":

1.  **THE BRAIN IS THE CONTEXT:** All global data-fetching and complex calculations live in `src/context/PortfolioContext.jsx`. **DO NOT** add new data-fetching logic (useEffect) to the pages (like `DashboardPage`).
2.  **DATA FLOW:** The data flows in one direction: `Firebase/API -> PortfolioContext (fetch/calculate) -> usePortfolio() (hook) -> Pages (display)`
3.  **SEPARATION OF CONCERNS:**
    * **Data Logic:** `PortfolioContext.jsx`
    * **Routing Logic:** `App.jsx`
    * **Auth Logic:** `AuthContext.jsx`
    * **Page Layout:** `src/pages/`
    * **Reusable UI:** `src/components/`
    * **Helper Functions:** `src/utils/`
4.  **STATE MANAGEMENT:**
    * **Global App State** (e.g., user, `aggregatedPositions`): Handled by `AuthContext` and `PortfolioContext`.
    * **Routing State** (e.g., `activePage`): Handled by `App.jsx`.
    * **Local UI State** (e.g., `isModalOpen`): Handled by the component that needs it (e.g., `PositionsPage.jsx`).

## Epics & Stories

### Epic 1: Setup & CI/CD (Complete)
As a user, I want a complete, deployable project foundation.

| Story ID | Description | Status |
| :--- | :--- | :--- |
| 1.1 | "As a user, I want a new React (Vite) project created on my local machine." | Done |
| 1.2 | "As a user, I want a new Firebase project with Auth, Firestore, and Hosting enabled." | Done |
| 1.3 | "As a user, I want my local app connected to Firebase, with config keys loaded from a .env file." | Done |
| 1.4 | "As a user, I want to deploy the ""Hello World"" app to a live Firebase Hosting URL." | Done |
| 1.5 | "As a dev, I want to set up CI/CD with GitHub Actions for automatic deployment." | To Do |

### Epic 2: Core UI & Authentication (Complete)
As a user, I want to log in and see a professional, responsive layout.

| Story ID | Description | Status |
| :--- | :--- | :--- |
| 2.1 | "As a user, I want to see a clean layout with a sidebar (desktop) and top bar (mobile)." | Done |
| 2.2 | "As a user, I want to see a ""Login with Google"" button if I am not authenticated." | Done |
| 2.3 | "As a user, I want to log in by clicking the button." | Done |
| 2.4 | "As a user, I want to see my name/photo and a ""Log Out"" button if I am authenticated." | Done |
| 2.5 | "As a user, I want the app to remember me when I return." | Done |

### Epic 3: Position Management (Complete)
As a user, I want to perform full CRUD operations on my positions.

| Story ID | Description | Status |
| :--- | :--- | :--- |
| 3.1 | "As a user, I want to see a table/list of my 'Current Positions'." | Done |
| 3.2 | "As a user, I want to add a new position by entering Date, Fill Price, Amount, and Ticker." | Done |
| 3.3 | "As a user, I want to see the current price and my gain/loss for each position." | Done |
| 3.4 | "As a user, I want to classify each  *ticker* (not lot) with a Strategy (e.g., ""Long"")." | Done |
| 3.5 | "As a user, I want to close a position (full or partial) by adding an exit date and exit price." | Done |
| 3.6 | "As a user, I want to see a list of my 'Closed Positions' in a separate view." | Done |
| 3.7 | "As a user, I want to see my positions aggregated by ticker, with a toggle to expand/see individual lots." | Done |
| 3.8 | "As a user, I want to delete a position lot in case of a data entry mistake." | Done |
| 3.9 | "As a user, I want ""Expand All"" and ""Collapse All"" buttons for the aggregated view." | Done |
| 3.10 | "As a user, I want the ""Add Position"" form to be responsive and stack on mobile." | Done |
| 3.11 | "As a user, I want to be able to sort the positions table by clicking on column headers." | To Do |

### Epic 4: Dashboard & Analytics (In Progress)
As a user, I want to see a high-level "Snapshot" of my portfolio's performance.

| Story ID | Description | Status |
| :--- | :--- | :--- |
| 4.1 | "As a user, I want to see the total value of my portfolio on the dashboard." | Done |
| 4.2 | "As a user, I want to see a pie chart of my portfolio's composition by ticker." | Done |
| 4.3 | "As a user, I want to see my portfolio's XIRR calculation to track annualized returns." | Done |
| 4.4 | "As a user, I want to see the XIRR for a ""Buy & Hold SPY"" and ""Buy & Hold GLD"" strategy displayed for comparison. " | Done |
| 4.5 | "As a user, I want to see my portfolio's weighted Beta." | Done |
| 4.6 | "As a user, I want to see each position’s beta, beta category (low, medium, high) " | Done |
| 4.7 | "As a user, I want to see the distribution of my funds into these categories in a pie chart " | Done |

### Epic 5: AI-Powered Insights (To Do)
As a user, I want AI to provide me with summaries and insights about my holdings.

| Story ID | Description | Status |
| :--- | :--- | :--- |
| 5.1 | "As a user, I want to see a dedicated ""News"" panel on my dashboard." | To Do |
| 5.2 | This panel will fetch news for all tickers in my portfolio. | To Do |
| 5.3 | The news will be summarized (1-2 sentences) by an AI (Genkit + Gemini). | To Do |
| 5.4 | The news items will be sorted by the ticker's absolute % change for the day. | To Do |
| 5.5 | "As a user, I want to click a summary to see a list of 2-3 conflicting/supporting articles." | To Do |

### Epic 6: Schwab Integration (Phase 2) : OAuth and Refactors
Long-term ideas for a "v2" of the app.

| Story ID | Description | Status |
| :--- | :--- | :--- |
| 6.1 | "[Auth] Create a new ""Connect to Schwab"" button in the app (e.g., in Layout or a new Settings page) that redirects the user to the Schwab login & consent screen." | Done |
| 6.2 | "[Auth] Create a new page at /auth/schwab/callback to handle the redirect from Schwab. This page will be responsible for parsing the `code` from the URL." | Done |
| 6.3 | "[Auth] Implement the complete Schwab Authentication Service (two callable functions) to securely handle the initial code-to-token exchange AND manage continuous token renewal." | Done |
| 6.4 | "[Auth] Securely store the encrypted `refresh_token` in a new Firestore collection (e.g., `user_credentials/{userId}`) associated with the user." | Done |
| 6.5 | "[Core] Create a new `src/utils/schwabApi.js` client. This client will manage all API calls, automatically attaching the `access_token` and using the `refresh_token` to get a new `access_token` if one expires." | Done |
| 6.6 | "[Refactor] Refactor the `PortfolioContext` to get current prices for all positions using the new `schwabApi.js` client and the `GET /marketdata/v1/quotes` endpoint." | Done |
| 6.7 | "[Refactor] Refactor the XIRR calculation for SPY and GLD to use the `schwabApi.js` client and the `GET /marketdata/v1/pricehistory` endpoint (requesting 20 years, daily frequency)." | Done |
| 6.8 | "[Refactor] Completely remove the manual Beta calculation from `AdminTools`. Replace it with a new `AdminTools` function that calls `GET /marketdata/v1/quotes` with `fields=fundamental` for all tickers and saves the `beta` value to the `betas` collection." | Done |
| 6.9 | "[Cleanup] Deprecate and remove the old `src/utils/api.js` (EODHD client) and all related `EODHD_API_KEY` environment variables." | Done |

### Epic 7: Future & Advanced Features (To Do)
Pre-launch security stuff.

| Story ID | Description | Status |
| :--- | :--- | :--- |
| 7.1 | "As a user, I want my data secured by production-ready Firestore rules, ensuring users can only read/write their own `positions`, `closed_positions`, and `strategies`." | Done |
| 7.2 | "[Clarified] All users have full control over their own data, so a special 'admin' role with custom claims is not needed. Firestore rules already ensure users can only access their own data." | Done |
| 7.3 | "As a dev, I want to review and deploy all necessary Firestore indexes (via `firestore.indexes.json`) to prevent query failures in production." | To Do |
| 7.4 | "As a dev, I want to review and configure API key and domain restrictions in Firebase and Google Cloud to protect our quota and prevent unauthorized use." | Done |

### Epic 8: Schwab Integration (Phase 2): Account Sync
To use the established Schwab connection (from Epic 6) to allow users to import and sync their actual brokerage positions, replacing the need for manual CSV/form entry.

| Story ID | Description | Status |
| :--- | :--- | :--- |
| 8.1 | "[Core] Add a new ""Sync with Schwab"" button to the `PositionsPage`." | To Do |
| 8.2 | "[Core] Implement the `GET /accounts/v1/accounts` endpoint to fetch the user's list of account numbers. (If multiple, we must provide a UI for them to select one)." | To Do |
| 8.3 | "[Core] Call the `GET /trading/v1/accounts/{accountHash}/positions` endpoint using the selected account to fetch all current positions." | To Do |
| 8.4 | "[Data] Create a ""transformer"" utility that maps the Schwab position data (e.g., `SchwabPosition.instrument.symbol`) to our Firestore `positions` data model." | To Do |
| 8.5 | "[Data] Implement the ""sync"" logic: iterate through the user's Firestore `positions` and merge them with the Schwab data. This must handle three cases: positions only in Schwab (add), positions in both (update), positions only in Firestore (keep, or mark as 'manual')." | To Do |
| 8.6 | "[Data] Implement the `GET /trading/v1/accounts/{accountHash}/transactions` endpoint to fetch historical transactions." | To Do |
| 8.7 | "[Data] Create a ""transformer"" utility to map Schwab transactions to our `closed_positions` data model. This is the key to solving the ""unique ID"" problem for closed trades." | To Do |
| 8.8 | "[UI] Add a ""Last Synced"" timestamp to the UI so the user knows when the data was last pulled." | To Do |
| 8.9 | "[Future] Investigate using `ACCT_ACTIVITY` streaming (from Trader API - Individual Market Data Production(3).PDF) for a real-time, push-based sync instead of a manual button pull." | To Do |
