import { create } from 'zustand';

interface AccountSelectionState {
  selectedUuid: string | null;
  showAddPopup: boolean;
  selectAccount: (uuid: string) => void;
  clearSelection: () => void;
  openAddPopup: () => void;
  closeAddPopup: () => void;
}

export const useAccountSelectionStore = create<AccountSelectionState>()((set) => ({
  selectedUuid: null,
  showAddPopup: false,
  selectAccount: (uuid) => set({ selectedUuid: uuid }),
  clearSelection: () => set({ selectedUuid: null }),
  openAddPopup: () => set({ showAddPopup: true }),
  closeAddPopup: () => set({ showAddPopup: false }),
}));
