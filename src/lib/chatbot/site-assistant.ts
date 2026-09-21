import { getDashboardSummary, getServiceRequests } from "@/lib/mock-api";
import {
  computeSlaComplianceTrend,
  computeResolutionTimeTrend,
  computeRepeatServiceRate,
  SLA_TARGET_HOURS,
} from "@/lib/analytics/service-metrics";
import { formatCurrency } from "@/lib/formatting";
import type { ServiceRequestFilters } from "@/lib/mock-api";
import type { ServiceRequestPriority, User, UserRole } from "@/types";

/**
 * Framework-free rule-based "Site Assistant" chat engine - no external AI
 * API, no ML, no API key. A normalized user message is tested against an
 * ordered array of intents (most specific first, a generic fallback last);
 * the first match's `handle` runs and its resolved string becomes the
 * reply. Every intent that pulls live data goes through
 * `getDashboardSummary`/`getServiceRequests` (this app's real,
 * Catalyst-DataStore-backed service) and the analytics helpers in
 * "@/lib/analytics/service-metrics" - the exact same functions the
 * dashboards use - so numbers here can never drift from what the rest of
 * the app shows.
 */

export interface ChatContext {
  role: UserRole;
  user: User;
}

export interface ChatAnswer {
  text: string;
}

interface Intent {
  test: (message: string) => boolean;
  handle: (context: ChatContext) => Promise<string>;
}

const FETCH_FAILURE_MESSAGE =
  "I couldn't fetch that right now - the data service might be temporarily unavailable. Try again in a moment.";

const CAPABILITIES_LIST =
  "open requests, high-priority requests, revenue, dealers, customers, equipment, SLA compliance, avg resolution time, repeat service rate, or how to raise or close a request";

const FALLBACK_MESSAGE = `I'm not sure about that yet. Try asking about: ${CAPABILITIES_LIST}.`;

/**
 * Role-authoritative org scoping for live-data lookups, matching the exact
 * role-branch logic of `resolveOrgScope` in
 * src/components/service/service-directory.tsx (dealer -> own dealerId,
 * customer -> own customerId, internal -> unscoped). Reimplemented locally
 * rather than imported because that component's version isn't exported and
 * also threads through URL-param overrides that don't apply here - a chat
 * question has no URL to escape its scope through in the first place.
 */
function resolveOrgScope(
  role: UserRole,
  organizationId: string
): Pick<ServiceRequestFilters, "customerId" | "dealerId"> {
  if (role === "dealer") return { dealerId: organizationId };
  if (role === "customer") return { customerId: organizationId };
  return {};
}

async function fetchScopedRequests(context: ChatContext) {
  const scope = resolveOrgScope(context.role, context.user.organizationId);
  return getServiceRequests(scope);
}

/** e.g. 24 -> "24h", 120 -> "5d" - matches the compact style already used in
 * the internal dashboard's SLA caption, but derived from the real constant
 * instead of being a second hardcoded copy of the numbers. */
function formatSlaHours(hours: number): string {
  if (hours >= 24 && hours % 24 === 0) return `${hours / 24}d`;
  return `${hours}h`;
}

const SLA_LADDER_ORDER: ServiceRequestPriority[] = ["urgent", "high", "medium", "low"];

function slaLadderText(): string {
  return SLA_LADDER_ORDER.map((priority) => `${priority} ${formatSlaHours(SLA_TARGET_HOURS[priority])}`).join(
    ", "
  );
}

function scopeNoun(role: UserRole): string {
  if (role === "dealer") return "Your dealership";
  if (role === "customer") return "Your account";
  return "Marine Travelift";
}

/** Capitalized possessive lead-in for a sentence, e.g. "Your dealership's". */
function possessiveScopeLabel(role: UserRole): string {
  if (role === "dealer") return "Your dealership's";
  if (role === "customer") return "Your account's";
  return "Marine Travelift's";
}

const DECLINE_MESSAGE = "That's not something I can share for your account.";

const INTENTS: Intent[] = [
  // Greeting - most specific, checked first so "hi, how many open requests"
  // still gets a friendly intro rather than immediately answering.
  {
    test: (msg) => /^(hi|hello|hey)\b/.test(msg),
    handle: async () =>
      "Hi, I'm the Site Assistant. I can answer questions using your live data - " +
      'try "how many open requests?", "what\'s our revenue?", or "how do I raise a request?"',
  },

  // Glossary - checked before the plain revenue/SLA/repeat-service intents
  // below, since "what is SLA compliance?" would otherwise also match the
  // \bsla\b test.
  {
    test: (msg) => /what is revenue/.test(msg),
    handle: async () =>
      "Revenue here is the total estimated value of every service request that's been resolved or closed - the same all-time figure shown on the dashboard's Revenue card.",
  },
  {
    test: (msg) => /what is sla/.test(msg),
    handle: async () =>
      `SLA compliance is the share of closed requests resolved within their priority's target turnaround: ${slaLadderText()}. A request "meets SLA" when the time from creation to its last status update falls within that target for its priority.`,
  },
  {
    test: (msg) => /what is repeat service/.test(msg),
    handle: async () =>
      "Repeat service rate is the share of serviced equipment units that needed a second visit within 90 days of a prior one - a signal of recurring issues rather than one-off fixes.",
  },

  // How-to intents - static instructions, no live data.
  {
    test: (msg) => /raise a request|create.*request|new (service )?request/.test(msg),
    handle: async () =>
      'To raise a service request, go to the Service Requests page and click "Raise request." Fill in the subject, summary, priority, and assigned team - equipment and an estimated value are optional but help with reporting.',
  },
  {
    test: (msg) => /close a request|mark.*(resolved|closed)/.test(msg),
    handle: async () =>
      "Closing a request is done by internal staff from that service request's detail page, using the status control there to advance it to Resolved or Closed.",
  },

  // Live-data intents.
  {
    test: (msg) => /high priority|urgent/.test(msg),
    handle: async (context) => {
      try {
        const summary = await getDashboardSummary(context.role, context.user);
        const n = summary.highPriorityRequests;
        return `${scopeNoun(context.role)} has ${n} high-priority (high or urgent) service request${
          n === 1 ? "" : "s"
        } right now.`;
      } catch {
        return FETCH_FAILURE_MESSAGE;
      }
    },
  },
  {
    test: (msg) => /open (service )?requests?|how many (open|active) requests?/.test(msg),
    handle: async (context) => {
      try {
        const summary = await getDashboardSummary(context.role, context.user);
        const n = summary.openServiceRequests;
        if (context.role === "dealer") {
          return `Your dealership has ${n} open service request${n === 1 ? "" : "s"} right now.`;
        }
        if (context.role === "customer") {
          return `Your account has ${n} open service request${n === 1 ? "" : "s"} right now.`;
        }
        return `There are currently ${n} open service requests company-wide.`;
      } catch {
        return FETCH_FAILURE_MESSAGE;
      }
    },
  },
  {
    test: (msg) => /revenue|earnings/.test(msg),
    handle: async (context) => {
      if (context.role === "customer") return DECLINE_MESSAGE;
      try {
        const summary = await getDashboardSummary(context.role, context.user);
        return `${possessiveScopeLabel(context.role)} all-time revenue from resolved and closed service requests is ${formatCurrency(
          summary.totalRevenue
        )}.`;
      } catch {
        return FETCH_FAILURE_MESSAGE;
      }
    },
  },
  {
    test: (msg) => /how many dealers|active dealers/.test(msg),
    handle: async (context) => {
      if (context.role !== "internal") return DECLINE_MESSAGE;
      try {
        const summary = await getDashboardSummary(context.role, context.user);
        return `There are currently ${summary.activeDealers} active dealers company-wide.`;
      } catch {
        return FETCH_FAILURE_MESSAGE;
      }
    },
  },
  {
    test: (msg) => /how many customers|active customers/.test(msg),
    handle: async (context) => {
      if (context.role === "customer") return DECLINE_MESSAGE;
      try {
        const summary = await getDashboardSummary(context.role, context.user);
        const scope = context.role === "dealer" ? "Your dealership has" : "There are currently";
        const suffix = context.role === "dealer" ? "" : " company-wide";
        return `${scope} ${summary.activeCustomers} active customers${suffix}.`;
      } catch {
        return FETCH_FAILURE_MESSAGE;
      }
    },
  },
  {
    test: (msg) => /equipment|maintenance/.test(msg),
    handle: async (context) => {
      try {
        const summary = await getDashboardSummary(context.role, context.user);
        return `${scopeNoun(context.role)} has ${summary.activeEquipment} active equipment unit${
          summary.activeEquipment === 1 ? "" : "s"
        }, with ${summary.equipmentInMaintenance} currently in maintenance.`;
      } catch {
        return FETCH_FAILURE_MESSAGE;
      }
    },
  },
  {
    test: (msg) => /\bsla\b|compliance/.test(msg),
    handle: async (context) => {
      try {
        const requests = await fetchScopedRequests(context);
        const trend = computeSlaComplianceTrend(requests);
        if (trend.pctThisPeriod === null) {
          return `There isn't enough data yet - no requests have closed this month for ${
            context.role === "internal" ? "the company" : "your org"
          }. SLA targets are: ${slaLadderText()}.`;
        }
        return `SLA compliance this month is ${Math.round(trend.pctThisPeriod)}% (${trend.metCount} of ${
          trend.totalCount
        } closures met their target). Targets by priority: ${slaLadderText()}.`;
      } catch {
        return FETCH_FAILURE_MESSAGE;
      }
    },
  },
  {
    test: (msg) => /resolution time|time to resolv|how long.*resolv/.test(msg),
    handle: async (context) => {
      try {
        const requests = await fetchScopedRequests(context);
        const trend = computeResolutionTimeTrend(requests);
        if (trend.avgDaysThisPeriod === null) {
          return "There isn't enough data yet - no requests have closed this month to average a resolution time from.";
        }
        return `The average time to resolution this month is ${trend.avgDaysThisPeriod.toFixed(1)} days.`;
      } catch {
        return FETCH_FAILURE_MESSAGE;
      }
    },
  },
  {
    test: (msg) => /repeat service|second visit/.test(msg),
    handle: async (context) => {
      try {
        const requests = await fetchScopedRequests(context);
        const rate = computeRepeatServiceRate(requests);
        if (rate.pct === null) {
          return "There isn't enough serviced equipment yet to compute a repeat-service rate.";
        }
        return `The repeat service rate is ${Math.round(rate.pct)}% (${rate.repeatUnitCount} of ${
          rate.totalUnitCount
        } serviced units needed a second visit within 90 days).`;
      } catch {
        return FETCH_FAILURE_MESSAGE;
      }
    },
  },

  // Capabilities - checked after every specific intent above since its own
  // test (bare "help") is broad enough to otherwise shadow them.
  {
    test: (msg) => /what can you (do|help)|\bhelp\b/.test(msg),
    handle: async () =>
      `I can answer questions about your live data: ${CAPABILITIES_LIST}. Just ask in plain language.`,
  },
];

function normalize(message: string): string {
  return message.trim().toLowerCase();
}

/**
 * Matches `message` against the ordered intent list and resolves the first
 * match's reply. Never throws - each live-data handler catches its own
 * fetch failures (see FETCH_FAILURE_MESSAGE) and there is always a
 * fallback intent, so this always resolves a `ChatAnswer`.
 */
export async function answerSiteQuestion(message: string, context: ChatContext): Promise<ChatAnswer> {
  const normalized = normalize(message);
  const intent = INTENTS.find((candidate) => candidate.test(normalized));
  if (!intent) return { text: FALLBACK_MESSAGE };

  try {
    const text = await intent.handle(context);
    return { text };
  } catch {
    return { text: FETCH_FAILURE_MESSAGE };
  }
}
