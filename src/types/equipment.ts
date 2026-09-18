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
}
