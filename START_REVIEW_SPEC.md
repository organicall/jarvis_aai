# Start Review Functionality - Design Specification

## Overview
The **"Start Review"** button initiates the annual client review workflow, helping financial advisors prepare for and conduct comprehensive client review meetings efficiently.

## Current Implementation ✅

**New Note Button:**
- ✅ Opens a new Google Doc in a new tab
- ✅ URL: `https://docs.google.com/document/create`
- ✅ Allows advisor to take notes during meetings

**Start Review Button:**
- ✅ Currently shows a placeholder alert
- ⏳ Full functionality to be implemented

---

## Recommended "Start Review" Functionality

### **Phase 1: Quick Review (Implemented as Alert)**
Currently shows an alert with planned features:
- Generate AI-powered meeting brief
- Review client portfolio
- Prepare recommendations
- Create action items

### **Phase 2: Full Review Workflow (Recommended Implementation)**

When clicked, the button should:

#### **1. Client Selection Modal**
```
┌──────────────────────────────────────┐
│  Start Annual Review                 │
├──────────────────────────────────────┤
│                                      │
│  Select a client for review:         │
│                                      │
│  [Search clients...]                 │
│                                      │
│  ☐ Robert Chen                       │
│     Last review: 2025-11-15          │
│     Portfolio: £2.8M                 │
│                                      │
│  ☐ Gareth Cheeseman                  │
│     Last review: 2025-09-20          │
│     Portfolio: £2.85M                │
│                                      │
│  [Cancel]  [Start Review →]          │
└──────────────────────────────────────┘
```

#### **2. Navigate to Meeting Prep Tab**
- Automatically switches to "Meeting Prep" tab
- Shows the selected client's information

#### **3. Generate AI Meeting Brief**
Automatically triggers the "Generate Brief" functionality:
- Pulls client data from database
- Uses Groq API (Llama 3.3 70B) to generate:
  - Portfolio summary
  - Key discussion points
  - Recommended actions
  - Urgent items to address

#### **4. Pre-Review Checklist Panel**
Opens a sidebar or modal with review preparation items:

```
┌────────────────────────────────┐
│  Review Checklist              │
├────────────────────────────────┤
│  Client: Gareth Cheeseman      │
│                                │
│  Preparation:                  │
│  ✓ Portfolio analysis loaded   │
│  ✓ AI brief generated          │
│  ☐ Protection gaps reviewed    │
│  ☐ Tax efficiency checked      │
│  ☐ Pension contributions calc  │
│                                │
│  Documents:                    │
│  ☐ Annual statement ready      │
│  ☐ Recommendations prepared    │
│  ☐ Compliance notes updated    │
│                                │
│  [Mark Review Complete →]      │
└────────────────────────────────┘
```

---

## **Suggested Workflow Steps**

### **Step 1: Click "Start Review"**
→ Opens client selection modal

### **Step 2: Select Client**
→ Fetches client data from database
→ Switches to "Meeting Prep" tab

### **Step 3: Auto-Generate Brief**
→ Calls Groq API to generate meeting brief
→ Displays brief in the Meeting Prep interface

### **Step 4: Show Review Checklist**
→ Opens preparation checklist sidebar
→ Tracks completion of review tasks

### **Step 5: During Review**
→ Check off items as completed
→ Take notes in Google Doc (via "New Note" button)
→ Update client data as needed

### **Step 6: Complete Review**
→ Click "Mark Review Complete"
→ Updates `next_review_date` in database
→ Creates review completion note
→ Optionally sends follow-up email

---

## **Key Features to Implement**

### **1. Client Selection**
- Search/filter clients by name
- Show last review date
- Highlight overdue reviews (red badge)
- Show portfolio value

### **2. AI Brief Generation**
- Pull client data automatically
- Generate personalized talking points
- Identify opportunities and risks
- Suggest next steps

### **3. Review Checklist**
- Standard items for all reviews
- Client-specific items based on portfolio
- Track completion status
- Save progress

### **4. Post-Review Actions**
- Update next review date
- Create follow-up tasks
- Log review completion
- Optional: Generate review summary PDF

---

## **Integration Points**

### **Database Updates**
When review completes:
```javascript
{
  next_review_date: "2026-02-07",  // Updated
  last_updated: "2026-02-07",      // Updated
  review_status: "completed",       // New field
  last_review_notes: "..."         // Optional
}
```

### **API Calls**
1. **GET** `/api/clients/:id` - Fetch client data
2. **POST** `/api/groq` - Generate AI brief
3. **PUT** `/api/clients/:id` - Update review status
4. **POST** `/api/notes` - Create review notes (optional)

### **Navigation**
```javascript
onClick={() => {
  setActiveTab('meeting');        // Switch to Meeting Prep
  setSelectedClient(clientId);    // Set active client
  generateBrief(clientId);        // Auto-generate brief
  openReviewChecklist();          // Show checklist
}}
```

---

## **UI Components Needed**

### **1. ClientSelectionModal.jsx**
```jsx
<Modal>
  <SearchInput />
  <ClientList>
    {clients.map(client => (
      <ClientCard 
        client={client}
        onSelect={handleSelect}
      />
    ))}
  </ClientList>
</Modal>
```

### **2. ReviewChecklistPanel.jsx**
```jsx
<SidePanel>
  <ClientHeader client={selectedClient} />
  <ChecklistSection title="Preparation">
    <ChecklistItem checked={true} />
    <ChecklistItem checked={false} />
  </ChecklistSection>
  <CompleteButton onClick={handleComplete} />
</SidePanel>
```

### **3. Update MeetingPrep.jsx**
Add support for:
- Auto-triggering brief generation
- Showing review checklist
- Displaying review context

---

## **Implementation Priority**

### **High Priority (Must Have)**
1. ✅ New Note → Opens Google Doc
2. ⏳ Start Review → Navigates to Meeting Prep
3. ⏳ Auto-select client or show selection modal
4. ⏳ Auto-generate AI brief

### **Medium Priority (Should Have)**
1. ⏳ Review checklist sidebar
2. ⏳ Update review dates automatically
3. ⏳ Track review completion status

### **Low Priority (Nice to Have)**
1. ⏳ Generate review summary PDF
2. ⏳ Email follow-up automation
3. ⏳ Review analytics dashboard

---

## **Example User Flow**

### **Scenario: Advisor preparing for scheduled review with Gareth Cheeseman**

1. **Click "Start Review"**
   - Modal appears: "Select client for review"
   
2. **Search and Select "Gareth Cheeseman"**
   - Modal closes
   - Screen switches to "Meeting Prep" tab
   
3. **AI Brief Auto-Generates**
   - "Generating brief..." spinner appears
   - Brief populates with:
     - Current portfolio: £2.85M
     - Protection gaps identified
     - Tax efficiency opportunities
     - Pension contribution recommendations
   
4. **Review Checklist Opens**
   - Sidebar slides in from right
   - Shows preparation items
   - Advisor checks off completed items
   
5. **Click "New Note"**
   - Google Doc opens in new tab
   - Advisor takes meeting notes
   
6. **During Meeting**
   - Review brief with client
   - Discuss recommendations
   - Update client data as needed
   
7. **After Meeting**
   - Click "Mark Review Complete"
   - Next review date updates to +12 months
   - Review logged in system

---

## **Code Example: Full Implementation**

```jsx
// In App.jsx
const handleStartReview = async () => {
  // Option 1: If a client is already selected
  if (selectedClient) {
    setActiveTab('meeting');
    await generateBrief(selectedClient.client_id);
    setShowReviewChecklist(true);
    return;
  }
  
  // Option 2: Show client selection modal
  setShowClientSelectionModal(true);
};

const handleClientSelected = async (client) => {
  setSelectedClient(client);
  setShowClientSelectionModal(false);
  setActiveTab('meeting');
  await generateBrief(client.client_id);
  setShowReviewChecklist(true);
};

// Button implementation
<button 
  className="action-btn primary"
  onClick={handleStartReview}
  title="Start annual review workflow"
>
  Start Review
</button>
```

---

## **Summary**

### **Current Status**
- ✅ **New Note**: Opens Google Docs (IMPLEMENTED)
- ⏳ **Start Review**: Shows placeholder alert (BASIC)

### **Recommended Next Steps**
1. Create `ClientSelectionModal` component
2. Implement client selection logic
3. Add auto-navigation to Meeting Prep
4. Auto-trigger AI brief generation
5. Create review checklist component
6. Add review completion tracking

### **Business Value**
- **Time Savings**: Automates review preparation
- **Consistency**: Ensures all reviews follow same process
- **AI-Powered**: Generates personalized insights
- **Compliance**: Tracks review completion
- **Client Experience**: More prepared, efficient meetings

---

**Status**: New Note ✅ | Start Review ⏳ (Placeholder implemented, full workflow designed)
