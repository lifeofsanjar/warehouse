# Project Status & Specification: Warehouse Controller

## Project Overview
Internal Warehouse Controller system consisting of a Django REST Framework backend and a React (Vite) + Tailwind CSS frontend. The system allows warehouse owners to manage inventory, products, and categories.

---

## 1. Backend (Django + DRF)

### Tech Stack
*   **Framework:** Django 6.0, Django REST Framework (DRF)
*   **Database:** SQLite (Default)
*   **Documentation:** Swagger / Redoc (`drf-spectacular`)
*   **Authentication:** Token Authentication (`rest_framework.authtoken`)
*   **CORS:** `django-cors-headers` configured for localhost access.

### Implemented Features
*   **Models:**
    *   `User` (Custom auth model with `role` field)
    *   `Warehouse` (Owned by a user)
    *   `Category` (Product categories)
    *   `Product` (Master product list, linked to Category)
    *   `Inventory` (Link between Warehouse and Product with `quantity`)
    *   `StockLog` (History of actions)
*   **API Endpoints:**
    *   `POST /api/login/`: Custom login returning Token, User Info, and Warehouse ID/Name.
    *   CRUD ViewSets for: `/users`, `/warehouses`, `/categories`, `/products`, `/inventory`, `/stock-logs`.
*   **Serializers:**
    *   `InventorySerializer`: Handles both read (nested details) and write (ID-based) operations seamlessly.
*   **Mock Data:**
    *   Script `populate_mock_data.py` available to generate Users (manager/admin), Warehouse, and initial Inventory.

---

## 2. Frontend (React + Vite)

### Tech Stack
*   **Framework:** React 19 (Vite)
*   **Styling:** Tailwind CSS v4
*   **Icons:** Lucide-React
*   **State Management:** Context API (`AuthContext`)
*   **HTTP Client:** Axios (with Interceptors for Token injection)
*   **Export:** `xlsx`, `file-saver`

### Implemented Features

#### A. Authentication
*   **Login Page:** Minimalist UI, handles error states.
*   **Auth Context:** Persists Token, User Profile, and Warehouse Name in `localStorage`.
*   **Protected Routes:** Redirects unauthenticated users to Login.

#### B. Layout & Navigation
*   **Header:** Displays "Warehouse Controller", Warehouse Name, and User Name.
*   **Nav Links:** Dashboard, Categories, Inventory.
*   **Logout:** Clears session and redirects.

#### C. Dashboard (Inventory)
*   **Table View:** Displays SKU, Product Name, Quantity, and Status.
*   **Smart Status:** Highlights "Low Stock" (<10 items) in red.
*   **Real-time Search:** Filter by Name or SKU.
*   **Inline Editing:** Click "Edit" icon to update quantity directly in the row.
*   **Excel Export:** One-click download of current table view.
*   **Add Item Modal (Advanced):**
    *   **Select Mode:** Choose an existing product from the dropdown.
    *   **Create Mode:** Toggle to "Create New" to define a brand new Product (Name, SKU, Category) on the fly.
    *   **Validation:** Robust input checks and error messaging.
    *   **UX:** Loading spinners, disabled states, and success messages.

#### D. Categories Management
*   **List View:** View all product categories.
*   **Create:** Simple modal to add new categories.
*   **Delete:** Remove categories with confirmation.

#### E. Error Handling
*   **Global Error Boundary:** Catches App crashes (white screen) and shows a "Reload" button.
*   **Form Feedback:** In-UI error messages (red banners) instead of browser alerts.
*   **Modal UX:** Dark semi-transparent overlay (`bg-black/75`) with proper Z-index layering.

---

## 3. Current Workflow (User Journey)
1.  **Login** as Manager (linked to a Warehouse).
2.  **Dashboard** loads Inventory for that specific Warehouse.
3.  **Add Item**:
    *   If Product exists -> Select from list, enter Qty, Add.
    *   If New Product -> Toggle "Create New", fill details, Select Category, Add.
4.  **Manage Categories**: Go to Categories page to add "Frozen Foods" before adding "Ice Cream".
5.  **Export**: Download weekly stock report as Excel.
