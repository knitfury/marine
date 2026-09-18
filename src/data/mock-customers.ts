import type { Customer } from "@/types";
import { mockEquipment } from "./mock-equipment";
import { mockServiceRequests } from "./mock-service-requests";

const OPEN_SERVICE_STATUSES = new Set(["new", "in_progress", "waiting"]);

type CustomerFixture = Omit<
  Customer,
  "equipmentCount" | "openServiceRequestCount"
>;

/**
 * Base customer fixtures, realistic marina/boatyard/shipyard businesses.
 * `dealerId` references a dealer from mock-dealers.ts where the customer is
 * served through a dealer relationship. `equipmentCount` and
 * `openServiceRequestCount` are derived below from mock-equipment.ts and
 * mock-service-requests.ts rather than hand-maintained, so they can never
 * drift out of sync with the underlying fixtures.
 */
const customerFixtures: CustomerFixture[] = [
  {
    id: "cus-001",
    name: "Harborview Marina & Boatyard",
    status: "active",
    primaryContactName: "Lisa Granger",
    primaryContactEmail: "lisa.granger@harborviewmarina.com",
    dealerId: "dlr-001",
  },
  {
    id: "cus-002",
    name: "Sturgeon Bay Shipyard",
    status: "active",
    primaryContactName: "Owen Vantassel",
    primaryContactEmail: "owen.vantassel@sturgeonbayshipyard.com",
    dealerId: "dlr-001",
  },
  {
    id: "cus-003",
    name: "Pelican Point Yacht Club",
    status: "active",
    primaryContactName: "Camille Broussard",
    primaryContactEmail: "camille.broussard@pelicanpointyc.com",
    dealerId: "dlr-002",
  },
  {
    id: "cus-004",
    name: "Bayou Marine Works",
    status: "active",
    primaryContactName: "Andre Hebert",
    primaryContactEmail: "andre.hebert@bayoumarineworks.com",
    dealerId: "dlr-002",
  },
  {
    id: "cus-005",
    name: "Emerald Sound Boatyard",
    status: "active",
    primaryContactName: "Priya Nandakumar",
    primaryContactEmail: "priya.nandakumar@emeraldsoundboatyard.com",
    dealerId: "dlr-003",
  },
  {
    id: "cus-006",
    name: "Puget Harbor Marine Center",
    status: "prospect",
    primaryContactName: "Kyle Redmond",
    primaryContactEmail: "kyle.redmond@pugetharbormarine.com",
    dealerId: "dlr-003",
  },
  {
    id: "cus-007",
    name: "Cape Anchor Marina",
    status: "active",
    organizationName: "Cape Anchor Marina LLC",
    primaryContactName: "Nathaniel Pryce",
    primaryContactEmail: "nathaniel.pryce@capeanchormarina.com",
    dealerId: "dlr-004",
  },
  {
    id: "cus-008",
    name: "Narragansett Shipworks",
    status: "active",
    primaryContactName: "Bridget Callahan",
    primaryContactEmail: "bridget.callahan@narragansettshipworks.com",
    dealerId: "dlr-004",
  },
  {
    id: "cus-009",
    name: "Outer Banks Boat Storage",
    status: "prospect",
    primaryContactName: "Marcus Deveraux",
    primaryContactEmail: "marcus.deveraux@outerbanksboatstorage.com",
    dealerId: "dlr-005",
  },
  {
    id: "cus-010",
    name: "Tidewater Vessel Services",
    status: "inactive",
    primaryContactName: "Renee Holcomb",
    primaryContactEmail: "renee.holcomb@tidewatervessel.com",
    dealerId: "dlr-006",
  },
  {
    id: "cus-011",
    name: "Lakeshore Yacht Basin",
    status: "active",
    primaryContactName: "Gregory Simms",
    primaryContactEmail: "gregory.simms@lakeshoreyachtbasin.com",
    dealerId: "dlr-001",
  },
  {
    id: "cus-012",
    name: "Cortez Gulf Marina",
    status: "active",
    organizationName: "Cortez Gulf Marina & Storage",
    primaryContactName: "Elena Vasquez",
    primaryContactEmail: "elena.vasquez@cortezgulfmarina.com",
    dealerId: "dlr-002",
  },
  {
    id: "cus-013",
    name: "Anacortes Haul-Out Yard",
    status: "active",
    primaryContactName: "Trevor Lindqvist",
    primaryContactEmail: "trevor.lindqvist@anacorteshaulout.com",
    dealerId: "dlr-003",
  },
  {
    id: "cus-014",
    name: "Hilton Head Marine Complex",
    status: "active",
    organizationName: "Hilton Head Marine Complex Inc.",
    primaryContactName: "Whitney Sorel",
    primaryContactEmail: "whitney.sorel@hiltonheadmarine.com",
    dealerId: "dlr-005",
  },
];

export const mockCustomers: Customer[] = customerFixtures.map((customer) => ({
  ...customer,
  equipmentCount: mockEquipment.filter((eq) => eq.customerId === customer.id)
    .length,
  openServiceRequestCount: mockServiceRequests.filter(
    (sr) => sr.customerId === customer.id && OPEN_SERVICE_STATUSES.has(sr.status)
  ).length,
}));
