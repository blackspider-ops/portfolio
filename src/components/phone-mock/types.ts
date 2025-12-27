export type PhoneAppId = 'projects' | 'blog' | 'resume' | 'contact' | 'photos' | 'settings' | 'safari' | 'github';

export interface PhoneMockProps {
  isOpen: boolean;
  onClose: () => void;
  initialApp?: PhoneAppId;
}

export interface PhoneMockContextValue {
  isOpen: boolean;
  open: (initialApp?: PhoneAppId) => void;
  close: () => void;
  toggle: () => void;
}
