# HirePrep-AI: Backend System Architecture & API Documentation

Welcome to the definitive backend documentation for **HirePrep-AI**. This document provides an exhaustive, granular breakdown of the High-Level Design (HLD), API endpoints, and a comprehensive file-by-file analysis of the `server` directory.

---

## 1. High-Level Design (HLD) & Backend Architecture

The backend of HirePrep-AI is built on Node.js and Express.js, utilizing MongoDB (via Mongoose) as the primary datastore. It follows a highly modular, decoupled architecture that adheres to the **Model-Route-Controller (MRC)** pattern, augmented with Middlewares and external Services.

### Separation of Concerns

- **Routes (`server/routes/`)**: The entry points for the API. They define the URL paths and HTTP methods, binding them to specific middlewares and controllers.
- **Middlewares (`server/middlewares/`)**: Intermediary functions that process requests before they reach the controller. Used primarily for JWT authentication (`isAuth.js`) and handling `multipart/form-data` file uploads (`multer.js`).
- **Controllers (`server/controllers/`)**: The brain of the backend. Controllers execute the core business logic, interact with the database, parse files, handle data manipulation, and send HTTP responses.
- **Services (`server/services/`)**: Isolated modules for integrating with 3rd-party external APIs (e.g., OpenRouter AI API). This keeps external dependency logic completely abstracted from the controllers.
- **Models (`server/models/`)**: Mongoose schema definitions that enforce data structure, validation, and relationships within MongoDB.

### Request-Response Lifecycle Flowchart

```mermaid
flowchart TD
    %% Incoming Request
    Client([Client / Frontend]) -- HTTP Request --> ExpressApp["Express App<br>(server/index.js)"]
    
    %% Global Middleware
    ExpressApp --> GlobalMiddleware[Global Middlewares\ncors, express.json, cookieParser]
    GlobalMiddleware --> Routes[Route Definitions\n/api/*]
    
    %% Routing and Middleware
    Routes --> RouteMatch{Route Found?}
    RouteMatch -- Yes --> AuthMiddle[Middleware\n(e.g., isAuth, multer)]
    AuthMiddle -- Invalid Token / File --> ErrorRes[401 / 400 Error Response]
    
    %% Controller Logic
    AuthMiddle -- Valid --> Controller[Controller Logic\n(e.g., interview.controllers.js)]
    
    %% External Services
    Controller <--> |API Call| Service[External Service\nopenRouter.service.js]
    Service <--> |HTTP Request| ExternalAI[OpenRouter API / GPT-4o-mini]
    
    %% Database Interaction
    Controller <--> |Mongoose Queries| DBModels[Mongoose Models\nUser / Interview]
    DBModels <--> MongoDB[(MongoDB Database)]
    
    %% Response
    Controller --> |Data Formatting| JSONRes[JSON Response]
    JSONRes --> ExpressApp
    ExpressApp --> Client
```

---

## 2. Exhaustive API & Endpoint Documentation

All endpoints are prefixed with the base path defined in `index.js` (e.g., `http://localhost:8000/api`).

### Authentication (`/api/auth`)

#### `POST /api/auth/google`
- **Description:** Authenticates the user via Google. Checks if the user exists by email; if not, creates a new user. Generates a JWT and sets it as an HTTP-only cookie.
- **Middlewares:** None.
- **Controller Invoked:** `auth.controller.js` -> `googleAuth`
- **Expected Request Payload (Body):**
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@example.com"
  }
  ```
- **Expected JSON Response (200):** User document object. Also sets a `token` cookie.

#### `GET /api/auth/logout`
- **Description:** Logs out the user by clearing the JWT authentication cookie.
- **Middlewares:** None.
- **Controller Invoked:** `auth.controller.js` -> `logout`
- **Expected JSON Response (200):**
  ```json
  {
    "message": "Logout Successfully"
  }
  ```

### User Management (`/api/user`)

#### `GET /api/user/current-user`
- **Description:** Fetches the profile data of the currently authenticated user based on the decoded JWT payload.
- **Middlewares:** `isAuth`
- **Controller Invoked:** `user.controller.js` -> `getCurrent`
- **Expected JSON Response (200):** User document object.

### Interview Core (`/api/interview`)

#### `POST /api/interview/resume`
- **Description:** Receives a PDF/Word resume upload, parses its text using `pdfjs-dist`, and prompts the AI to extract structured candidate data (Role, Experience, Projects, Skills).
- **Middlewares:** `isAuth`, `upload.single("resume")`
- **Controller Invoked:** `interview.controllers.js` -> `analyzeResume`
- **Expected Request Payload (FormData):** `multipart/form-data` containing a `resume` file field.
- **Expected JSON Response (200):**
  ```json
  {
    "role": "Frontend Developer",
    "experience": "3-5 Years",
    "projects": ["E-commerce App"],
    "skills": ["React", "Node.js"],
    "resumeText": "Raw extracted text..."
  }
  ```

#### `POST /api/interview/generate-question`
- **Description:** Deducts 50 credits from the user, generates exactly 5 interview questions using AI based on the user's profile/resume, and creates a new Interview record in the DB.
- **Middlewares:** `isAuth`
- **Controller Invoked:** `interview.controllers.js` -> `generateQuestion`
- **Expected Request Payload (Body):**
  ```json
  {
    "role": "Frontend Developer",
    "experience": "1-2 Years",
    "mode": "Technical",
    "resumeText": "...",
    "projects": ["Project A"],
    "skills": ["React"]
  }
  ```
- **Expected JSON Response (200):**
  ```json
  {
    "interviewId": "64abcdef123...",
    "creditsLeft": 50,
    "userName": "John Doe",
    "questions": [
      { "question": "Explain closures.", "difficulty": "easy", "timeLimit": 60, "score": 0 }
    ]
  }
  ```

#### `POST /api/interview/submit-answer`
- **Description:** Submits a spoken/typed answer for a specific question. Uses AI to evaluate confidence, communication, and correctness out of 10.
- **Middlewares:** `isAuth`
- **Controller Invoked:** `interview.controllers.js` -> `submitAnswer`
- **Expected Request Payload (Body):**
  ```json
  {
    "interviewId": "64abcdef123...",
    "questionIndex": 0,
    "answer": "A closure is...",
    "timetaken": 45
  }
  ```
- **Expected JSON Response (200):**
  ```json
  {
    "feedback": "Great explanation, but try to mention lexical scoping next time."
  }
  ```

#### `POST /api/interview/finish`
- **Description:** Finalizes the interview, calculates the final average score across all answered questions, assigns a qualitative result, and marks the status as "Completed".
- **Middlewares:** `isAuth`
- **Controller Invoked:** `interview.controllers.js` -> `finishInterview`
- **Expected Request Payload (Body):**
  ```json
  {
    "interviewId": "64abcdef123..."
  }
  ```
- **Expected JSON Response (200):**
  ```json
  {
    "totalQuestions": 5,
    "totalScore": 35,
    "averageScore": 7,
    "result": "Good",
    "questions": [...]
  }
  ```

#### `GET /api/interview/history`
- **Description:** Retrieves all previous interview sessions for the logged-in user, sorted chronologically (newest first).
- **Middlewares:** `isAuth`
- **Controller Invoked:** `interview.controllers.js` -> `getMyInterview`
- **Expected JSON Response (200):**
  ```json
  [
    {
      "_id": "...",
      "role": "Frontend Developer",
      "experience": "1-2 Years",
      "mode": "Technical",
      "finalScore": 8,
      "status": "Completed",
      "createdAt": "2023-10-01T12:00:00Z"
    }
  ]
  ```

#### `GET /api/interview/report/:id`
- **Description:** Fetches a specific interview report by ID. Calculates aggregate metric averages (confidence, communication, correctness) dynamically.
- **Middlewares:** `isAuth`
- **Controller Invoked:** `interview.controllers.js` -> `getInterviewReport`
- **Expected Request Payload (Params):** `id` (MongoDB ObjectId)
- **Expected JSON Response (200):** Complete report data including dynamically calculated aggregated averages.

---

## 3. Comprehensive File & Function Reference

### 3.1 Server Root
#### `server/index.js`
- **Purpose:** The main entry point that configures and starts the Express server.
- **Functions & Middleware:**
  - `dotenv.config()`: Loads environment variables.
  - `cors(...)`: Enables Cross-Origin Resource Sharing. Configured specifically for the production frontend (`origin: "https://ai-interview-agent-9.onrender.com"`) with `credentials: true` to allow cookies.
  - `express.json()`: Parses incoming JSON payloads.
  - `cookieParser()`: Parses `Cookie` headers and populates `req.cookies`.
  - `connectDb()`: Establishes the database connection.
  - **Routes Mounted:** `/api/auth`, `/api/user`, `/api/interview`.
  - `app.listen()`: Binds the application to the network port.

### 3.2 Configurations (`server/config/`)
#### `config/connectDb.js`
- **Function:** `connectDb`
- **Purpose:** Connects to the MongoDB cluster.
- **How it works:** Awaits `mongoose.connect()` using the `MONGODB_URL` env variable. Logs success or failure. On failure, calls `process.exit(1)` to terminate the app.

#### `config/token.js`
- **Function:** `genToken(userId)`
- **Purpose:** Generates a JSON Web Token.
- **Parameters:** `userId` (MongoDB ObjectId).
- **How it works:** Uses `jwt.sign()` to sign an object `{ userId }` against `JWT_SECRET`. Sets expiration to `7d` (7 days). Returns the token string.

### 3.3 Middlewares (`server/middlewares/`)
#### `middlewares/isAuth.js`
- **Function:** `isAuth(req, res, next)`
- **Purpose:** Protects routes by validating the JWT cookie.
- **How it works:** 
  1. Extracts `token` from `req.cookies`.
  2. If missing, returns `400` status.
  3. Uses `jwt.verify()` with `JWT_SECRET` to decode the payload.
  4. Attaches `req.user = verifyToken.userId` to pass the authenticated user's ID to the next controller.
  5. Calls `next()`.
- **Error Handling:** Returns `500` if verification throws an exception.

#### `middlewares/multer.js`
- **Object Exported:** `upload`
- **Purpose:** Handles `multipart/form-data` to save uploaded files (resumes) temporarily to the server filesystem.
- **How it works:**
  1. Defines `uploadPath` as `"uploads"`.
  2. Uses `fs.existsSync` and `fs.mkdirSync` to dynamically create the folder if missing.
  3. Configures `multer.diskStorage` to rename the file uniquely (`Date.now() + originalName`).
  4. Configures a `fileFilter` to accept only MIME types for PDF, DOC, and DOCX.
  5. Sets a file size limit of `5MB`.

### 3.4 Services (`server/services/`)
#### `services/openRouter.service.js`
- **Function:** `askAi(messages)`
- **Purpose:** Abstracts the logic of communicating with the OpenRouter AI API.
- **Parameters:** `messages` (Array of objects containing role and content).
- **How it works:**
  1. Validates the `messages` array and checks for `OPENROUTER_API_KEY`.
  2. Executes an `axios.post` to `https://openrouter.ai/api/v1/chat/completions`.
  3. Uses model `"openai/gpt-4o-mini"`.
  4. Passes headers including `HTTP-Referer` and `X-Title`.
  5. Extracts the string response from `response.data.choices[0].message.content`.
- **Error Handling:** Intercepts Axios errors, logs the internal `error.response?.data`, and throws a clean Error message upstream.

### 3.5 Models (`server/models/`)
#### `models/usermodel.js`
- **Schema:** `userSchema`
- **Fields:**
  - `name`: String, required.
  - `email`: String, required, unique.
  - `credits`: Number, defaults to 100.
- **Purpose:** Represents the user in the MongoDB `users` collection. Enables tracking of interview credits.

#### `models/interview.model.js`
- **Schemas:** `questionSchema` (Subdocument), `interviewSchema` (Main)
- **`questionSchema`:**
  - Stores `question`, `difficulty` (enum), `timeLimit`, `answer`, `feedback`, and individual metric scores (`score`, `confidence`, `communication`, `correctness`).
- **`interviewSchema`:**
  - Relates to user via `userId` (`ObjectId`, ref: "User").
  - Stores metadata: `role`, `experience`, `mode` (HR/Technical), and `resumeText`.
  - Embeds an array of `questionSchema` objects.
  - Tracks `finalScore` and `status` (Incompleted / Completed).

### 3.6 Controllers (`server/controllers/`)
#### `controllers/auth.controller.js`
- **Function: `googleAuth`**
  - **Purpose:** Handles login/signup via Google.
  - **How it works:** Queries `User.findOne({ email })`. If null, creates a new user via `User.create()`. Calls `genToken()`. Sets the cookie `res.cookie("token", ...)` with `httpOnly: true`. Returns `200` with the user object.
- **Function: `logout`**
  - **Purpose:** Ends the session.
  - **How it works:** Calls `res.clearCookie("token")`. Returns a success message.

#### `controllers/user.controller.js`
- **Function: `getCurrent`**
  - **Purpose:** Returns logged-in user details.
  - **How it works:** Uses `req.user` (injected by `isAuth`). Queries `User.findById()`. Returns `404` if not found, or `200` with user data.

#### `controllers/interview.controllers.js`
- **Function: `safeJsonParse(text, fallback)`**
  - **Purpose:** Utility. Strips Markdown code fences (e.g., ````json`) from AI responses and parses it. Returns `fallback` on error.
- **Function: `analyzeResume`**
  - **Purpose:** Extracts data from an uploaded PDF.
  - **How it works:** Reads file buffer via `fs.promises.readFile`. Parses it page-by-page using `pdfjsLib.getDocument`. Cleans the text. Sends it to `askAi` with a strict JSON format instruction. Uses `safeJsonParse` to extract role, experience, projects, and skills. Deletes the temp file via `fs.promises.unlink`.
- **Function: `generateQuestion`**
  - **Purpose:** Creates interview state.
  - **How it works:** Validates body fields. Fetches the User. Checks for `>= 50` credits. Constructs a detailed prompt string. Calls `askAi` asking for 5 questions, ordering by difficulty. Parses the AI response string into an array. Deducts 50 credits from the User and saves. Creates an `Interview` DB document with the 5 questions, mapping static time limits and difficulties to them.
- **Function: `submitAnswer`**
  - **Purpose:** Evaluates user responses.
  - **How it works:** Fetches the interview by ID. Validates the question index. If no answer is provided or time taken exceeds `timeLimit`, sets score to `0` with standard feedback. Otherwise, calls `askAi` with the question and answer to get a JSON evaluation. Updates the specific question's metrics in the DB and saves.
- **Function: `finishInterview`**
  - **Purpose:** Concludes the session.
  - **How it works:** Sums the `score` of all questions and divides by the length to get `averageScore`. Assigns a string `result` based on thresholds (Excellent, Good, Average, Needs Improvement). Updates `status` to "Completed".
- **Function: `getMyInterview`**
  - **Purpose:** Dashboard history feed.
  - **How it works:** Queries `Interview.find({ userId: req.user })`, sorts by `createdAt: -1` (newest first), and selects only specific fields to optimize payload size.
- **Function: `getInterviewReport`**
  - **Purpose:** Detailed analytics breakdown.
  - **How it works:** Queries `Interview.findById()`. Dynamically calculates the average confidence, communication, and correctness across all questions in the array. Formats the data and returns it for the frontend charting components.

### 3.7 Routes (`server/routes/`)
#### `routes/authRoute.js`
- `POST /google` -> `googleAuth`
- `GET /logout` -> `logout`

#### `routes/user.route.js`
- `GET /current-user` -> `isAuth` -> `getCurrent`

#### `routes/interviewRouter.js`
- `POST /resume` -> `isAuth` -> `upload.single("resume")` -> `analyzeResume`
- `POST /generate-question` -> `isAuth` -> `generateQuestion`
- `POST /submit-answer` -> `isAuth` -> `submitAnswer`
- `POST /finish` -> `isAuth` -> `finishInterview`
- `GET /history` -> `isAuth` -> `getMyInterview`
- `GET /report/:id` -> `isAuth` -> `getInterviewReport`

---

## 4. Setup, Configuration & Execution

### Environment Variables
In the `server` directory, create a `.env` file containing the following required keys:

```env
# Application Port
PORT=8000

# MongoDB Connection String (Replace with your credentials)
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/hireprep?retryWrites=true&w=majority

# Secret for signing JWT Cookies
JWT_SECRET=your_super_secret_jwt_key_here

# OpenRouter API Key for GPT-4o-mini access
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Terminal Commands

To set up and run the backend server, execute the following commands in your terminal:

**1. Navigate to the server directory:**
```bash
cd path/to/HirePrep-AI/server
```

**2. Install all Node.js dependencies:**
*(This installs `express`, `mongoose`, `jsonwebtoken`, `multer`, `axios`, `pdfjs-dist`, `cors`, `cookie-parser`, and `dotenv`)*
```bash
npm install
```

**3. Run the development server:**
*(This relies on the `dev` script in `package.json` which uses `nodemon` for hot-reloading)*
```bash
npm run dev
```

You should see terminal output indicating successful initialization:
```text
Server running on port 8000
MongoDB Connected: cluster.mongodb.net
```
