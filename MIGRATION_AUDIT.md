# SAN Photography Media Migration Audit

## 1. Files using Cloudinary
- `src/services/cloudinary.ts` — browser-side Cloudinary upload, chunking, optimization, and response handling
- `src/admin/AboutPageManagement.tsx`
- `src/admin/BlogManagement.tsx`
- `src/admin/FilmManagement.tsx`
- `src/admin/GalleryManagement.tsx`
- `src/admin/HomePageManagement.tsx`
- `src/admin/PortfolioManagement.tsx`
- `src/pages/Portfolio.tsx`
- `backend/database/schema.sql` — Cloudinary-specific comments and `public_id`/resource metadata columns
- `backend/php/api/portfolio.php` — Cloudinary metadata parsing and delete/update logic
- `backend/php/api/gallery.php` — Cloudinary URL/public_id handling and DB storage logic

## 2. Upload flows
- Admin upload UI calls `uploadToCloudinary(file, folder, progress)` from the browser.
- The Cloudinary browser client sends multipart uploads directly to Cloudinary.
- Large video uploads are handled by chunked browser uploads with retry logic and unique upload IDs.
- After upload, the URL is saved in MySQL and re-used by the public site.

## 3. Delete flows
- Admin pages send delete requests through the PHP gallery/portfolio APIs.
- Those APIs still retain `public_id` and Cloudinary metadata, but the actual asset removal is not consistently implemented in the current server code.
- The safe replacement is to delete the stored file from the local uploads directory and keep the MySQL record aligned.

## 4. Database tables/columns involved
- `portfolio_media`: `slot`, `title`, `image_url`, `public_id`, `resource_type`, `format`, `width`, `height`, `bytes`, `folder`
- `gallery_media`: `category`, `title`, `image_url`, `public_id`, `resource_type`, `format`, `width`, `height`, `bytes`, `folder`, `order`, `is_active`
- `sliders`: `image`, `public_id`
- `website_content`: JSON content objects holding URLs and hero fields for the public website

## 5. Existing media URL structure
- Cloudinary URLs are stored directly in MySQL fields such as `image_url` and `heroVideoUrl`.
- The public React site reads those URLs directly and renders them with no additional transformation layer.
- The replacement should preserve this behavior by storing server-relative paths like `/uploads/images/gallery/...` and `/uploads/videos/films/...`.

## 6. Existing large-video handling
- `src/services/cloudinary.ts` contains chunked upload logic using `Content-Range` and `X-Unique-Upload-Id`.
- That logic is browser-driven and relies on Cloudinary account limits.
- The new PHP-backed ServerByt workflow should use the same chunking strategy on the server side for 1GB+ video intake.

## 7. What needs to change
- Replace the browser Cloudinary upload client with a PHP upload endpoint.
- Keep the admin UI and function names intact, but route uploads to the server filesystem.
- Store server-relative paths in MySQL without changing public content structure.
- Add safe upload validation, session-based chunk assembly, and authenticated delete handling.
- Keep Cloudinary data until production verification confirms the migration is complete.

## ServerByt storage structure
- `/public/uploads/images/gallery/...`
- `/public/uploads/images/portfolio/...`
- `/public/uploads/images/home/...`
- `/public/uploads/videos/gallery/...`
- `/public/uploads/videos/portfolio/...`
- `/public/uploads/videos/films/...`

## Manual migration status
This repository has been audited and replaced with a server-side upload adapter, but production verification still requires a live ServerByt environment to confirm actual uploads, database persistence, and public rendering in the hosted setup.

> REQUIRES PRODUCTION SERVER VERIFICATION
