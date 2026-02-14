# Toast Notifications Guide

## Overview

Sonner toast notifications have been integrated throughout the onboarding flow to provide real-time feedback for all user actions.

## Setup

The Toaster component is added to the root layout at [app/layout.tsx](app/layout.tsx:38):

```tsx
<Toaster position="bottom-right" richColors closeButton />
```

**Configuration:**
- **Position**: Bottom-right corner
- **Rich Colors**: Enabled for success (green), error (red), info (blue)
- **Close Button**: Users can manually dismiss toasts

## Toast Notifications by Step

### Step 1: Create Campaign

#### 1. Campaign Created ✅
**Trigger**: When user clicks "Next" on Step 1 with campaign details filled
```tsx
toast.success('Campaign Created', {
  description: `"${campaignName}" has been saved successfully`,
});
```
**When it shows**:
- After campaign is successfully saved to database
- Campaign ID is generated and added to URL

#### 2. Campaign Updated ✅
**Trigger**: When existing campaign is modified and saved
```tsx
toast.success('Campaign Updated', {
  description: `"${campaignName}" has been updated successfully`,
});
```
**When it shows**:
- When returning to edit an existing campaign
- Any changes to campaign details are saved

#### 3. Campaign Load Error ❌
**Trigger**: If campaign fails to save
```tsx
toast.error('Failed to Create Campaign', {
  description: data.error || 'Please try again',
});
```

### Step 2: Source Leads

#### 4. Leads Saved ✅
**Trigger**: When user clicks "Next" on Step 2 (Manual Entry mode)
```tsx
toast.success('Leads Saved', {
  description: `Successfully saved ${count} lead${count !== 1 ? 's' : ''} to your campaign`,
});
```
**When it shows**:
- Only when "Manual Entry" is selected
- Shows count of leads saved
- Example: "Successfully saved 3 leads to your campaign"

#### 5. Leads Save Error ❌
**Trigger**: If leads fail to save
```tsx
toast.error('Failed to Save Leads', {
  description: 'Please try again',
});
```

### Step 3: Select Leads

#### 6. Lead Selected ✅
**Trigger**: When user checks a lead checkbox
```tsx
toast.success('Lead Selected', {
  description: `${leadName} added to your campaign`,
});
```
**When it shows**:
- Each time a lead is selected
- Updates database in real-time
- Example: "Sarah Chen added to your campaign"

#### 7. Lead Deselected ✅
**Trigger**: When user unchecks a lead checkbox
```tsx
toast.success('Lead Deselected', {
  description: `${leadName} removed from your campaign`,
});
```
**When it shows**:
- Each time a lead is deselected
- Updates database immediately
- Example: "Michael Rodriguez removed from your campaign"

#### 8. Selection Update Error ❌
**Trigger**: If lead selection fails to update
```tsx
toast.error('Error', {
  description: 'Failed to update lead selection',
});
```

### Step 4: Outreach - Email

#### 9. Email Configuration Saved ✅
**Trigger**: When user clicks "Next" on Step 4
```tsx
toast.success('Campaign Updated', {
  description: `"${campaignName}" has been updated successfully`,
});
```
**When it shows**:
- Email subject and body are saved to campaign
- Same toast as campaign update

### Step 5: Outreach - Call

#### 10. Call Started 📞
**Trigger**: When user clicks "Call Now" button
```tsx
toast.success('Call Started', {
  description: `Connected with ${leadName}`,
});
```
**When it shows**:
- Call modal opens
- Call log entry created in database
- Example: "Connected with Emily Watson"

#### 11. Call Ended 📞
**Trigger**: When user clicks "End Call" button
```tsx
toast.info('Call Ended', {
  description: `Call with ${leadName} has been recorded`,
});
```
**When it shows**:
- Call modal closes
- Call log is saved
- Example: "Call with David Kim has been recorded"

#### 12. Deal Closed! 🎉
**Trigger**: When user clicks "Mark Deal Closed" button
```tsx
toast.success('Deal Closed!', {
  description: `Successfully closed deal with ${leadName}`,
});
```
**When it shows**:
- High confidence score (≥80%)
- Redirects to dashboard after 1.5 seconds
- Example: "Successfully closed deal with Jessica Martinez"

### Additional Notifications

#### 13. Campaign Loaded ℹ️
**Trigger**: When existing campaign is loaded from URL
```tsx
toast.info('Campaign Loaded', {
  description: `Continuing "${campaignName}"`,
});
```
**When it shows**:
- User navigates to URL with `campaign_id` parameter
- All campaign data is loaded from database
- Example: "Continuing "Q1 Lead Generation""

## Toast Types

### Success (Green) ✅
Used for:
- Campaign created/updated
- Leads saved
- Lead selected/deselected
- Call started
- Deal closed

### Info (Blue) ℹ️
Used for:
- Campaign loaded
- Call ended (informational)

### Error (Red) ❌
Used for:
- Failed to save/update campaign
- Failed to save leads
- Failed to update lead selection
- Call errors

## Visual Appearance

```
┌─────────────────────────────────────────┐
│ ✅ Campaign Created                      │
│ "My Campaign" has been saved successfully│
│                                      [×] │
└─────────────────────────────────────────┘
```

**Features:**
- Icon based on type (✅ ❌ ℹ️)
- Bold title
- Descriptive message
- Close button
- Auto-dismiss after 4 seconds
- Bottom-right positioning
- Stacks if multiple toasts

## Testing the Toasts

### Test Flow:

1. **Go to onboarding**
   ```
   http://localhost:3000/onboard?step=create-campaign
   ```

2. **Create a campaign** (Step 1)
   - Fill in campaign name, type, description
   - Click "Next"
   - ✅ Should see: "Campaign Created" toast

3. **Add manual leads** (Step 2)
   - Switch to "Manual Entry"
   - Add 2-3 leads
   - Click "Next"
   - ✅ Should see: "Leads Saved" toast with count

4. **Select leads** (Step 3)
   - Click checkboxes to select leads
   - ✅ Should see: "Lead Selected" for each
   - Uncheck a lead
   - ✅ Should see: "Lead Deselected"

5. **Configure email** (Step 4)
   - Edit email subject/body
   - Click "Next"
   - ✅ Should see: "Campaign Updated" toast

6. **Start a call** (Step 5)
   - Click "Call Now" on a lead
   - ✅ Should see: "Call Started" toast
   - Click "End Call"
   - ℹ️ Should see: "Call Ended" toast
   - Click "Mark Deal Closed" (if visible)
   - 🎉 Should see: "Deal Closed!" toast

7. **Reload the page**
   - Keep the `campaign_id` in URL
   - Refresh the page
   - ℹ️ Should see: "Campaign Loaded" toast

## Implementation Details

### Location
All toast notifications are in: [app/onboard/onboard-client.tsx](app/onboard/onboard-client.tsx)

### Functions with Toasts:
1. `saveCampaign()` - Lines 211-259
2. `saveManualLeads()` - Lines 240-280
3. `toggleLeadSelection()` - Lines 211-247
4. `handleStartCall()` - Lines 286-320
5. `handleEndCall()` - Lines 310-340
6. `handleDealClosed()` - Lines 330-345
7. `loadCampaignData()` - Lines 178-206

### Toast Import:
```tsx
import { toast } from "sonner";
```

## Customization

To customize toasts, you can modify the Toaster component in [app/layout.tsx](app/layout.tsx:38):

```tsx
<Toaster
  position="bottom-right"  // top-left, top-right, bottom-left, bottom-right
  richColors               // Use colored backgrounds
  closeButton              // Show close button
  duration={4000}          // Auto-dismiss duration (ms)
  theme="dark"             // dark, light, system
/>
```

## Error Handling

All API calls have error handling with toast notifications:

```tsx
try {
  const response = await fetch('/api/campaigns', {...});
  const data = await response.json();

  if (data.success) {
    toast.success('Success!', {...});
  } else {
    toast.error('Failed', {...});
  }
} catch (error) {
  toast.error('Error', {...});
}
```

## User Experience Benefits

✅ **Immediate Feedback**: Users know instantly when actions succeed or fail
✅ **Non-Intrusive**: Toasts appear in corner, don't block workflow
✅ **Auto-Dismiss**: Disappear automatically, no manual intervention needed
✅ **Descriptive**: Clear messages explain what happened
✅ **Accessible**: Can be closed manually, supports keyboard navigation
✅ **Stackable**: Multiple toasts stack neatly
✅ **Colored**: Visual distinction between success, error, and info

## Troubleshooting

### Toasts not appearing?
1. Check browser console for errors
2. Verify Toaster is in layout.tsx
3. Ensure `import { toast } from "sonner"` is present
4. Check network tab - API calls should succeed

### Toasts appearing too quickly?
Increase duration:
```tsx
toast.success('Message', {
  duration: 5000, // 5 seconds
});
```

### Wrong position?
Change in layout.tsx:
```tsx
<Toaster position="top-right" />
```

## Next Steps

Potential enhancements:
1. Add loading toasts for longer operations
2. Add action buttons to toasts (undo, retry)
3. Add progress indicators for bulk operations
4. Add sound effects for important toasts
5. Add toast history/log
6. Add custom icons for different actions
