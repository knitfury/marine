import type { Dealer } from "@/types";
import { mockCustomers } from "./mock-customers";
import { mockEquipment } from "./mock-equipment";
import { mockServiceRequests } from "./mock-service-requests";

const OPEN_SERVICE_STATUSES = new Set(["new", "in_progress", "waiting"]);

type DealerFixture = Omit<
  Dealer,
  "customerCount" | "equipmentCount" | "openServiceRequestCount"
>;

/**
 * Base dealer fixtures across representative US regions. `customerCount`,
 * `equipmentCount` and `openServiceRequestCount` are derived below from
 * mock-customers.ts, mock-equipment.ts and mock-service-requests.ts so the
 * rollups always match the underlying records.
 */
const dealerFixtures: DealerFixture[] = [
  {
    id: "dlr-001",
    name: "Great Lakes Marine Services",
    status: "active",
    region: "Great Lakes / Upper Midwest",
    primaryContactName: "Karen Whitfield",
    primaryContactEmail: "karen.whitfield@greatlakesmarine.com",
  },
  {
    id: "dlr-002",
    name: "Gulf Coast Boatworks",
    status: "active",
    region: "Gulf Coast",
    primaryContactName: "Miguel Ortega",
    primaryContactEmail: "miguel.ortega@gulfcoastboatworks.com",
  },
  {
    id: "dlr-003",
    name: "Pacific Northwest Marine Group",
    status: "active",
    region: "Pacific Northwest",
    primaryContactName: "Dana Kowalski",
    primaryContactEmail: "dana.kowalski@pnwmarinegroup.com",
  },
  {
    id: "dlr-004",
    name: "Atlantic Coast Lift Systems",
    status: "active",
    region: "Northeast / Mid-Atlantic",
    primaryContactName: "Robert Finch",
    primaryContactEmail: "robert.finch@atlanticcoastlift.com",
  },
  {
    id: "dlr-005",
    name: "Carolina Marine Equipment Co.",
    status: "pending",
    region: "Southeast",
    primaryContactName: "Sandra Boyle",
    primaryContactEmail: "sandra.boyle@carolinamarineequip.com",
  },
  {
    id: "dlr-006",
    name: "Chesapeake Bay Marine Solutions",
    status: "inactive",
    region: "Mid-Atlantic",
    primaryContactName: "Terrence Albright",
    primaryContactEmail: "terrence.albright@chesapeakebaymarine.com",
  },
];

export const mockDealers: Dealer[] = dealerFixtures.map((dealer) => ({
  ...dealer,
  customerCount: mockCustomers.filter((c) => c.dealerId === dealer.id).length,
  equipmentCount: mockEquipment.filter((eq) => eq.dealerId === dealer.id)
    .length,
  openServiceRequestCount: mockServiceRequests.filter(
    (sr) => sr.dealerId === dealer.id && OPEN_SERVICE_STATUSES.has(sr.status)
  ).length,
}));
