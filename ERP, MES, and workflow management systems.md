This is actually the **most important architectural decision** in your entire project.

The **Operations Control Center should never ask departments to "send data" manually.** Instead, **every department uses the same application**, and the dashboard updates automatically because everyone is working on the same database.

## Think of it like Google Docs

When you edit a Google Doc, you don't click "Send to everyone."

Everyone sees the change immediately because they're looking at the same document.

Your system works the same way.

---

## Architecture

```text
                MERN Application

 ┌─────────────────────────────────────────┐
 │              React Frontend             │
 └─────────────────────────────────────────┘
                  │
                  ▼
          Express REST API
                  │
                  ▼
             MongoDB Database
                  ▲
                  │
 ┌─────────────────────────────────────────┐
 │ Logistics │ Lab │ Production │ Warehouse│
 └─────────────────────────────────────────┘
                  │
                  ▼
      Operations Control Center Dashboard
```

Notice something?

**Everyone talks to the same backend.**

---

# Example

Suppose a truck arrives with Oxygen cylinders.

### 1. Logistics logs in

Role:

```
Logistics Officer
```

He goes to

```
Raw Materials
```

and clicks

```
Receive Material
```

He fills

```
Batch Number
RM-25001

Material
Medical Oxygen

Supplier
Air Liquide France

Quantity
1200 kg

Arrival Time
08:30
```

Clicks

```
Save
```

---

## What happens?

React sends

```http
POST /api/raw-materials
```

```json
{
  "batchNumber":"RM-25001",
  "material":"Medical Oxygen",
  "quantity":1200,
  "status":"Received"
}
```

Express stores it in MongoDB.

MongoDB now contains

```json
{
  "_id":"...",
  "batch":"RM-25001",
  "status":"Received",
  "department":"Logistics"
}
```

Nobody informed the dashboard.

Nobody sent an email.

Nobody clicked "Notify."

---

## 2. Operations Control Center

The dashboard loads

```http
GET /api/dashboard
```

The backend counts

```
Received Materials
12

Waiting for Laboratory
4

Approved
18

Rejected
2
```

and returns

```json
{
    "received":12,
    "waitingLab":4,
    "approved":18,
    "rejected":2
}
```

The dashboard updates automatically.

---

## 3. Laboratory

A laboratory technician logs in.

He sees

```
Waiting Analysis

RM-25001
```

He opens it.

Runs tests.

Clicks

```
Approve
```

---

React sends

```http
PATCH /api/raw-materials/RM-25001
```

```json
{
   "status":"Approved",
   "approvedBy":"Ahmed",
   "analysisDate":"..."
}
```

MongoDB updates

```
Status

Received

↓

Approved
```

---

## Dashboard

Nobody tells the dashboard.

It simply asks again

```
GET /api/dashboard
```

Now it receives

```
Received
11

Approved
19
```

The cards change instantly.

---

# Production

Production logs in.

They don't receive an email.

Their page simply requests

```
GET /api/production/pending
```

Backend returns

```
All approved materials.
```

Example

```
RM-25001

Approved

Ready for Production
```

Production clicks

```
Start Production
```

Backend updates

```
Status

↓

In Production
```

Dashboard updates again.

---

# This is called a Workflow

Every department changes the status of the same batch.

Example

```
Received
```

↓

```
In Laboratory
```

↓

```
Approved
```

↓

```
Production Started
```

↓

```
Filled
```

↓

```
Warehouse
```

↓

```
Delivered
```

One document.

One batch.

Many departments.

---

## This is the key idea

Don't think of the dashboard as a separate application that departments report to.

Instead, think of it as another user of the same system.

* The **Logistics team** creates and updates batch records.
* The **Laboratory** updates the same records with analysis results.
* The **Production team** updates those records as manufacturing progresses.
* The **Warehouse** and **Distribution** teams continue updating the same records.

The **Operations Control Center** doesn't receive data directly from anyone—it simply reads the current state of all batches from the database and summarizes it into KPIs, charts, alerts, and activity feeds.

This is how most modern enterprise systems (ERP, MES, and workflow management systems) are designed: a **single source of truth** where every department works on shared data rather than exchanging information manually.
