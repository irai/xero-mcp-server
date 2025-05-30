import { listXeroContacts } from "../../handlers/list-xero-contacts.handler.js";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { z } from "zod";

const ListContactsTool = CreateXeroTool(
  "list-contacts",
  "List all contacts in Xero. This includes Suppliers and Customers.",
  {
    page: z.coerce.number().optional().describe("Optional page number to retrieve for pagination. \
      If not provided, the first page will be returned. If 100 contacts are returned, \
      call this tool again with the next page number."),
    where: z.coerce.string().optional().describe("Optional filter expression to filter contacts. \
      Example: 'where=peter', 'where=Name=\"ABC limited\"', 'where=EmailAddress=\"email@example.com\"', where=AccountNumber=\"ABC-100\"'"),
    ids: z.array(z.coerce.string()).nullable().optional().transform(val => val === null ? undefined : val).describe("Optional array of contact IDs to filter by. \
      If provided, only contacts with these IDs will be returned."),
    // TODO: searchTerm is not working
    // searchTerm: z.coerce.string().optional().describe("Optional search term to filter contacts by name, first name, last name, \
    // email, or other contact details."),  
  },
  async (params) => {
    const { page, where, ids } = params;
    const response = await listXeroContacts(page, where, ids, undefined);

    if (response.isError) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing contacts: ${response.error}`,
          },
        ],
      };
    }

    const contacts = response.result;

    if (!contacts?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "no contacts found",
          },
        ],
      };
    }

    return {
      content: contacts.map((contact) => ({
        type: "text" as const,
        text: [
          `Contact: ${contact.name}`,
          `ID: ${contact.contactID}`,
          contact.firstName ? `First Name: ${contact.firstName}` : null,
          contact.lastName ? `Last Name: ${contact.lastName}` : null,
          contact.emailAddress
            ? `Email: ${contact.emailAddress}`
            : "No email",
          contact.accountsReceivableTaxType
            ? `AR Tax Type: ${contact.accountsReceivableTaxType}`
            : null,
          contact.accountsPayableTaxType
            ? `AP Tax Type: ${contact.accountsPayableTaxType}`
            : null,
          `Type: ${
            [
              contact.isCustomer ? "Customer" : null,
              contact.isSupplier ? "Supplier" : null,
            ]
              .filter(Boolean)
              .join(", ") || "Unknown"
          }`,
          contact.defaultCurrency
            ? `Default Currency: ${contact.defaultCurrency}`
            : null,
          contact.updatedDateUTC
            ? `Last Updated: ${contact.updatedDateUTC}`
            : null,
          `Status: ${contact.contactStatus || "Unknown"}`,
          contact.contactGroups?.length
            ? `Groups: ${contact.contactGroups.map((g) => g.name).join(", ")}`
            : null,
          contact.hasAttachments ? "Has Attachments: Yes" : null,
          contact.hasValidationErrors ? "Has Validation Errors: Yes" : null,
        ]
          .filter(Boolean)
          .join("\n"),
      })),
    };
  },
);

export default ListContactsTool;
