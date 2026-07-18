import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Filter, type Sort } from "mongodb";
import type { Manager, ManagersResponse } from "@/types/manager";

const MAX_LIMIT = 200;
const SORTABLE_FIELDS = new Set([
  "contactName",
  "managerId",
  "firstName",
  "lastName",
  "email",
  "phone",
  "department",
  "jobTitle",
  "status",
  "location",
  "country",
  "salary",
  "yearsOfExperience",
  "performanceScore",
  "projectsCompleted",
  "joinDate",
  "lastLoginAt",
  "skills",
]);

function parsePositiveInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(parsed)));
}

function parsePayload(input: unknown) {
  if (!input || typeof input !== "object") {
    return {} as Record<string, unknown>;
  }
  return input as Record<string, unknown>;
}

function buildSearchFilter(search: string, department: string): Filter<any> {
  const filter: Filter<any> = {};

  if (department) {
    filter.department = department;
  }

  if (search) {
    const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    filter.$or = [
      { firstName: { $regex: escaped, $options: "i" } },
      { lastName: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { managerId: { $regex: escaped, $options: "i" } },
      { jobTitle: { $regex: escaped, $options: "i" } },
    ];
  }

  return filter;
}

/**
 * Maps a raw MongoDB manager document into the client-side Manager shape.
 * Converts `_id` → `id` for the manager and generates stable `id` values
 * for each embedded direct report from its `reportId`.
 */
function mapManagerDocument(doc: any): Manager {
  const { _id, directReports, ...rest } = doc;
  const subRows = Array.isArray(directReports) && directReports.length > 0
    ? directReports.map((report: any) => ({
        ...report,
        id: report.reportId, // Stable row identity for TanStack Table
      }))
    : undefined;

  return {
    ...rest,
    id: _id instanceof ObjectId ? _id.toHexString() : String(_id),
    subRows,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parsePositiveInteger(searchParams.get("page"), 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePositiveInteger(searchParams.get("limit"), 50, 1, MAX_LIMIT);
  const search = (searchParams.get("search") ?? "").trim();
  const department = (searchParams.get("department") ?? "").trim();
  const sortBy = searchParams.get("sortBy");
  const sortDirection = searchParams.get("sortDirection");

  return listManagers({
    page,
    limit,
    search,
    department,
    sortBy: sortBy && SORTABLE_FIELDS.has(sortBy) ? sortBy : null,
    sortDirection: sortDirection === "desc" ? -1 : 1,
  });
}

export async function POST(request: NextRequest) {
  const payload = parsePayload(await request.json().catch(() => ({})));
  const page = parsePositiveInteger(payload.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePositiveInteger(payload.limit, 50, 1, MAX_LIMIT);
  const search = typeof payload.search === "string" ? payload.search.trim() : "";
  const department = typeof payload.department === "string" ? payload.department.trim() : "";
  const sortBy = typeof payload.sortBy === "string" && SORTABLE_FIELDS.has(payload.sortBy) ? payload.sortBy : null;
  const sortDirection = payload.sortDirection === "desc" ? -1 : 1;

  return listManagers({ page, limit, search, department, sortBy, sortDirection });
}

async function listManagers({
  page,
  limit,
  search,
  department,
  sortBy,
  sortDirection,
}: {
  page: number;
  limit: number;
  search: string;
  department: string;
  sortBy: string | null;
  sortDirection: 1 | -1;
}) {
  const offset = (page - 1) * limit;

  const db = await getDb();
  const collection = db.collection("managers");
  const filter = buildSearchFilter(search, department);
  const sort: Sort =
    sortBy === "contactName"
      ? { firstName: sortDirection, lastName: sortDirection, _id: sortDirection }
      : sortBy
        ? { [sortBy]: sortDirection, _id: sortDirection }
        : { managerId: 1, _id: 1 };

  const [filteredCount, documents, totalCount] = await Promise.all([
    collection.countDocuments(filter),
    collection.find(filter).sort(sort).skip(offset).limit(limit).toArray(),
    page === 1 ? collection.countDocuments({}) : Promise.resolve(0),
  ]);

  const rows: Manager[] = documents.map(mapManagerDocument);
  const nextOffset = offset + rows.length < filteredCount ? offset + rows.length : null;

  const body: ManagersResponse = {
    rows,
    nextOffset,
    totalCount,
    filteredCount,
  };

  return NextResponse.json(body);
}
