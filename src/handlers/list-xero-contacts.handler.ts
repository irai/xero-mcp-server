import { xeroClient } from "../clients/xero-client.js";
import { Contact } from "xero-node";
import { XeroClientResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { getClientHeaders } from "../helpers/get-client-headers.js";

async function getContacts(
  page?: number,
  where?: string,
  ids?: string[],
  summaryOnly: boolean = true,
  searchTerm?: string,
  ifModifiedSince?: Date
): Promise<Contact[]> {
  await xeroClient.authenticate();

  const contacts = await xeroClient.accountingApi.getContacts(
    xeroClient.tenantId,
    ifModifiedSince, // ifModifiedSince
    where, // where
    undefined, // order
    ids, // iDs
    page ? Number(page) : undefined, // page - ensure it's a number
    undefined, // includeArchived
    summaryOnly, // summaryOnly
    searchTerm, // searchTerm
    undefined, // pageSize
    getClientHeaders(),
  );
  return contacts.body.contacts ?? [];
}

/**
 * List all contacts from Xero
 */
export async function listXeroContacts(
  page?: number,
  where?: string,
  ids?: string[],
  summaryOnly: boolean = true,
  searchTerm?: string,
  ifModifiedSince?: Date
): Promise<XeroClientResponse<Contact[]>> {
  try {
    const contacts = await getContacts(page, where, ids, summaryOnly, searchTerm, ifModifiedSince);

    return {
      result: contacts,
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      result: null,
      isError: true,
      error: formatError(error),
    };
  }
}
