# TripMates Family Journeys

PROJECT: TRIPMATES — PRIVATE FAMILY TRAVEL & MEMORIES PLATFORM



Build a polished, production-oriented, fully functional web application called TripMates. This is a private website exclusively for my family and relatives, approximately 25 members, to plan future trips, share original-quality photos, and accurately manage trip expenses.



This must be a real, database-backed application, not merely a landing page, static design, or clickable mockup.



1. MAIN OBJECTIVES



Prioritize these features above everything else:



1. Private family photo sharing with original-resolution uploads and downloads.

2. Accurate expense splitting, balances, and repayment tracking.

3. Reusable trip management for multiple past and future trips.

4. Individual accounts and family groups.

5. Fast, responsive performance on Android phones and desktop browsers.



Do not waste time or credits implementing unnecessary chat systems, complicated social feeds, AI travel recommendations, or unrelated features.



2. DESIGN AND USER EXPERIENCE



Create a premium, elegant, family-friendly interface.



- White or soft off-white backgrounds with navy-blue and blue accents.

- Modern typography, balanced spacing, rounded cards, subtle shadows, and consistent icons.

- Excellent mobile-first design for Android phones.

- Responsive tablet and desktop layouts.

- Bottom navigation on mobile where appropriate.

- Desktop navigation with a clear sidebar or top navigation.

- Accessible contrast, readable text, large touch targets, and clear form labels.

- Smooth, subtle transitions without excessive animations.

- Light and dark themes if feasible without compromising reliability.

- Skeleton loaders, progress indicators, empty states, error messages, and success feedback.



Create a polished dashboard showing:



- Upcoming trips.

- Past trips and family memories.

- Total expenses for the selected trip.

- Outstanding balances.

- Recent photo uploads.

- Quick actions for creating a trip, uploading photos, and adding an expense.



3. PRIVATE ACCOUNTS AND FAMILY GROUPS



Implement:



- Secure registration, login, logout, and password recovery.

- Invitation-code registration with an administrator-controlled code.

- Individual user accounts.

- Family groups containing multiple members.

- Optional shared family profiles or family-level participants for expense accounting.

- Trip-specific participant lists.

- Roles for family administrators, trip organizers, and regular members.

- Authorization checks on every protected backend operation.

- Secure password hashing and HTTP-only session cookies or an equally secure authentication mechanism.

- Login rate limiting and secure session expiration.

- Server-side validation and protection against unauthorized access.



A group code must not act as the only security mechanism.



Users must not be able to access another family's trips, expenses, original images, or albums by changing URLs or API parameters.



4. MULTIPLE TRIPS



Allow authorized users to:



- Create, edit, archive, and view trips.

- Add trip names, destinations, descriptions, start dates, end dates, and estimated budgets.

- Invite family members and assign participants.

- Confirm or decline attendance.

- Keep past trips available as memory archives.

- Separate every trip's members, photos, albums, expenses, and settlements.

- Create a new trip without registering everyone again.



Display trip status clearly: upcoming, ongoing, or completed.



5. ORIGINAL-QUALITY PHOTO STORAGE — CRITICAL REQUIREMENT



Photo quality and privacy are among the highest priorities.



Use Cloudflare R2 for private object storage if compatible with the chosen stack. Use MongoDB Atlas for metadata only, not for storing image binaries.



Implement:



- Multiple image uploads from mobile phones and computers.

- Original-file preservation: never overwrite, resize, recompress, or convert the original uploaded file.

- Support common image formats such as JPEG, PNG, WebP, and HEIC when the browser and preview pipeline support them.

- Validate file types, file sizes, and upload permissions.

- Upload progress, retry handling, cancellation where practical, and clear error messages.

- Separate private original files from generated thumbnails.

- Store each image's trip ID, album, uploader, original filename, content type, file size, upload date, and object key.

- Generate smaller thumbnails for fast gallery browsing without modifying originals.

- Provide a dedicated Download Original action that returns the exact original stored file.

- Provide multi-photo selection and bulk downloading where practical.

- Provide private albums organized by trip, date, or location.

- Allow authorized captions, deletion, and album organization.

- Use short-lived signed upload and download URLs, or authenticated streaming, with server-side authorization.

- Never make the private storage bucket public.

- Never expose permanent unrestricted image URLs or storage credentials in frontend code.

- Preserve EXIF metadata in the original file; remove or omit sensitive metadata only from derived previews if needed.

- Avoid loading full-resolution originals into gallery grids.



Do not claim unlimited free storage. Clearly document storage quotas, bandwidth limits, costs, and what happens when limits are reached.



If the selected AI platform cannot configure R2 directly, generate the integration code and explain the exact setup steps. Never silently replace private original storage with a public image-hosting service.



6. EXPENSE CALCULATOR — FINANCIAL CORRECTNESS IS CRITICAL



Implement a reliable ledger-based expense system.



Each expense must include:



- Trip.

- Description.

- Category, such as transport, accommodation, food, tickets, fuel, or other.

- Amount in INR.

- Date.

- Person or family account that paid.

- Selected participants.

- Split method, defaulting to equal.

- Optional notes and receipt attachment.

- Creator and timestamps.



Equal splitting



- Split each expense only among the selected participants.

- Allow different payers and participant lists for different expenses.

- Support individual participants and family-level participants.

- Use integer paise, not floating-point arithmetic, for financial calculations.

- Distribute leftover paise deterministically so all shares add up exactly to the expense amount.

- Validate the split on the server, not only in the frontend.

- Do not include nonparticipants in an expense.

- Allow the same trip to contain different participant lists for different expenses.



Balances



For every participant, calculate:



Net balance = total paid toward shared expenses - total allocated expense shares + valid incoming repayments - valid outgoing repayments.



Positive balance means the participant is owed money. Negative balance means the participant owes money.



Show:



- Total trip expenses.

- Total amount paid by each participant.

- Each participant's allocated share.

- Net balance.

- Who should receive money and who should pay.

- Settlement history and outstanding balances.



Repayments



- Record repayments separately from expenses.

- Prevent duplicate settlement submissions.

- Validate payer, receiver, trip membership, amount, and settlement status.

- Ensure repayments do not increase total trip spending.

- Support partial repayments.

- Provide an auditable transaction history.

- Never change financial records silently.

- Use explicit permissions for edits, reversals, and deletions.



Reporting



- Export expense summaries to CSV.

- Include expense breakdowns by category.

- Show estimated budget versus actual spending.

- Allow viewing the final expense statement for each past trip.



Create automated tests using sample trips, including cases where several people pay, some members do not attend, repayments are partial, and totals contain rounding remainders.



7. PERFORMANCE AND RELIABILITY



Optimize for real-world use and ordinary mobile internet connections.



- Lazy-load gallery images.

- Use thumbnails and responsive preview sizes.

- Paginate large galleries and expense histories.

- Avoid unnecessary API requests and repeated database queries.

- Add appropriate database indexes.

- Avoid unnecessary frontend dependencies.

- Use server-side validation and predictable API responses.

- Handle slow connections, failed uploads, expired sessions, and interrupted requests.

- Prevent duplicate submissions and accidental repeated expense creation.

- Preserve user input when safe to do so.

- Use loading indicators rather than freezing the interface.

- Add database and storage error handling.

- Provide a backup and recovery plan.

- Ensure refreshing the page does not lose saved data.



Do not promise zero lag. Test and optimize the actual application.



8. TECHNICAL ARCHITECTURE



Preferred stack:



- Frontend: React + Vite + Tailwind CSS.

- Backend: Node.js + Express.

- Database: MongoDB Atlas with Mongoose.

- Authentication: secure HTTP-only session cookies with a persistent session store.

- Object storage: Cloudflare R2 with private buckets and signed URLs.

- Hosting: a suitable frontend host such as Vercel and backend host such as Render, or an equivalent compatible deployment.



Use modular code, reusable UI components, environment variables, and clear separation between routes, controllers, database models, middleware, and services.



Include:



- A complete project structure.

- All required source files.

- Database schemas and indexes.

- Authentication and authorization middleware.

- Secure photo upload and download endpoints.

- Expense and settlement services.

- Environment variable examples without real secrets.

- A README with installation, development, testing, and deployment instructions.

- A ".gitignore" that excludes environment files and secrets.



Do not put private credentials or database connection strings in frontend code or commit them to GitHub.



9. TESTING AND RELEASE REQUIREMENTS



Before calling the project complete:



1. Run the production build.

2. Run available lint checks and automated tests.

3. Test registration, login, logout, and session persistence.

4. Test family and trip access restrictions.

5. Test uploading an original image and downloading it again; verify the downloaded bytes match the original.

6. Test thumbnail generation separately from original storage.

7. Test expense calculations independently of the UI.

8. Verify that every expense split adds up to the exact recorded amount.

9. Verify that repayments change balances without changing total expense amounts.

10. Test duplicate submissions, failed requests, invalid files, and expired sessions.

11. Test small-screen layouts and slow network conditions.

12. Verify that private photos and data cannot be accessed without authorization.

13. Clearly document any untested feature, unresolved issue, paid service requirement, or remaining security risk.



Never fabricate successful tests, deployment results, or security guarantees.



10. IMPLEMENTATION STRATEGY



Work incrementally to reduce wasted AI credits.



Phase 1: Create the polished responsive interface using realistic sample data.



Phase 2: Implement authentication, family groups, trips, and database persistence.



Phase 3: Implement private original-photo uploads, thumbnails, and full-quality downloads.



Phase 4: Implement expense calculations, balances, and repayments with automated tests.



Phase 5: Perform security checks, fix bugs, optimize performance, and prepare deployment.



Do not regenerate working components unnecessarily. Make targeted changes and preserve correct existing code.



First provide a concise implementation plan, architecture, estimated service requirements, and a list of files to create. Then implement the first phase. Clearly distinguish completed functionality from mockups and unfinished features.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/81f64fa1-4945-492c-9a28-7e221464fc12).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
