# Daisy's Cookery — Admin Portal & Web Platform Master Specification

---

## 1. System Architecture & Visual Design System

### Technology Stack

* **Frontend:** Next.js (React) + Tailwind CSS
* **Backend & Database:** Supabase (PostgreSQL + Realtime WebSockets)
* **Storage:** Supabase Storage (Cake designs, customer screenshots, banner assets)
* **Hosting & CDN:** Vercel (Edge network optimization for Bangladesh mobile networks)
* **Local Payment Integration:** bKash & Nagad Merchant Gateway / TrxID Verification
* **Messaging & Alerts:** WhatsApp Web API (`wa.me` payload formatter) + SMS Gateway

### Design Tokens & Aesthetics

* **Primary Brand Orange:** `#FF8225` *(Primary CTAs, logo background, highlights)*
* **Deep Chocolate Brown:** `#3C2415` *(Text headers, border strokes, dark accents)*
* **Warm Vanilla Cream:** `#FFF9F0` *(Primary web background, card backdrops)*
* **Pastel Accents:** `#E5F6F0` *(Mint Green)* and `#FFECEE` *(Pastel Pink)*
* **Typography:** `Fredoka` / `Caveat` (Display Headings), `Nunito` (UI & Body text)

---

## 2. Master Dashboard Feature Specifications

### Module 1: Manual Order Entry & FB Inbox Conversion

* **Customer Lookup & Auto-Fill:** Search returning customers by phone number or Facebook profile name; auto-populate delivery addresses and order history.
* **Rapid Order Builder:** Build orders on behalf of Facebook chat customers:
* Select standard catalog cakes or build custom cake profiles (Flavor, Sponge, Layers, Weight).
* Input text writing for the cake board, candle count, and delivery date/time slot.


* **Direct Chat Image Attachment:** Drag-and-drop reference photos sent by customers in Facebook Messenger directly into the order file.
* **Manual Payment & Deposit Handling:** Record payments as *Paid via bKash/Nagad*, log manual TrxIDs provided in chat, or record 50% advance deposits with automatic Cash on Delivery (COD) balance tagging.
* **1-Click Inbox Order Slip Generator:** Generates a clean text/image confirmation slip or web invoice link to paste back into the Facebook chat.

### Module 2: Kitchen Operations & Live Order Pipeline

* **Unified Visual Kanban Board:** Tracks Web Orders and FB Manual Orders in 5 real-time columns:

$$\text{Pending Approval} \longrightarrow \text{Deposit Verified} \longrightarrow \text{Baking/Decorating} \longrightarrow \text{Ready for Pickup/Delivery} \longrightarrow \text{Completed}$$


* **Date & Slot Filtering:** Filter kitchen production strictly by **Delivery Date** and **Time Window** (e.g., *Morning 10 AM - 1 PM* vs. *Evening 5 PM - 8 PM*).
* **Daily Kitchen Batch Sheet:** Aggregates production targets into a single summary sheet (e.g., *"Today's Batch: 5x 1lb Chocolate Fudge, 3x 2lb Red Velvet, 2x Custom Fondant"*).
* **Printable Cake Spec Slips:** 1-click box label generation with Customer Name, Order Source (*Web* vs *FB Chat*), Delivery Slot, Flavor, Weight, Board Writing, and Reference Photo Thumbnail.

### Module 3: Customer Reviews & Social Proof Management

* **Manual Review Creator Form:** Direct portal form to add reviews with:
* **Reviewer Name:** Customer or Facebook profile name.
* **Review Text:** Full feedback commentary.
* **Cake Image Upload:** Upload photos of the finished cake, customer cutting the cake, or inbox chat screenshots.
* **Star Rating:** 1 to 5-star rating selector.
* **Catalog Product Tagging:** Attach the review to a specific cake item to display it on that product's detail page.


* **Screenshot Review Uploader:** Upload direct inbox chat screenshots (Facebook/WhatsApp).
* **Homepage Feature Toggle:** Switch to pin high-converting reviews to the main homepage testimonial grid or banner carousel.

### Module 4: Storefront Content & Media Manager

* **Product Catalog Manager:** Manage titles, descriptions, weight variants (1 lb, 2 lb, tiered), base prices, and flavor choices.
* **Photo Gallery Uploader:** Upload multi-angle photos to cloud storage with tag categories.
* **Event Filter Tagging:** Assign items to event taxonomies:
1. *Birthday (Kids & Adults)*
2. *Anniversary & Romance*
3. *Wedding & Gaye Holud*
4. *Engagement & Ring Ceremony*
5. *Baby Shower & Sadh*
6. *Graduation & Success*
7. *Eid & Festive Specials*
8. *Valentine's & Mother's/Father's Day*
9. *Corporate & Office Parties*
10. *Kids & Character Themes*


* **Inventory & Availability Toggle:** Switch item status between *In Stock*, *Sold Out*, or *Pre-Order Only*.
* **Banner Publisher:** Publish promo banners or notification bars (e.g., *"Eid Pre-Orders Closing Soon!"*).

### Module 5: Custom Quote & WhatsApp Engine

* **Reference Photo Inspector:** Panel to inspect customer reference photos, custom theme notes, and icing color choices.
* **Custom Quote & Link Generator:** Enter custom prices for complex designs and generate pre-filled checkout links sent via WhatsApp, SMS, or Messenger.

### Module 6: MFS Payment & Financial Ledger

* **bKash & Nagad TrxID Matcher:** Interface to match customer-submitted MFS Transaction IDs against incoming payment records.
* **Deposit & COD Balance Tracker:** Track advance deposits versus remaining balances due at delivery.
* **Daily Financial Breakdown:** Real-time summary of daily cash collected via bKash/Nagad vs. pending COD balances.

### Module 7: Capacity & Delivery Logistics

* **Daily Order Cap & Date Locker:** Set daily production limits (e.g., max 15 cakes/day) or lock out peak holiday dates.
* **Zone-Based Delivery Manager:** Group orders by Dhaka/Chittagong delivery zones and neighborhoods.
* **Courier Export:** Export daily delivery manifests formatted for local couriers (Steadfast, Pathao, RedX) or internal riders.

### Module 8: Business Analytics & Mini-CRM

* **Sales Performance Dashboard:** Metrics for Daily Revenue, Monthly Sales, Total Orders, and Channel Breakdown (*Web Sales vs. FB Inbox Manual Sales*).
* **Top-Seller Analytics:** Insights on top-selling flavors, most requested weights, and popular designs.
* **Customer Mini-CRM:** Track repeat customer accounts, lifetime spend, order history, and saved addresses.

---

## 3. Dashboard Navigation & Sidebar Structure

```text
Daisy's Cookery Admin
│
├── ➕ New Order (Manual FB / Phone Entry)
├── 📊 Overview (Sales Analytics & Channel Breakdown)
├── 🎂 Live Orders (Unified Kanban Board & Date Filter)
├── 👩‍🍳 Kitchen Batch (Daily Recipe & Specs Aggregator)
├── 💬 Custom Requests (Reference Photos & Quote Builder)
├── 💳 Payments (bKash/Nagad TrxID Matching & COD Ledger)
├── 🖼️ Content & Media
│   ├── Product Catalog (With Event Filters)
│   ├── Image Gallery & Banners
│   └── Facebook & Customer Reviews Manager (Name, Text, Photo Upload)
├── 🚚 Logistics & Capacity (Slot Locking & Courier Export)
└── ⚙️ Settings (Store Hours, Delivery Fees, Admin Accounts)

```