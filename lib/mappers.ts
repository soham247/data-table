import { ObjectId } from "mongodb";
import type { Employee } from "@/types/employee";

export interface EmployeeDocument extends Omit<Employee, "id"> {
  _id: ObjectId;
}

export function mapEmployeeDocument(document: EmployeeDocument): Employee {
  const { _id, ...employee } = document;
  return {
    ...employee,
    id: _id.toHexString(),
  };
}

export function mapEmployeeDocuments(documents: EmployeeDocument[]): Employee[] {
  return documents.map(mapEmployeeDocument);
}
