export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  settlement?: string;
  birthDate?: string;
  coins: number;
  tasksCompleted?: number;
  taskscompleted?: number; // Database field name
  completedVolunteering?: string[];
  isAdmin: boolean;
  avatar_seed?: string;
  avatar_style?: string;
}

export interface VolunteerActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  requiredParticipants: number;
  currentParticipants: string[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  coinsReward: number;
  approvedParticipants?: string[];
}

// ===== VOLUNTEER EVENT TYPES =====

export interface VolunteerEvent {
  id: string;
  title: string;
  description?: string;
  location: string;
  date: string;
  time: string;
  max_participants: number;
  current_participants: number;
  coins_reward: number;
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  admin_name?: string;
}

export interface VolunteerRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  status: 'registered' | 'completed' | 'cancelled';
  completed_at?: string;
  volunteer_events?: VolunteerEvent;
  users?: {
    firstname: string;
    lastname: string;
    email: string;
  };
}

export interface CreateVolunteerEventData {
  title: string;
  description?: string;
  location: string;
  date: string;
  time: string;
  max_participants?: number;
  coins_reward?: number;
  image_url?: string;
} 