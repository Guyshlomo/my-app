import { getCurrentUserFromSupabase, getUserVolunteerRegistrations } from '../app/db/supabaseApi';

// Get registered event IDs from user's volunteer registrations
export async function getRegisteredEventIds(): Promise<number[]> {
  try {
    const currentUser = await getCurrentUserFromSupabase();
    if (!currentUser) return [];
    
    // Get user's volunteer registrations
    const registrations = await getUserVolunteerRegistrations(currentUser.id);
    
    // Extract event IDs from registrations
    const eventIds = registrations.map((reg: any) => parseInt(reg.event_id)).filter((id: number) => !isNaN(id));
    
    return eventIds;
  } catch (e) {
    console.error('Error getting registered events:', e);
    return [];
  }
}

// Note: The following functions are kept for backward compatibility
// but the actual registration/unregistration should use the volunteer event APIs
// (registerForVolunteerEvent, cancelVolunteerRegistration)

// This function is no longer needed as registrations are handled through the volunteer events API
export async function setRegisteredEventIds(ids: number[]): Promise<void> {
  console.warn('setRegisteredEventIds is deprecated. Use registerForVolunteerEvent/cancelVolunteerRegistration instead.');
}

export async function addRegisteredEventId(id: number): Promise<void> {
  console.warn('addRegisteredEventId is deprecated. Use registerForVolunteerEvent instead.');
}

export async function removeRegisteredEventId(id: number): Promise<void> {
  console.warn('removeRegisteredEventId is deprecated. Use cancelVolunteerRegistration instead.');
}

export async function clearRegisteredEventIds(): Promise<void> {
  console.warn('clearRegisteredEventIds is deprecated. Use cancelVolunteerRegistration for each event instead.');
} 