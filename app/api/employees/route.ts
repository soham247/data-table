import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { mapEmployeeDocuments, type EmployeeDocument } from "@/lib/mappers";
import { ObjectId, type Filter, type Sort } from "mongodb";
import type { EmployeesResponse } from "@/types/employee";

const MAX_LIMIT = 200;
const SORTABLE_FIELDS = new Set([
  "contactName",
  "employeeId",
  "firstName",
  "lastName",
  "email",
  "phone",
  "department",
  "jobTitle",
  "status",
  "location",
  "country",
  "manager",
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

function buildSearchFilter(search: string, department: string): Filter<EmployeeDocument> {
  const filter: Filter<EmployeeDocument> = {};

  if (department) {
    filter.department = department;
  }

  if (search) {
    // Standard robust regex escaper covering all PCRE special chars.
    const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    filter.$or = [
      { firstName: { $regex: escaped, $options: "i" } },
      { lastName: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { employeeId: { $regex: escaped, $options: "i" } },
      { jobTitle: { $regex: escaped, $options: "i" } },
    ];
  }

  return filter;
}

// GET is kept for direct browser navigation and external consumers
// that prefer query-string params over a JSON body.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parsePositiveInteger(searchParams.get("page"), 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePositiveInteger(searchParams.get("limit"), 50, 1, MAX_LIMIT);
  const search = (searchParams.get("search") ?? "").trim();
  const department = (searchParams.get("department") ?? "").trim();
  const sortBy = searchParams.get("sortBy");
  const sortDirection = searchParams.get("sortDirection");

  return listEmployees({
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

  return listEmployees({ page, limit, search, department, sortBy, sortDirection });
}

export async function DELETE(request: NextRequest) {
  const payload = parsePayload(await request.json().catch(() => ({})));
  const ids = Array.isArray(payload.ids)
    ? payload.ids.filter((value): value is string => typeof value === "string")
    : typeof payload.id === "string"
      ? [payload.id]
      : [];

  if (!ids.length) {
    return NextResponse.json({ message: "No employee ids provided" }, { status: 400 });
  }

  const objectIds = ids.filter(ObjectId.isValid).map((id) => new ObjectId(id));

  if (!objectIds.length) {
    return NextResponse.json({ message: "No valid employee ids provided" }, { status: 400 });
  }

  const db = await getDb();
  const collection = db.collection<EmployeeDocument>("employees");
  const result = await collection.deleteMany({ _id: { $in: objectIds } });

  return NextResponse.json({ deletedCount: result.deletedCount });
}

async function listEmployees({
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
  const collection = db.collection<EmployeeDocument>("employees");
  const filter = buildSearchFilter(search, department);
  const sort: Sort =
    sortBy === "contactName"
      ? { firstName: sortDirection, lastName: sortDirection, _id: sortDirection }
      : sortBy
        ? { [sortBy]: sortDirection, _id: sortDirection }
        : { employeeId: 1, _id: 1 };

  const [filteredCount, documents, totalCount] = await Promise.all([
    collection.countDocuments(filter),
    collection.find(filter).sort(sort).skip(offset).limit(limit).toArray(),
    // Fix #5: totalCount is a full-collection scan that never changes with
    // filters. Only compute it on the first page — the client reads it from
    // pages[0].totalCount and caches it for subsequent pages.
    page === 1 ? collection.countDocuments({}) : Promise.resolve(0),
  ]);

  const rows = mapEmployeeDocuments(documents);
  const nextOffset = offset + rows.length < filteredCount ? offset + rows.length : null;

  // On page > 1 the client already has totalCount from the first page.
  // Return 0 as a sentinel; the client ignores it for pages[1+].
  const body: EmployeesResponse = {
    rows,
    nextOffset,
    totalCount,
    filteredCount,
  };

  return NextResponse.json(body);
}
