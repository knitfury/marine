export type EquipmentStatus = "active" | "maintenance" | "inactive" | "retired";

export interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  model: string;
  serialNumber: string;
  currentStatus: EquipmentStatus;
  customerId?: string;
  dealerId?: string;
  /** Representative photo for this equipment type. Falls back gracefully in the UI if it fails to load. */
  imageUrl?: string;
}
